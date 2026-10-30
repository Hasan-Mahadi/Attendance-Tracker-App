import {
  CompanySettings,
  WorkSchedule,
  AttendancePolicy,
  LeavePolicy,
  LeaveCategory,
  LeaveBalance,
  Employee,
  ExpenseCategory,
  PayrollPolicy,
  PerformancePolicy,
  AuditLog,
} from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  DEFAULT_TIMEZONE,
  DEFAULT_CURRENCY,
  DEFAULT_CURRENCY_SYMBOL,
} from '../../config/constants.js';

export class SettingsService {
  // ─── Company Settings ────────────────────────────────────────────

  /**
   * Get singleton company settings
   */
  static async getCompanySettings() {
    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = await CompanySettings.create({
        companyName: 'AIExpertsBD',
        timezone: DEFAULT_TIMEZONE,
        currency: DEFAULT_CURRENCY,
        currencySymbol: DEFAULT_CURRENCY_SYMBOL,
        workweek: [0, 1, 2, 3, 4], // Sun-Thu
        fiscalYearStartMonth: 1,
      });
    }
    return settings;
  }

  /**
   * Update company settings
   */
  static async updateCompanySettings(data: Record<string, unknown>, userId: string) {
    let settings = await CompanySettings.findOne();
    const previousData = settings ? settings.toObject() : null;

    if (!settings) {
      settings = new CompanySettings(data);
    } else {
      Object.assign(settings, data);
    }
    settings.updatedBy = userId as any;
    await settings.save();

    await AuditLog.create({
      userId,
      action: 'COMPANY_SETTINGS_UPDATE',
      resource: 'CompanySettings',
      resourceId: settings._id.toString(),
      previousData: previousData || undefined,
      newData: data,
    });

    return settings;
  }

  // ─── Work Schedules ──────────────────────────────────────────────

  /**
   * Work Schedules
   */
  static async getWorkSchedules() {
    let schedules = await WorkSchedule.find().sort({ isDefault: -1, name: 1 });
    if (schedules.length === 0) {
      const defaultSchedule = await WorkSchedule.create({
        name: 'Standard Office Shift (Sun-Thu)',
        startTime: '09:00',
        endTime: '18:00',
        workingDays: [0, 1, 2, 3, 4], // Sun-Thu
        lunchStartTime: '13:00',
        lunchEndTime: '14:00',
        lunchDurationMinutes: 60,
        isDefault: true,
        isActive: true,
      });
      schedules = [defaultSchedule];
    }
    return schedules;
  }

  static async createWorkSchedule(data: any, userId?: string) {
    if (data.isDefault) {
      await WorkSchedule.updateMany({}, { isDefault: false });
    }
    const schedule = await WorkSchedule.create(data);

    if (userId) {
      await AuditLog.create({
        userId,
        action: 'WORK_SCHEDULE_CREATE',
        resource: 'WorkSchedule',
        resourceId: schedule._id.toString(),
        newData: data,
      });
    }

    return schedule;
  }

  static async updateWorkSchedule(id: string, data: any, userId?: string) {
    const existing = await WorkSchedule.findById(id);
    if (!existing) throw ApiError.notFound('Work schedule not found');

    const previousData = existing.toObject();

    if (data.isDefault) {
      await WorkSchedule.updateMany({ _id: { $ne: id } }, { isDefault: false });
    }
    const updated = await WorkSchedule.findByIdAndUpdate(id, data, { new: true });

    if (userId) {
      await AuditLog.create({
        userId,
        action: 'WORK_SCHEDULE_UPDATE',
        resource: 'WorkSchedule',
        resourceId: id,
        previousData,
        newData: data,
      });
    }

    return updated;
  }

  // ─── Attendance Policies ─────────────────────────────────────────

  /**
   * Attendance Policies
   */
  static async getAttendancePolicies() {
    let policies = await AttendancePolicy.find().sort({ isDefault: -1, name: 1 });
    if (policies.length === 0) {
      const defaultPolicy = await AttendancePolicy.create({
        name: 'Standard Attendance Policy',
        lateGraceMinutes: 10,
        halfDayThresholdMinutes: 240, // 4 hours
        minimumWorkingMinutes: 480, // 8 hours
        earlyDepartureThresholdMinutes: 15,
        requireCheckout: true,
        allowAdminCorrection: true,
        isDefault: true,
        isActive: true,
      });
      policies = [defaultPolicy];
    }
    return policies;
  }

  static async updateAttendancePolicy(id: string, data: any, userId?: string) {
    const existing = await AttendancePolicy.findById(id);
    if (!existing) throw ApiError.notFound('Attendance policy not found');

    const previousData = existing.toObject();
    const updated = await AttendancePolicy.findByIdAndUpdate(id, data, { new: true });

    if (userId) {
      await AuditLog.create({
        userId,
        action: 'ATTENDANCE_POLICY_UPDATE',
        resource: 'AttendancePolicy',
        resourceId: id,
        previousData,
        newData: data,
      });
    }

    return updated;
  }

  // ─── Leave Categories ────────────────────────────────────────────

  /**
   * Get all leave categories
   */
  static async getLeaveCategories() {
    return LeaveCategory.find().sort({ order: 1, name: 1 });
  }

  /**
   * Create a new leave category
   */
  static async createLeaveCategory(data: any, userId: string) {
    const category = await LeaveCategory.create({
      name: data.name,
      code: data.code?.toUpperCase().trim(),
      description: data.description,
      isPaid: data.isPaid !== undefined ? data.isPaid : true,
      isActive: data.isActive !== undefined ? data.isActive : true,
      order: data.order || 0,
    });

    // Also create matching default LeavePolicy so it is immediately configured
    const allocation = typeof data.annualAllocation === 'number' ? data.annualAllocation : 10;
    const policy = await LeavePolicy.create({
      name: `${category.name} Policy`,
      leaveCategory: category._id,
      annualAllocation: allocation,
      monthlyAccrual: data.monthlyAccrual || 0,
      maxCarryForward: data.maxCarryForward || 0,
      allowHalfDay: data.allowHalfDay !== undefined ? data.allowHalfDay : true,
      minNoticeDays: data.minNoticeDays || 0,
      affectsSalary: !category.isPaid,
      requiresApproval: true,
      isDefault: true,
      isActive: true,
    });

    // Automatically initialize balances for all active employees for current year
    const currentYear = new Date().getFullYear();
    const activeEmployees = await Employee.find({ employmentStatus: 'active' });
    for (const emp of activeEmployees) {
      await LeaveBalance.findOneAndUpdate(
        { employee: emp._id, leaveCategory: category._id, year: currentYear },
        {
          $setOnInsert: {
            employee: emp._id,
            leaveCategory: category._id,
            year: currentYear,
            allocated: allocation,
            used: 0,
            pending: 0,
            carriedForward: 0,
            balance: allocation,
          },
        },
        { upsert: true }
      );
    }

    await AuditLog.create({
      userId,
      action: 'LEAVE_CATEGORY_CREATE',
      resource: 'LeaveCategory',
      resourceId: category._id.toString(),
      newData: { category: data, policyId: policy._id },
    });

    return category;
  }

  /**
   * Update leave category
   */
  static async updateLeaveCategory(id: string, data: any, userId: string) {
    const existing = await LeaveCategory.findById(id);
    if (!existing) throw ApiError.notFound('Leave category not found');

    const previousData = existing.toObject();
    const updated = await LeaveCategory.findByIdAndUpdate(id, data, { new: true });

    await AuditLog.create({
      userId,
      action: 'LEAVE_CATEGORY_UPDATE',
      resource: 'LeaveCategory',
      resourceId: id,
      previousData,
      newData: data,
    });

    return updated;
  }

  /**
   * Delete / deactivate leave category
   */
  static async deleteLeaveCategory(id: string, userId: string) {
    const existing = await LeaveCategory.findById(id);
    if (!existing) throw ApiError.notFound('Leave category not found');

    const previousData = existing.toObject();
    existing.isActive = false;
    await existing.save();

    await LeavePolicy.updateMany({ leaveCategory: id }, { isActive: false });

    await AuditLog.create({
      userId,
      action: 'LEAVE_CATEGORY_DELETE',
      resource: 'LeaveCategory',
      resourceId: id,
      previousData,
      newData: { isActive: false },
    });

    return existing;
  }

  // ─── Leave Policies ──────────────────────────────────────────────

  /**
   * Get all leave policies with populated category
   */
  static async getLeavePolicies() {
    return LeavePolicy.find()
      .populate('leaveCategory', 'name code isPaid')
      .sort({ isDefault: -1, name: 1 });
  }

  /**
   * Create a new leave policy
   */
  static async createLeavePolicy(data: any, userId: string) {
    const policy = await LeavePolicy.create(data);

    await AuditLog.create({
      userId,
      action: 'LEAVE_POLICY_CREATE',
      resource: 'LeavePolicy',
      resourceId: policy._id.toString(),
      newData: data,
    });

    return policy.populate('leaveCategory', 'name code isPaid');
  }

  /**
   * Update leave policy
   */
  static async updateLeavePolicy(id: string, data: any, userId: string) {
    const existing = await LeavePolicy.findById(id);
    if (!existing) throw ApiError.notFound('Leave policy not found');

    const previousData = existing.toObject();
    const updated = await LeavePolicy.findByIdAndUpdate(id, data, { new: true })
      .populate('leaveCategory', 'name code isPaid');

    // Synchronize existing employee leave balances for current year
    if (typeof data.annualAllocation === 'number') {
      const categoryId = existing.leaveCategory;
      const currentYear = new Date().getFullYear();
      const balances = await LeaveBalance.find({ leaveCategory: categoryId, year: currentYear });
      for (const bal of balances) {
        bal.allocated = data.annualAllocation;
        bal.balance = bal.allocated + bal.carriedForward - bal.used - bal.pending;
        await bal.save();
      }
    }

    await AuditLog.create({
      userId,
      action: 'LEAVE_POLICY_UPDATE',
      resource: 'LeavePolicy',
      resourceId: id,
      previousData,
      newData: data,
    });

    return updated;
  }

  // ─── Expense Categories ──────────────────────────────────────────

  /**
   * Get all expense categories
   */
  static async getExpenseCategories() {
    return ExpenseCategory.find().sort({ order: 1, name: 1 });
  }

  /**
   * Create a new expense category
   */
  static async createExpenseCategory(data: any, userId: string) {
    const category = await ExpenseCategory.create({
      name: data.name?.trim(),
      code: data.code?.toUpperCase().trim(),
      description: data.description?.trim(),
      isActive: data.isActive !== undefined ? data.isActive : true,
      order: data.order || 0,
    });

    await AuditLog.create({
      userId,
      action: 'EXPENSE_CATEGORY_CREATE',
      resource: 'ExpenseCategory',
      resourceId: category._id.toString(),
      newData: data,
    });

    return category;
  }

  /**
   * Update expense category
   */
  static async updateExpenseCategory(id: string, data: any, userId: string) {
    const existing = await ExpenseCategory.findById(id);
    if (!existing) throw ApiError.notFound('Expense category not found');

    const previousData = existing.toObject();
    const updated = await ExpenseCategory.findByIdAndUpdate(id, data, { new: true });

    await AuditLog.create({
      userId,
      action: 'EXPENSE_CATEGORY_UPDATE',
      resource: 'ExpenseCategory',
      resourceId: id,
      previousData,
      newData: data,
    });

    return updated;
  }

  /**
   * Soft-delete (deactivate) expense category
   */
  static async deleteExpenseCategory(id: string, userId: string) {
    const existing = await ExpenseCategory.findById(id);
    if (!existing) throw ApiError.notFound('Expense category not found');

    const previousData = existing.toObject();
    existing.isActive = false;
    await existing.save();

    await AuditLog.create({
      userId,
      action: 'EXPENSE_CATEGORY_DELETE',
      resource: 'ExpenseCategory',
      resourceId: id,
      previousData,
      newData: { isActive: false },
    });

    return existing;
  }

  // ─── Performance Policy ──────────────────────────────────────────

  /**
   * Get active performance policy
   */
  static async getPerformancePolicy() {
    let policy = await PerformancePolicy.findOne({ isActive: true, isDefault: true });
    if (!policy) {
      policy = await PerformancePolicy.create({
        name: 'Standard Attendance Bonus Policy',
        maxLateDays: 2,
        lateGraceMinutes: 10,
        minAttendancePercentage: 90,
        maxAbsentDays: 0,
        halfDayCountsAs: 0.5,
        bonusAmount: 200000, // ৳2,000 in paisa
        isDefault: true,
        isActive: true,
        effectiveFrom: new Date(),
      });
    }
    return policy;
  }

  /**
   * Update performance policy
   */
  static async updatePerformancePolicy(id: string, data: any, userId: string) {
    const existing = await PerformancePolicy.findById(id);
    if (!existing) throw ApiError.notFound('Performance policy not found');

    const previousData = existing.toObject();
    const updated = await PerformancePolicy.findByIdAndUpdate(id, data, { new: true });

    await AuditLog.create({
      userId,
      action: 'PERFORMANCE_POLICY_UPDATE',
      resource: 'PerformancePolicy',
      resourceId: id,
      previousData,
      newData: data,
    });

    return updated;
  }
}
