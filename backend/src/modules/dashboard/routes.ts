import { Router, Request, Response, NextFunction } from 'express';
import {
  Employee,
  AttendanceRecord,
  LeaveRequest,
  LeaveBalance,
  SalaryProfile,
  PayrollPeriod,
  ExpenseRecord,
  Notification,
  AuditLog,
  WorkSchedule,
} from '../../models/index.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { Roles, AttendanceStatuses, LeaveStatuses } from '../../config/constants.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { getDhakaDateOnly } from '../attendance/service.js';
import { PayrollService } from '../payroll/service.js';
import { PerformanceService } from '../performance/service.js';

const router = Router();
router.use(authenticate);

/**
 * Employee Personal Dashboard
 */
router.get('/employee', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employeeId = req.user!.employeeId;
    const today = getDhakaDateOnly();
    const now = new Date();
    const currentMonth = today.getUTCMonth() + 1;
    const currentYear = today.getUTCFullYear();

    const startOfMonth = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    const endOfMonth = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59));

    // 1. Employee profile & schedule
    const employee = await Employee.findById(employeeId)
      .populate('department', 'name')
      .populate('workSchedule');

    // 2. Today's attendance
    const todayAttendance = await AttendanceRecord.findOne({
      employee: employeeId,
      date: today,
    });

    // 3. Current month attendance stats
    const monthRecords = await AttendanceRecord.find({
      employee: employeeId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });

    let daysPresent = 0;
    let daysLate = 0;
    let daysAbsent = 0;
    let totalLateMinutes = 0;
    let totalWorkedMinutes = 0;

    for (const r of monthRecords) {
      if (r.status === AttendanceStatuses.PRESENT) daysPresent++;
      else if (r.status === AttendanceStatuses.LATE) {
        daysPresent++;
        daysLate++;
        totalLateMinutes += r.lateMinutes || 0;
      } else if (r.status === AttendanceStatuses.ABSENT) daysAbsent++;
      totalWorkedMinutes += r.netWorkingMinutes || 0;
    }

    // 4. Leave balances
    const leaveBalances = await LeaveBalance.find({
      employee: employeeId,
      year: currentYear,
    }).populate('leaveCategory');

    // 5. Pending leave requests
    const pendingLeaveRequests = await LeaveRequest.find({
      employee: employeeId,
      status: LeaveStatuses.PENDING,
    }).populate('leaveCategory');

    // 6. Current salary profile & estimated payable
    const salaryProfile = await SalaryProfile.findOne({
      employee: employeeId,
      isActive: true,
    }).sort({ effectiveFrom: -1 });

    const baseSalaryPaisa = salaryProfile ? salaryProfile.baseSalary : 0;
    const dailyRatePaisa = Math.round(baseSalaryPaisa / 30);
    const estimatedDeductionsPaisa = daysAbsent * dailyRatePaisa;
    const estimatedPayablePaisa = Math.max(0, baseSalaryPaisa - estimatedDeductionsPaisa);

    // 7. Performance bonus eligibility
    let performanceBonus = null;
    try {
      const evalDoc = await PerformanceService.evaluateEmployee(
        employeeId,
        currentMonth,
        currentYear
      );
      performanceBonus = {
        isEligible: evalDoc.isEligible,
        bonusAmountPaisa: evalDoc.bonusAmount,
        ineligibilityReasons: evalDoc.ineligibilityReasons,
      };
    } catch {
      // Non-blocking
    }

    // 8. Recent 7 attendance records
    const recentAttendance = await AttendanceRecord.find({ employee: employeeId })
      .sort({ date: -1 })
      .limit(7);

    // 9. Recent notifications
    const recentNotifications = await Notification.find({
      recipient: req.user!.id,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    ApiResponse.success(
      res,
      {
        employee,
        todayAttendance,
        monthSummary: {
          daysPresent,
          daysLate,
          daysAbsent,
          totalLateMinutes,
          totalWorkedMinutes,
          workedHoursFormatted: `${Math.floor(totalWorkedMinutes / 60)}h ${totalWorkedMinutes % 60}m`,
        },
        leaveBalances,
        pendingLeaveRequests,
        salary: {
          baseSalaryPaisa,
          estimatedDeductionsPaisa,
          estimatedPayablePaisa,
        },
        performanceBonus,
        recentAttendance,
        recentNotifications,
      },
      'Employee dashboard loaded'
    );
  } catch (error) {
    next(error);
  }
});

