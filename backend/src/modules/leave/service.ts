import mongoose from 'mongoose';
import {
  LeaveCategory,
  LeavePolicy,
  LeaveBalance,
  LeaveLedgerEntry,
  LeaveRequest,
  AttendanceRecord,
  AuditLog,
  Employee,
} from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  LeaveStatuses,
  LeaveLedgerTypes,
  AttendanceStatuses,
  ApprovalStatuses,
  Roles,
} from '../../config/constants.js';
import { getDhakaDateOnly } from '../attendance/service.js';

export class LeaveService {
  /**
   * Get all active leave categories
   */
  static async getCategories() {
    return LeaveCategory.find({ isActive: true }).sort({ order: 1 });
  }

  /**
   * Get all leave policies
   */
  static async getPolicies() {
    return LeavePolicy.find({ isActive: true }).populate('leaveCategory');
  }

  /**
   * Get or initialize leave balances for an employee in a given year
   */
  static async getEmployeeBalances(employeeId: string, year: number = new Date().getFullYear()) {
    const policies = await LeavePolicy.find({ isActive: true }).populate('leaveCategory');

    for (const policy of policies) {
      if (!policy.leaveCategory) continue;
      const catId = (policy.leaveCategory as any)._id;

      let bal = await LeaveBalance.findOne({ employee: employeeId, leaveCategory: catId, year });
      if (!bal) {
        bal = await LeaveBalance.create({
          employee: employeeId,
          leaveCategory: catId,
          year,
          allocated: policy.annualAllocation,
          used: 0,
          pending: 0,
          carriedForward: 0,
          balance: policy.annualAllocation,
        });

        await LeaveLedgerEntry.create({
          employee: employeeId,
          leaveCategory: catId,
          year,
          type: LeaveLedgerTypes.ALLOCATION,
          amount: policy.annualAllocation,
          balanceAfter: policy.annualAllocation,
          description: `Annual allocation for ${year}`,
          createdBy: new mongoose.Types.ObjectId(employeeId),
        });
      } else {
        // Sync allocation if policy was updated by admin
        if (bal.allocated !== policy.annualAllocation) {
          bal.allocated = policy.annualAllocation;
          bal.balance = bal.allocated + bal.carriedForward - bal.used - bal.pending;
          await bal.save();
        }
      }
    }

    return LeaveBalance.find({ employee: employeeId, year }).populate('leaveCategory');
  }

