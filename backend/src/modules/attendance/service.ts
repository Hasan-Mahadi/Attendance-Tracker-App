import mongoose from 'mongoose';
import {
  AttendanceRecord,
  AttendancePolicy,
  AttendanceCorrection,
  WorkSchedule,
  Employee,
  AuditLog,
  IAttendanceRecord,
} from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  AttendanceStatuses,
  AttendanceStatus,
  ApprovalStatuses,
  CorrectionStatuses,
  Roles,
} from '../../config/constants.js';

// Convert a date to UTC start-of-day for Asia/Dhaka (UTC+6)
export function getDhakaDateOnly(date: Date = new Date()): Date {
  const d = new Date(date);
  // Asia/Dhaka is UTC+6
  const dhakaOffsetMs = 6 * 60 * 60 * 1000;
  const dhakaTime = new Date(d.getTime() + dhakaOffsetMs);
  const year = dhakaTime.getUTCFullYear();
  const month = dhakaTime.getUTCMonth();
  const day = dhakaTime.getUTCDate();
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
}

// Parse "HH:mm" on a given base date in Dhaka time
export function parseScheduleDateTime(timeStr: string, baseDate: Date): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  // baseDate is UTC start of day in Dhaka
  // Subtract 6 hours to get UTC equivalent of Dhaka HH:mm
  const utcHours = hours - 6;
  const result = new Date(baseDate);
  result.setUTCHours(utcHours, minutes, 0, 0);
  return result;
}

export class AttendanceService {
  /**
   * Get employee's schedule and attendance policy
   */
  private static async getEmployeeConfig(employeeId: string) {
    const employee = await Employee.findById(employeeId)
      .populate('workSchedule')
      .populate('attendancePolicy');

    if (!employee) {
      throw ApiError.notFound('Employee profile not found');
    }

    let schedule = employee.workSchedule as any;
    if (!schedule) {
      schedule = await WorkSchedule.findOne({ isDefault: true, isActive: true });
    }
    if (!schedule) {
      // Fallback 09:00 - 18:00
      schedule = {
        startTime: '09:00',
        endTime: '18:00',
        lunchStartTime: '13:00',
        lunchEndTime: '14:00',
        lunchDurationMinutes: 60,
      };
    }

    let policy = employee.attendancePolicy as any;
    if (!policy) {
      policy = await AttendancePolicy.findOne({ isDefault: true, isActive: true });
    }
    if (!policy) {
      // Fallback policy
      policy = {
        lateGraceMinutes: 10,
        halfDayThresholdMinutes: 240, // 4 hours
        minimumWorkingMinutes: 480, // 8 hours
        earlyDepartureThresholdMinutes: 15,
      };
    }

    return { employee, schedule, policy };
  }

  /**
   * Get today's attendance record for an employee
   */
  static async getTodayAttendance(employeeId: string) {
    const today = getDhakaDateOnly();
    const record = await AttendanceRecord.findOne({
      employee: employeeId,
      date: today,
    });
    return record;
  }

  /**
   * Employee Check-In
   */
  static async checkIn(employeeId: string, userId: string, notes?: string) {
    const today = getDhakaDateOnly();
    const now = new Date();

    let record = await AttendanceRecord.findOne({ employee: employeeId, date: today });
    if (record && record.actualCheckInTime) {
      throw ApiError.badRequest('You have already checked in for today');
    }

    const { schedule, policy } = await this.getEmployeeConfig(employeeId);

    const scheduledStart = parseScheduleDateTime(schedule.startTime, today);
    const scheduledEnd = parseScheduleDateTime(schedule.endTime, today);

    // Calculate late minutes
    const graceMinutes = policy.lateGraceMinutes || 10;
    const diffMs = now.getTime() - scheduledStart.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    let lateMinutes = 0;
    let status: AttendanceStatus = AttendanceStatuses.PRESENT;
    let message = 'Thank you for checking in on time. Have a productive day!';

    if (diffMinutes > graceMinutes) {
      lateMinutes = diffMinutes;
      status = AttendanceStatuses.LATE;
      message = `Your check-in was recorded. You are ${lateMinutes} minutes late today.`;
    }

    if (record) {
      record.actualCheckInTime = now;
      record.scheduledStartTime = scheduledStart;
      record.scheduledEndTime = scheduledEnd;
      record.lateMinutes = lateMinutes;
      record.status = status;
      record.notes = notes;
      record.updatedBy = new mongoose.Types.ObjectId(userId);
      await record.save();
    } else {
      record = await AttendanceRecord.create({
        employee: employeeId,
        date: today,
        scheduledStartTime: scheduledStart,
        scheduledEndTime: scheduledEnd,
        actualCheckInTime: now,
        lateMinutes,
        status,
        approvalStatus: ApprovalStatuses.AUTO_APPROVED,
        notes,
        createdBy: userId,
      });
    }

    return { record, message, isLate: lateMinutes > 0, lateMinutes };
  }