/**
 * Admin / HR Company-wide Dashboard
 */
router.get(
  '/admin',
  authorize(Roles.SUPER_ADMIN, Roles.HR_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const today = getDhakaDateOnly();
      const currentMonth = today.getUTCMonth() + 1;
      const currentYear = today.getUTCFullYear();

      const startOfMonth = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
      const endOfMonth = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59));

      // 1. Total Active Employees
      const totalEmployees = await Employee.countDocuments({ employmentStatus: 'active' });

      // 2. Today's Attendance breakdown
      const todayAttendance = await AttendanceRecord.find({ date: today });
      const presentToday = todayAttendance.filter(
        (a) => a.status === AttendanceStatuses.PRESENT || a.status === AttendanceStatuses.LATE
      ).length;
      const lateToday = todayAttendance.filter((a) => a.status === AttendanceStatuses.LATE).length;
      const onLeaveToday = todayAttendance.filter(
        (a) => a.status === AttendanceStatuses.ON_LEAVE
      ).length;
      const incompleteToday = todayAttendance.filter(
        (a) => a.actualCheckInTime && !a.actualCheckOutTime
      ).length;
      const absentToday = Math.max(0, totalEmployees - presentToday - onLeaveToday);

      // 3. Pending Leave Requests
      const pendingLeaveCount = await LeaveRequest.countDocuments({
        status: LeaveStatuses.PENDING,
      });

      // 4. Financial & Payroll summaries
      const payrollPeriod = await PayrollPeriod.findOne({
        month: currentMonth,
        year: currentYear,
      });

      let monthlyPayrollPaisa = 0;
      let payrollStatus = 'Not Processed';
      if (payrollPeriod) {
        monthlyPayrollPaisa = payrollPeriod.totalNetPayable;
        payrollStatus = payrollPeriod.status;
      } else {
        // Estimate from base salaries
        const activeProfiles = await SalaryProfile.find({ isActive: true });
        monthlyPayrollPaisa = activeProfiles.reduce((sum, p) => sum + p.baseSalary, 0);
        payrollStatus = 'Estimated (Draft)';
      }

      // Office expenses for this month
      const monthExpenses = await ExpenseRecord.find({
        date: { $gte: startOfMonth, $lte: endOfMonth },
        approvalStatus: 'approved',
      });
      const monthlyOfficeExpensesPaisa = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

      // Year-to-date total expenditure
      const ytdStart = new Date(Date.UTC(currentYear, 0, 1));
      const ytdExpenses = await ExpenseRecord.find({
        date: { $gte: ytdStart, $lte: endOfMonth },
        approvalStatus: 'approved',
      });
      const ytdExpenseTotalPaisa = ytdExpenses.reduce((sum, e) => sum + e.amount, 0);

      const ytdPeriods = await PayrollPeriod.find({
        year: currentYear,
        month: { $lte: currentMonth },
      });
      const ytdPayrollTotalPaisa = ytdPeriods.reduce((sum, p) => sum + p.totalNetPayable, 0);

      // 5. Recent Admin Activities (Audit log)
      const recentActivities = await AuditLog.find()
        .populate('userId', 'email')
        .sort({ createdAt: -1 })
        .limit(8);

      ApiResponse.success(
        res,
        {
          headcount: {
            totalEmployees,
            presentToday,
            lateToday,
            absentToday,
            onLeaveToday,
            incompleteToday,
            pendingLeaveRequests: pendingLeaveCount,
          },
          finance: {
            payrollStatus,
            monthlyPayrollPaisa,
            monthlyOfficeExpensesPaisa,
            totalMonthlyExpensePaisa: monthlyPayrollPaisa + monthlyOfficeExpensesPaisa,
            ytdTotalExpenditurePaisa: ytdPayrollTotalPaisa + ytdExpenseTotalPaisa,
          },
          recentActivities,
        },
        'Admin dashboard loaded'
      );
    } catch (error) {
      next(error);
    }
  }
);

export default router;
