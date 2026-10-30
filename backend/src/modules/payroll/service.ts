import mongoose from 'mongoose';
import {
  PayrollPeriod,
  PayrollRecord,
  PayrollPolicy,
  PayrollAdjustment,
  SalaryProfile,
  AttendanceRecord,
  PerformanceEvaluation,
  Employee,
  AuditLog,
} from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  PayrollPeriodStatuses,
  PayrollRecordStatuses,
  AttendanceStatuses,
  PerformanceEvaluationStatuses,
  RoundingMethods,
  Roles,
} from '../../config/constants.js';

export class PayrollService {
  /**
   * Get active payroll policy
   */
  static async getActivePolicy() {
    let policy = await PayrollPolicy.findOne({ isActive: true, isDefault: true });
    if (!policy) {
      policy = await PayrollPolicy.create({
        name: 'Standard Company Policy',
        workingDayDivisor: 30,
        absentDeductionEnabled: true,
        halfDayDeductionRate: 0.5,
        unpaidLeaveDeductionEnabled: true,
        latePenaltyEnabled: false,
        maxGraceLateDaysPerMonth: 3,
        lateDeductionPerDayRate: 0.25,
        roundingMethod: RoundingMethods.ROUND,
        isDefault: true,
        isActive: true,
        effectiveFrom: new Date(),
      });
    }
    return policy;
  }