  /**
   * Employee Check-Out
   */
  static async checkOut(employeeId: string, userId: string, notes?: string) {
    const today = getDhakaDateOnly();
    const now = new Date();

    const record = await AttendanceRecord.findOne({ employee: employeeId, date: today });
    if (!record || !record.actualCheckInTime) {
      throw ApiError.badRequest('You must check in before checking out');
    }

    if (record.actualCheckOutTime) {
      throw ApiError.badRequest('You have already checked out for today');
    }

    const { schedule, policy } = await this.getEmployeeConfig(employeeId);
    const scheduledEnd = record.scheduledEndTime || parseScheduleDateTime(schedule.endTime, today);

    record.actualCheckOutTime = now;

    // Early departure calculation
    const earlyDepartureThreshold = policy.earlyDepartureThresholdMinutes || 15;
    const endDiffMs = scheduledEnd.getTime() - now.getTime();
    const earlyMinutes = Math.floor(endDiffMs / (1000 * 60));
    if (earlyMinutes > earlyDepartureThreshold) {
      record.earlyDepartureMinutes = earlyMinutes;
    }

    // Working hours calculation
    const grossMs = now.getTime() - record.actualCheckInTime.getTime();
    record.grossMinutes = Math.max(0, Math.floor(grossMs / (1000 * 60)));

    // Total breaks / lunch
    record.breakMinutes = record.lunchDurationMinutes || 0;
    record.netWorkingMinutes = Math.max(0, record.grossMinutes - record.breakMinutes);

    // Check half day threshold
    const halfDayThreshold = policy.halfDayThresholdMinutes || 240;
    if (record.netWorkingMinutes < halfDayThreshold && record.status !== AttendanceStatuses.ON_LEAVE) {
      record.status = AttendanceStatuses.HALF_DAY;
    }

    if (notes) record.notes = record.notes ? `${record.notes} | ${notes}` : notes;
    record.updatedBy = new mongoose.Types.ObjectId(userId);
    await record.save();

    const hours = Math.floor(record.netWorkingMinutes / 60);
    const mins = record.netWorkingMinutes % 60;

    return {
      record,
      message: `Checked out successfully. Total net working time: ${hours}h ${mins}m.`,
      netWorkingMinutes: record.netWorkingMinutes,
    };
  }

  /**
   * Lunch Out
   */
  static async lunchOut(employeeId: string, userId: string) {
    const today = getDhakaDateOnly();
    const record = await AttendanceRecord.findOne({ employee: employeeId, date: today });
    if (!record || !record.actualCheckInTime) {
      throw ApiError.badRequest('You must check in before taking lunch break');
    }
    if (record.lunchOutTime && !record.lunchInTime) {
      throw ApiError.badRequest('You are already out for lunch');
    }

    record.lunchOutTime = new Date();
    record.updatedBy = new mongoose.Types.ObjectId(userId);
    await record.save();

    return { record, message: 'Lunch break started' };
  }

  /**
   * Lunch In
   */
  static async lunchIn(employeeId: string, userId: string) {
    const today = getDhakaDateOnly();
    const record = await AttendanceRecord.findOne({ employee: employeeId, date: today });
    if (!record || !record.lunchOutTime) {
      throw ApiError.badRequest('You have not marked lunch out yet');
    }
    if (record.lunchInTime) {
      throw ApiError.badRequest('Lunch break already completed for today');
    }

    const now = new Date();
    record.lunchInTime = now;
    const durationMs = now.getTime() - record.lunchOutTime.getTime();
    record.lunchDurationMinutes = Math.max(0, Math.floor(durationMs / (1000 * 60)));
    record.breakMinutes = record.lunchDurationMinutes;
    record.updatedBy = new mongoose.Types.ObjectId(userId);
    await record.save();

    return {
      record,
      message: `Lunch break ended (${record.lunchDurationMinutes} minutes)`,
      durationMinutes: record.lunchDurationMinutes,
    };
  }

  /**
   * Get employee's attendance history
   */
  static async getEmployeeAttendance(
    employeeId: string,
    params: { month?: number; year?: number; startDate?: string; endDate?: string }
  ) {
    const query: Record<string, unknown> = { employee: employeeId };

    if (params.startDate && params.endDate) {
      query.date = {
        $gte: new Date(params.startDate),
        $lte: new Date(params.endDate),
      };
    } else if (params.month && params.year) {
      const start = new Date(Date.UTC(Number(params.year), Number(params.month) - 1, 1));
      const end = new Date(Date.UTC(Number(params.year), Number(params.month), 0, 23, 59, 59));
      query.date = { $gte: start, $lte: end };
    }

    const records = await AttendanceRecord.find(query).sort({ date: -1 });
    return records;
  }

