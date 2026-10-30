import { Request, Response, NextFunction } from 'express';
import { ReportsService } from './service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Roles } from '../../config/constants.js';

export class ReportsController {
  static async getMonthlyAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const month = Number(req.query.month) || new Date().getMonth() + 1;
      const year = Number(req.query.year) || new Date().getFullYear();

      // If normal employee, only return their own data
      const employeeId =
        req.user!.role === Roles.EMPLOYEE
          ? req.user!.employeeId
          : (req.query.employeeId as string | undefined);

      const report = await ReportsService.getMonthlyAttendanceReport(month, year, employeeId);
      ApiResponse.success(res, report, 'Monthly attendance report retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getYearlyAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const year = Number(req.query.year) || new Date().getFullYear();
      const employeeId =
        req.user!.role === Roles.EMPLOYEE
          ? req.user!.employeeId
          : (req.query.employeeId as string | undefined);

      const report = await ReportsService.getYearlyAttendanceReport(year, employeeId);
      ApiResponse.success(res, report, 'Yearly attendance report retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async exportMonthlyAttendanceCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const month = Number(req.query.month) || new Date().getMonth() + 1;
      const year = Number(req.query.year) || new Date().getFullYear();

      const csv = await ReportsService.exportMonthlyAttendanceCsv(month, year);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="attendance-report-${year}-${month}.csv"`
      );
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}