  /**
   * Preview or calculate payroll for a given month and year
   */
  static async calculatePayroll(month: number, year: number, policyId?: string) {
    const policy = policyId
      ? await PayrollPolicy.findById(policyId)
      : await this.getActivePolicy();

    if (!policy) throw ApiError.notFound('Payroll policy not found');

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));
    const daysInMonth = new Date(year, month, 0).getDate();

    const divisor = policy.useActualMonthDays ? daysInMonth : policy.workingDayDivisor || 30;

    // Get all active employees
    const employees = await Employee.find({
      employmentStatus: { $in: ['active', 'on_notice'] },
    }).populate('department');

    const records = [];
    let periodTotalGross = 0;
    let periodTotalDeductions = 0;
    let periodTotalNet = 0;
    let periodTotalBonuses = 0;

    for (const emp of employees) {
      // Find active salary profile
      const salaryProfile = await SalaryProfile.findOne({
        employee: emp._id,
        isActive: true,
        effectiveFrom: { $lte: endDate },
      }).sort({ effectiveFrom: -1 });

      const baseSalaryPaisa = salaryProfile ? salaryProfile.baseSalary : 0;
      const dailyRatePaisa = Math.round(baseSalaryPaisa / divisor);

      // Fetch all attendance records in this month
      const attendance = await AttendanceRecord.find({
        employee: emp._id,
        date: { $gte: startDate, $lte: endDate },
      });

      let daysPresent = 0;
      let daysAbsent = 0;
      let daysOnPaidLeave = 0;
      let daysOnUnpaidLeave = 0;
      let halfDays = 0;
      let holidays = 0;
      let weeklyOffs = 0;
      let lateDays = 0;
      let totalLateMinutes = 0;

      for (const att of attendance) {
        if (att.status === AttendanceStatuses.PRESENT) daysPresent++;
        else if (att.status === AttendanceStatuses.LATE) {
          daysPresent++;
          lateDays++;
          totalLateMinutes += att.lateMinutes || 0;
        } else if (att.status === AttendanceStatuses.ABSENT) daysAbsent++;
        else if (att.status === AttendanceStatuses.ON_LEAVE) daysOnPaidLeave++;
        else if (att.status === AttendanceStatuses.HALF_DAY) halfDays++;
        else if (att.status === AttendanceStatuses.HOLIDAY) holidays++;
        else if (att.status === AttendanceStatuses.WEEKLY_OFF) weeklyOffs++;
      }

      // Performance bonus if eligible
      const perfEval = await PerformanceEvaluation.findOne({
        employee: emp._id,
        month,
        year,
        isEligible: true,
      });
      const performanceBonusPaisa = perfEval ? perfEval.bonusAmount || 0 : 0;

      // Deductions calculation
      const absentDeductionPaisa = policy.absentDeductionEnabled
        ? daysAbsent * dailyRatePaisa
        : 0;

      const halfDayDeductionPaisa = Math.round(
        halfDays * (dailyRatePaisa * policy.halfDayDeductionRate)
      );

      const unpaidLeaveDeductionPaisa = policy.unpaidLeaveDeductionEnabled
        ? daysOnUnpaidLeave * dailyRatePaisa
        : 0;

      // Late penalty if enabled
      let lateDeductionPaisa = 0;
      if (policy.latePenaltyEnabled && lateDays > policy.maxGraceLateDaysPerMonth) {
        const chargeableLateDays = lateDays - policy.maxGraceLateDaysPerMonth;
        lateDeductionPaisa = Math.round(chargeableLateDays * (dailyRatePaisa * policy.lateDeductionPerDayRate));
      }

      // Approved Adjustments
      const adjustments = await PayrollAdjustment.find({
        employee: emp._id,
        month,
        year,
        isApproved: true,
      });

      let netAdjustmentsPaisa = 0;
      for (const adj of adjustments) {
        if (adj.type === 'earning') netAdjustmentsPaisa += adj.amount;
        else if (adj.type === 'deduction') netAdjustmentsPaisa -= adj.amount;
      }

      const totalDeductionsPaisa =
        absentDeductionPaisa +
        halfDayDeductionPaisa +
        unpaidLeaveDeductionPaisa +
        lateDeductionPaisa;

      const grossEarningsPaisa = baseSalaryPaisa + performanceBonusPaisa;

      let netPayablePaisa =
        grossEarningsPaisa - totalDeductionsPaisa + netAdjustmentsPaisa;

      if (policy.roundingMethod === RoundingMethods.FLOOR) {
        netPayablePaisa = Math.floor(netPayablePaisa / 100) * 100;
      } else if (policy.roundingMethod === RoundingMethods.CEIL) {
        netPayablePaisa = Math.ceil(netPayablePaisa / 100) * 100;
      } else {
        netPayablePaisa = Math.round(netPayablePaisa / 100) * 100;
      }

      netPayablePaisa = Math.max(0, netPayablePaisa);

      periodTotalGross += grossEarningsPaisa;
      periodTotalDeductions += totalDeductionsPaisa;
      periodTotalNet += netPayablePaisa;
      periodTotalBonuses += performanceBonusPaisa;

      records.push({
        employee: emp,
        baseSalary: baseSalaryPaisa,
        workingDays: daysInMonth,
        daysPresent,
        daysAbsent,
        daysOnPaidLeave,
        daysOnUnpaidLeave,
        halfDays,
        holidays,
        weeklyOffs,
        lateDays,
        totalLateMinutes,
        grossEarnings: grossEarningsPaisa,
        absentDeductions: absentDeductionPaisa,
        halfDayDeductions: halfDayDeductionPaisa,
        unpaidLeaveDeductions: unpaidLeaveDeductionPaisa,
        lateDeductions: lateDeductionPaisa,
        otherDeductions: 0,
        totalDeductions: totalDeductionsPaisa,
        performanceBonus: performanceBonusPaisa,
        otherEarnings: 0,
        adjustments: netAdjustmentsPaisa,
        netPayable: netPayablePaisa,
      });
    }

    return {
      month,
      year,
      startDate,
      endDate,
      policy,
      totals: {
        totalGrossEarnings: periodTotalGross,
        totalDeductions: periodTotalDeductions,
        totalNetPayable: periodTotalNet,
        totalBonuses: periodTotalBonuses,
        employeeCount: employees.length,
      },
      records,
    };
  }

  /**
   * Finalize payroll period: saves records and freezes snapshot permanently
   */
  static async finalizePayroll(month: number, year: number, adminUserId: string) {
    const existing = await PayrollPeriod.findOne({ month, year });
    if (existing && existing.status === PayrollPeriodStatuses.FINALIZED) {
      throw ApiError.badRequest(`Payroll period for ${month}/${year} is already finalized`);
    }

    const calculated = await this.calculatePayroll(month, year);

    let period = existing;
    if (!period) {
      period = new PayrollPeriod({
        month,
        year,
        startDate: calculated.startDate,
        endDate: calculated.endDate,
      });
    }

    period.status = PayrollPeriodStatuses.FINALIZED;
    period.processedBy = new mongoose.Types.ObjectId(adminUserId);
    period.approvedBy = new mongoose.Types.ObjectId(adminUserId);
    period.finalizedAt = new Date();
    period.totalGrossEarnings = calculated.totals.totalGrossEarnings;
    period.totalDeductions = calculated.totals.totalDeductions;
    period.totalNetPayable = calculated.totals.totalNetPayable;
    period.totalBonuses = calculated.totals.totalBonuses;
    period.employeeCount = calculated.totals.employeeCount;
    period.policy = calculated.policy._id;
    period.policySnapshot = calculated.policy.toObject() as unknown as Record<string, unknown>;

    await period.save();

    // Remove any previous draft records for this period
    await PayrollRecord.deleteMany({ payrollPeriod: period._id });

    // Insert frozen records
    for (const rec of calculated.records) {
      await PayrollRecord.create({
        payrollPeriod: period._id,
        employee: rec.employee._id,
        baseSalary: rec.baseSalary,
        workingDays: rec.workingDays,
        daysPresent: rec.daysPresent,
        daysAbsent: rec.daysAbsent,
        daysOnPaidLeave: rec.daysOnPaidLeave,
        daysOnUnpaidLeave: rec.daysOnUnpaidLeave,
        halfDays: rec.halfDays,
        holidays: rec.holidays,
        weeklyOffs: rec.weeklyOffs,
        lateDays: rec.lateDays,
        totalLateMinutes: rec.totalLateMinutes,
        grossEarnings: rec.grossEarnings,
        absentDeductions: rec.absentDeductions,
        halfDayDeductions: rec.halfDayDeductions,
        unpaidLeaveDeductions: rec.unpaidLeaveDeductions,
        lateDeductions: rec.lateDeductions,
        otherDeductions: rec.otherDeductions,
        totalDeductions: rec.totalDeductions,
        performanceBonus: rec.performanceBonus,
        otherEarnings: rec.otherEarnings,
        adjustments: rec.adjustments,
        netPayable: rec.netPayable,
        status: PayrollRecordStatuses.FINALIZED,
        policySnapshot: calculated.policy.toObject(),
        salarySnapshot: { baseSalary: rec.baseSalary },
        attendanceSnapshot: {
          daysPresent: rec.daysPresent,
          daysAbsent: rec.daysAbsent,
          lateDays: rec.lateDays,
          halfDays: rec.halfDays,
        },
      });
    }

    await AuditLog.create({
      userId: adminUserId,
      action: 'PAYROLL_FINALIZED',
      resource: 'PayrollPeriod',
      resourceId: period._id.toString(),
      newData: {
        month,
        year,
        totalNetPayable: period.totalNetPayable,
        employeeCount: period.employeeCount,
      },
    });

    return period;
  }

  /**
   * Get employee payslips
   */
  static async getEmployeePayslips(employeeId: string) {
    return PayrollRecord.find({
      employee: employeeId,
      status: PayrollRecordStatuses.FINALIZED,
    })
      .populate('payrollPeriod')
      .sort({ createdAt: -1 });
  }

  /**
   * Get single payslip by record ID (with permission check)
   */
  static async getPayslipById(recordId: string, requestingUser: { employeeId: string; role: string }) {
    const record = await PayrollRecord.findById(recordId)
      .populate({
        path: 'employee',
        select: 'employeeCode firstName lastName designation department email phone joiningDate',
        populate: { path: 'department', select: 'name' },
      })
      .populate('payrollPeriod');

    if (!record) throw ApiError.notFound('Payslip not found');

    if (
      requestingUser.role !== Roles.SUPER_ADMIN &&
      requestingUser.role !== Roles.HR_ADMIN &&
      (record.employee as any)._id.toString() !== requestingUser.employeeId
    ) {
      throw ApiError.forbidden('You are not authorized to view this payslip');
    }

    return record;
  }
}