  /**
   * Admin/HR get all attendance records with filters & pagination
   */
  static async getCompanyAttendance(params: {
    page?: number;
    limit?: number;
    date?: string;
    month?: number;
    year?: number;
    department?: string;
    status?: string;
    employeeId?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (params.date) {
      const d = getDhakaDateOnly(new Date(params.date));
      query.date = d;
    } else if (params.month && params.year) {
      const start = new Date(Date.UTC(Number(params.year), Number(params.month) - 1, 1));
      const end = new Date(Date.UTC(Number(params.year), Number(params.month), 0, 23, 59, 59));
      query.date = { $gte: start, $lte: end };
    }

    if (params.status) {
      query.status = params.status;
    }

    if (params.employeeId) {
      query.employee = params.employeeId;
    }

    if (params.department) {
      const employeesInDept = await Employee.find({ department: params.department }).select('_id');
      query.employee = { $in: employeesInDept.map((e) => e._id) };
    }

    const [items, totalItems] = await Promise.all([
      AttendanceRecord.find(query)
        .populate({
          path: 'employee',
          select: 'employeeCode firstName lastName designation department profileImage',
          populate: { path: 'department', select: 'name' },
        })
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AttendanceRecord.countDocuments(query),
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

  /**
   * Request attendance correction
   */
  static async requestCorrection(data: {
    attendanceRecordId: string;
    employeeId: string;
    correctedData: Record<string, unknown>;
    reason: string;
    requestedBy: string;
  }) {
    const record = await AttendanceRecord.findById(data.attendanceRecordId);
    if (!record) {
      throw ApiError.notFound('Attendance record not found');
    }

    const correction = await AttendanceCorrection.create({
      attendanceRecord: record._id,
      employee: record.employee,
      previousData: record.toObject(),
      correctedData: data.correctedData,
      reason: data.reason,
      status: CorrectionStatuses.PENDING,
      requestedBy: data.requestedBy,
    });

    return correction;
  }

  /**
   * Admin approve or reject attendance correction
   */
  static async reviewCorrection(
    correctionId: string,
    action: 'approved' | 'rejected',
    reviewNotes: string | undefined,
    reviewedBy: string
  ) {
    const correction = await AttendanceCorrection.findById(correctionId);
    if (!correction) {
      throw ApiError.notFound('Correction request not found');
    }

    if (correction.status !== CorrectionStatuses.PENDING) {
      throw ApiError.badRequest('Correction request has already been reviewed');
    }

    correction.status = action === 'approved' ? CorrectionStatuses.APPROVED : CorrectionStatuses.REJECTED;
    correction.reviewedBy = new mongoose.Types.ObjectId(reviewedBy);
    correction.reviewedAt = new Date();
    correction.reviewNotes = reviewNotes;
    await correction.save();

    if (action === 'approved') {
      const record = await AttendanceRecord.findById(correction.attendanceRecord);
      if (record) {
        // Apply approved corrected fields
        const c = correction.correctedData as any;
        if (c.actualCheckInTime) record.actualCheckInTime = new Date(c.actualCheckInTime);
        if (c.actualCheckOutTime) record.actualCheckOutTime = new Date(c.actualCheckOutTime);
        if (c.lateMinutes !== undefined) record.lateMinutes = c.lateMinutes;
        if (c.status) record.status = c.status;
        if (c.netWorkingMinutes !== undefined) record.netWorkingMinutes = c.netWorkingMinutes;
        record.correctionReason = correction.reason;
        record.updatedBy = new mongoose.Types.ObjectId(reviewedBy);
        await record.save();

        await AuditLog.create({
          userId: reviewedBy,
          action: 'ATTENDANCE_CORRECTION_APPROVED',
          resource: 'AttendanceRecord',
          resourceId: record._id.toString(),
          previousData: correction.previousData,
          newData: record.toObject(),
        });
      }
    }

    return correction;
  }

  /**
   * Admin manual attendance entry/override
   */
  static async manualEntry(data: {
    employeeId: string;
    date: string;
    actualCheckInTime?: string;
    actualCheckOutTime?: string;
    status: string;
    reason: string;
    adminUserId: string;
  }) {
    const recordDate = getDhakaDateOnly(new Date(data.date));

    let record = await AttendanceRecord.findOne({
      employee: data.employeeId,
      date: recordDate,
    });

    const previousData = record ? record.toObject() : null;

    if (!record) {
      record = new AttendanceRecord({
        employee: data.employeeId,
        date: recordDate,
        isManualEntry: true,
        createdBy: data.adminUserId,
      });
    }

    if (data.actualCheckInTime) record.actualCheckInTime = new Date(data.actualCheckInTime);
    if (data.actualCheckOutTime) record.actualCheckOutTime = new Date(data.actualCheckOutTime);
    record.status = data.status as any;
    record.correctionReason = data.reason;
    record.isManualEntry = true;
    record.updatedBy = new mongoose.Types.ObjectId(data.adminUserId);

    // Calculate net working minutes if both times exist
    if (record.actualCheckInTime && record.actualCheckOutTime) {
      const diffMs = record.actualCheckOutTime.getTime() - record.actualCheckInTime.getTime();
      record.grossMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
      record.netWorkingMinutes = record.grossMinutes;
    }

    await record.save();

    await AuditLog.create({
      userId: data.adminUserId,
      action: 'ATTENDANCE_MANUAL_ENTRY',
      resource: 'AttendanceRecord',
      resourceId: record._id.toString(),
      previousData,
      newData: record.toObject(),
    });

    return record;
  }
}
