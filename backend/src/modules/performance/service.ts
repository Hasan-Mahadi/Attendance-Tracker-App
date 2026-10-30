import {
  PerformancePolicy,
  PerformanceEvaluation,
  AttendanceRecord,
  Employee,
  AuditLog,
} from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  AttendanceStatuses,
  PerformanceEvaluationStatuses,
  Roles,
} from '../../config/constants.js';

export class PerformanceService {
  /**
   * Get active performance policy
   */
  static async getActivePolicy() {
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
   * Evaluate performance and bonus eligibility for an employee in a given month/year
   */
  static async evaluateEmployee(employeeId: string, month: number, year: number) {
    const policy = await this.getActivePolicy();
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));
    const daysInMonth = new Date(year, month, 0).getDate();

    const attendance = await AttendanceRecord.find({
      employee: employeeId,
      date: { $gte: startDate, $lte: endDate },
    });

    let daysPresent = 0;
    let lateDays = 0;
    let totalLateMinutes = 0;
    let absentDays = 0;
    let halfDays = 0;
    let totalNetWorkingMinutes = 0;

    for (const att of attendance) {
      if (att.status === AttendanceStatuses.PRESENT) daysPresent++;
      else if (att.status === AttendanceStatuses.LATE) {
        daysPresent++;
        lateDays++;
        totalLateMinutes += att.lateMinutes || 0;
      } else if (att.status === AttendanceStatuses.ABSENT) absentDays++;
      else if (att.status === AttendanceStatuses.HALF_DAY) halfDays++;

      totalNetWorkingMinutes += att.netWorkingMinutes || 0;
    }

    const scheduledWorkingDays = Math.max(1, daysPresent + absentDays + halfDays);
    const attendancePercentage = Math.round(
      ((daysPresent + halfDays * 0.5) / scheduledWorkingDays) * 100
    );

    const averageWorkingMinutes =
      daysPresent > 0 ? Math.round(totalNetWorkingMinutes / (daysPresent + halfDays)) : 0;

    // Check bonus eligibility
    const ineligibilityReasons: string[] = [];
    if (lateDays > policy.maxLateDays) {
      ineligibilityReasons.push(
        `Exceeded late limit: ${lateDays} days late (maximum allowed is ${policy.maxLateDays})`
      );
    }
    if (absentDays > policy.maxAbsentDays) {
      ineligibilityReasons.push(
        `Exceeded absence limit: ${absentDays} unexcused absence(s)`
      );
    }
    if (attendancePercentage < policy.minAttendancePercentage) {
      ineligibilityReasons.push(
        `Attendance percentage ${attendancePercentage}% is below the required ${policy.minAttendancePercentage}%`
      );
    }

    const isEligible = ineligibilityReasons.length === 0;
    const bonusAmount = isEligible ? policy.bonusAmount : 0;

    const evaluation = await PerformanceEvaluation.findOneAndUpdate(
      { employee: employeeId, month, year },
      {
        $set: {
          workingDays: scheduledWorkingDays,
          daysPresent,
          lateDays,
          totalLateMinutes,
          absentDays,
          halfDays,
          attendancePercentage,
          averageWorkingMinutes,
          isEligible,
          ineligibilityReasons,
          bonusAmount,
          status: PerformanceEvaluationStatuses.APPROVED,
          policySnapshot: policy.toObject(),
        },
      },
      { upsert: true, new: true }
    );

    return evaluation;
  }

  /**
   * Evaluate all employees for a month/year
   */
  static async evaluateAll(month: number, year: number) {
    const employees = await Employee.find({ employmentStatus: 'active' });
    const results = [];
    for (const emp of employees) {
      const evalDoc = await this.evaluateEmployee(emp._id.toString(), month, year);
      results.push({ employee: emp, evaluation: evalDoc });
    }
    return results;
  }

  /**
   * Get employee's personal performance history
   */
  static async getEmployeePerformance(employeeId: string, year?: number) {
    const y = year || new Date().getFullYear();
    return PerformanceEvaluation.find({ employee: employeeId, year: y }).sort({ month: -1 });
  }

  /**
   * Get company-wide performance overview
   */
  static async getCompanyOverview(month: number, year: number) {
    const evaluations = await PerformanceEvaluation.find({ month, year })
      .populate({
        path: 'employee',
        select: 'employeeCode firstName lastName designation department profileImage',
        populate: { path: 'department', select: 'name' },
      })
      .sort({ attendancePercentage: -1, lateDays: 1 });

    const totalEligible = evaluations.filter((e) => e.isEligible).length;
    const totalBonusPaisa = evaluations.reduce((sum, e) => sum + (e.bonusAmount || 0), 0);

    return {
      month,
      year,
      totalEmployees: evaluations.length,
      totalEligible,
      totalBonusPaisa,
      evaluations,
    };
  }
}