  /**
   * Submit a new leave request
   */
  static async submitRequest(data: {
    employeeId: string;
    leaveCategoryId: string;
    startDate: string;
    endDate: string;
    isHalfDay?: boolean;
    halfDayDate?: string;
    reason: string;
    userId: string;
  }) {
    const start = getDhakaDateOnly(new Date(data.startDate));
    const end = getDhakaDateOnly(new Date(data.endDate));

    if (end < start) {
      throw ApiError.badRequest('End date cannot be earlier than start date');
    }

    // Calculate total days
    let totalDays = 0;
    if (data.isHalfDay) {
      totalDays = 0.5;
    } else {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    const year = start.getUTCFullYear();

    // Check balance
    let balanceDoc = await LeaveBalance.findOne({
      employee: data.employeeId,
      leaveCategory: data.leaveCategoryId,
      year,
    });

    if (!balanceDoc) {
      await this.getEmployeeBalances(data.employeeId, year);
      balanceDoc = await LeaveBalance.findOne({
        employee: data.employeeId,
        leaveCategory: data.leaveCategoryId,
        year,
      });
    }

    const category = await LeaveCategory.findById(data.leaveCategoryId);
    if (!category) {
      throw ApiError.notFound('Leave category not found');
    }

    // If paid leave, verify available balance
    if (category.isPaid && balanceDoc) {
      const available = balanceDoc.balance;
      if (available < totalDays) {
        throw ApiError.badRequest(
          `Insufficient leave balance. You have ${available} days available, but requested ${totalDays} days.`
        );
      }
    }

    // Create leave request
    const leaveRequest = await LeaveRequest.create({
      employee: data.employeeId,
      leaveCategory: data.leaveCategoryId,
      startDate: start,
      endDate: end,
      totalDays,
      isHalfDay: !!data.isHalfDay,
      halfDayDate: data.halfDayDate ? getDhakaDateOnly(new Date(data.halfDayDate)) : undefined,
      reason: data.reason,
      status: LeaveStatuses.PENDING,
    });

    // Update pending balance
    if (balanceDoc) {
      balanceDoc.pending += totalDays;
      balanceDoc.balance = Math.max(0, balanceDoc.allocated + balanceDoc.carriedForward - balanceDoc.used - balanceDoc.pending);
      await balanceDoc.save();
    }

    return leaveRequest;
  }

  /**
   * Review (Approve / Reject) Leave Request
   */
  static async reviewRequest(
    requestId: string,
    action: 'approved' | 'rejected',
    reviewNotes: string | undefined,
    reviewedByUserId: string
  ) {
    const request = await LeaveRequest.findById(requestId).populate('leaveCategory');
    if (!request) {
      throw ApiError.notFound('Leave request not found');
    }

    if (request.status !== LeaveStatuses.PENDING) {
      throw ApiError.badRequest('This leave request is not pending review');
    }

    const year = new Date(request.startDate).getUTCFullYear();
    const balanceDoc = await LeaveBalance.findOne({
      employee: request.employee,
      leaveCategory: request.leaveCategory,
      year,
    });

    if (action === 'approved') {
      request.status = LeaveStatuses.APPROVED;
      request.reviewedBy = new mongoose.Types.ObjectId(reviewedByUserId);
      request.reviewedAt = new Date();
      request.reviewNotes = reviewNotes;
      await request.save();

      // Deduct balance and ledger
      if (balanceDoc) {
        balanceDoc.pending = Math.max(0, balanceDoc.pending - request.totalDays);
        balanceDoc.used += request.totalDays;
        balanceDoc.balance = Math.max(
          0,
          balanceDoc.allocated + balanceDoc.carriedForward - balanceDoc.used - balanceDoc.pending
        );
        await balanceDoc.save();

        await LeaveLedgerEntry.create({
          employee: request.employee,
          leaveCategory: (request.leaveCategory as any)._id,
          leaveRequest: request._id,
          year,
          type: LeaveLedgerTypes.DEDUCTION,
          amount: -request.totalDays,
          balanceAfter: balanceDoc.balance,
          description: `Approved leave request for ${request.totalDays} day(s)`,
          createdBy: reviewedByUserId,
        });
      }

      // Automatically create or update AttendanceRecords for approved leave dates
      const current = new Date(request.startDate);
      const end = new Date(request.endDate);

      while (current <= end) {
        const dateOnly = getDhakaDateOnly(current);
        await AttendanceRecord.findOneAndUpdate(
          { employee: request.employee, date: dateOnly },
          {
            $set: {
              status: AttendanceStatuses.ON_LEAVE,
              approvalStatus: ApprovalStatuses.APPROVED,
              notes: `Approved leave: ${(request.leaveCategory as any).name || 'Leave'}`,
            },
          },
          { upsert: true, new: true }
        );
        current.setDate(current.getDate() + 1);
      }
    } else {
      // Rejected
      request.status = LeaveStatuses.REJECTED;
      request.reviewedBy = new mongoose.Types.ObjectId(reviewedByUserId);
      request.reviewedAt = new Date();
      request.reviewNotes = reviewNotes;
      await request.save();

      // Release pending balance
      if (balanceDoc) {
        balanceDoc.pending = Math.max(0, balanceDoc.pending - request.totalDays);
        balanceDoc.balance = Math.max(
          0,
          balanceDoc.allocated + balanceDoc.carriedForward - balanceDoc.used - balanceDoc.pending
        );
        await balanceDoc.save();
      }
    }

    return request;
  }

  /**
   * Cancel Leave Request
   */
  static async cancelRequest(requestId: string, employeeId: string, reason: string) {
    const request = await LeaveRequest.findOne({ _id: requestId, employee: employeeId });
    if (!request) {
      throw ApiError.notFound('Leave request not found');
    }

    if (request.status === LeaveStatuses.CANCELLED || request.status === LeaveStatuses.REJECTED) {
      throw ApiError.badRequest('Request is already cancelled or rejected');
    }

    const year = new Date(request.startDate).getUTCFullYear();
    const balanceDoc = await LeaveBalance.findOne({
      employee: employeeId,
      leaveCategory: request.leaveCategory,
      year,
    });

    if (request.status === LeaveStatuses.PENDING) {
      // Just release pending
      if (balanceDoc) {
        balanceDoc.pending = Math.max(0, balanceDoc.pending - request.totalDays);
        balanceDoc.balance = Math.max(
          0,
          balanceDoc.allocated + balanceDoc.carriedForward - balanceDoc.used - balanceDoc.pending
        );
        await balanceDoc.save();
      }
    } else if (request.status === LeaveStatuses.APPROVED) {
      // If was approved, refund used balance
      if (balanceDoc) {
        balanceDoc.used = Math.max(0, balanceDoc.used - request.totalDays);
        balanceDoc.balance = Math.max(
          0,
          balanceDoc.allocated + balanceDoc.carriedForward - balanceDoc.used - balanceDoc.pending
        );
        await balanceDoc.save();

        await LeaveLedgerEntry.create({
          employee: employeeId,
          leaveCategory: request.leaveCategory,
          leaveRequest: request._id,
          year,
          type: LeaveLedgerTypes.CANCELLATION,
          amount: request.totalDays,
          balanceAfter: balanceDoc.balance,
          description: `Cancelled approved leave: ${reason}`,
          createdBy: employeeId,
        });
      }

      // Clear ON_LEAVE status from attendance records
      const current = new Date(request.startDate);
      const end = new Date(request.endDate);
      while (current <= end) {
        const dateOnly = getDhakaDateOnly(current);
        await AttendanceRecord.deleteOne({
          employee: employeeId,
          date: dateOnly,
          status: AttendanceStatuses.ON_LEAVE,
        });
        current.setDate(current.getDate() + 1);
      }
    }

    request.status = LeaveStatuses.CANCELLED;
    request.cancellationReason = reason;
    request.cancelledAt = new Date();
    await request.save();

    return request;
  }

  /**
   * Get employee leave requests
   */
  static async getEmployeeRequests(employeeId: string, status?: string) {
    const query: Record<string, unknown> = { employee: employeeId };
    if (status) query.status = status;
    return LeaveRequest.find(query)
      .populate('leaveCategory')
      .populate('reviewedBy', 'email')
      .sort({ createdAt: -1 });
  }

  /**
   * Admin/HR get all leave requests with filters & pagination
   */
  static async getAllRequests(params: {
    page?: number;
    limit?: number;
    status?: string;
    department?: string;
    employeeId?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (params.status) query.status = params.status;
    if (params.employeeId) query.employee = params.employeeId;

    if (params.department) {
      const emps = await Employee.find({ department: params.department }).select('_id');
      query.employee = { $in: emps.map((e) => e._id) };
    }

    const [items, totalItems] = await Promise.all([
      LeaveRequest.find(query)
        .populate({
          path: 'employee',
          select: 'employeeCode firstName lastName designation department profileImage',
          populate: { path: 'department', select: 'name' },
        })
        .populate('leaveCategory')
        .populate('reviewedBy', 'email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LeaveRequest.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
