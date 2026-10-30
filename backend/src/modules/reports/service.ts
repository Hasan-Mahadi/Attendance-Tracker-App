import {
  AttendanceRecord,
  Employee,
  PayrollPeriod,
  ExpenseRecord,
  Holiday,
} from '../../models/index.js';
import { sanitizeCsvValue } from '../../utils/csv.js';
import { AttendanceStatuses } from '../../config/constants.js';

export class ReportsService {
  /**
   * Monthly Attendance Summary Report
   */
  static async getMonthlyAttendanceReport(month: number, year: number, employeeId?: string) {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));
    const daysInMonth = new Date(year, month, 0).getDate();

    const empQuery: Record<string, unknown> = { employmentStatus: 'active' };
    if (employeeId) empQuery._id = employeeId;

    const employees = await Employee.find(empQuery).populate('department', 'name');

    const report = [];

    for (const emp of employees) {
      const records = await AttendanceRecord.find({
        employee: emp._id,
        date: { $gte: startDate, $lte: endDate },
      });

      let presentDays = 0;
      let lateDays = 0;
      let totalLateMinutes = 0;
      let absentDays = 0;
      let leaveDays = 0;
      let halfDays = 0;
      let totalNetWorkingMinutes = 0;

      for (const rec of records) {
        if (rec.status === AttendanceStatuses.PRESENT) presentDays++;
        else if (rec.status === AttendanceStatuses.LATE) {
          presentDays++;
          lateDays++;
          totalLateMinutes += rec.lateMinutes || 0;
        } else if (rec.status === AttendanceStatuses.ABSENT) absentDays++;
        else if (rec.status === AttendanceStatuses.ON_LEAVE) leaveDays++;
        else if (rec.status === AttendanceStatuses.HALF_DAY) halfDays++;

        totalNetWorkingMinutes += rec.netWorkingMinutes || 0;
      }

      const totalScheduled = presentDays + absentDays + halfDays + leaveDays;
      const completionRate =
        totalScheduled > 0
          ? Math.round(((presentDays + halfDays * 0.5) / totalScheduled) * 100)
          : 0;

      const totalHours = Math.floor(totalNetWorkingMinutes / 60);
      const totalMins = totalNetWorkingMinutes % 60;

      report.push({
        employee: {
          id: emp._id,
          employeeCode: emp.employeeCode,
          name: `${emp.firstName} ${emp.lastName}`,
          department: (emp.department as any)?.name,
          designation: emp.designation,
        },
        month,
        year,
        scheduledDays: totalScheduled,
        presentDays,
        lateDays,
        totalLateMinutes,
        absentDays,
        leaveDays,
        halfDays,
        totalNetWorkingMinutes,
        workingHoursFormatted: `${totalHours}h ${totalMins}m`,
        completionRate,
      });
    }

    return report;
  }

  /**
   * Yearly Attendance Summary Report
   */
  static async getYearlyAttendanceReport(year: number, employeeId?: string) {
    const monthlySummaries = [];

    for (let m = 1; m <= 12; m++) {
      const report = await this.getMonthlyAttendanceReport(m, year, employeeId);
      const totalPresent = report.reduce((sum, r) => sum + r.presentDays, 0);
      const totalLate = report.reduce((sum, r) => sum + r.lateDays, 0);
      const totalAbsent = report.reduce((sum, r) => sum + r.absentDays, 0);
      const totalLeave = report.reduce((sum, r) => sum + r.leaveDays, 0);
      const totalHours = Math.round(
        report.reduce((sum, r) => sum + r.totalNetWorkingMinutes, 0) / 60
      );

      monthlySummaries.push({
        month: m,
        year,
        totalPresent,
        totalLate,
        totalAbsent,
        totalLeave,
        totalHours,
      });
    }

    return monthlySummaries;
  }

  /**
   * Export Monthly Attendance to CSV
   */
  static async exportMonthlyAttendanceCsv(month: number, year: number): Promise<string> {
    const report = await this.getMonthlyAttendanceReport(month, year);

    const headers = [
      'Employee ID',
      'Name',
      'Department',
      'Designation',
      'Scheduled Days',
      'Present Days',
      'Late Days',
      'Late Minutes',
      'Absent Days',
      'Leave Days',
      'Half Days',
      'Net Working Hours',
      'Completion Rate (%)',
    ];

    const rows = report.map((r) => [
      sanitizeCsvValue(r.employee.employeeCode),
      sanitizeCsvValue(r.employee.name),
      sanitizeCsvValue(r.employee.department || ''),
      sanitizeCsvValue(r.employee.designation || ''),
      sanitizeCsvValue(r.scheduledDays),
      sanitizeCsvValue(r.presentDays),
      sanitizeCsvValue(r.lateDays),
      sanitizeCsvValue(r.totalLateMinutes),
      sanitizeCsvValue(r.absentDays),
      sanitizeCsvValue(r.leaveDays),
      sanitizeCsvValue(r.halfDays),
      sanitizeCsvValue(r.workingHoursFormatted),
      sanitizeCsvValue(`${r.completionRate}%`),
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }
}
