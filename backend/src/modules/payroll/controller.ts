import { Request, Response, NextFunction } from 'express';
import { PayrollService } from './service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { PayrollPeriod } from '../../models/PayrollPeriod.js';
import { PayrollRecord } from '../../models/PayrollRecord.js';
import { PayrollPolicy } from '../../models/PayrollPolicy.js';

export class PayrollController {
  static async getPolicy(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policy = await PayrollService.getActivePolicy();
      ApiResponse.success(res, policy, 'Active payroll policy');
    } catch (error) {
      next(error);
    }
  }

  static async updatePolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policy = await PayrollPolicy.findByIdAndUpdate(req.params.id, req.body, { new: true });
      ApiResponse.success(res, policy, 'Payroll policy updated');
    } catch (error) {
      next(error);
    }
  }

  static async preview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const month = Number(req.body.month || req.query.month);
      const year = Number(req.body.year || req.query.year);
      const result = await PayrollService.calculatePayroll(month, year);
      ApiResponse.success(res, result, 'Payroll preview calculated');
    } catch (error) {
      next(error);
    }
  }

  static async finalize(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { month, year } = req.body;
      const period = await PayrollService.finalizePayroll(Number(month), Number(year), req.user!.id);
      ApiResponse.success(res, period, 'Payroll finalized and locked successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getPeriods(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const periods = await PayrollPeriod.find().sort({ year: -1, month: -1 });
      ApiResponse.success(res, periods, 'Payroll periods list');
    } catch (error) {
      next(error);
    }
  }

  static async getPeriodRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const records = await PayrollRecord.find({ payrollPeriod: req.params.id })
        .populate({
          path: 'employee',
          select: 'employeeCode firstName lastName designation department profileImage',
          populate: { path: 'department', select: 'name' },
        })
        .sort({ 'employee.employeeCode': 1 });
      ApiResponse.success(res, records, 'Period employee records');
    } catch (error) {
      next(error);
    }
  }

  static async getMyPayslips(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payslips = await PayrollService.getEmployeePayslips(req.user!.employeeId);
      ApiResponse.success(res, payslips, 'My payslips retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getPayslipById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payslip = await PayrollService.getPayslipById(req.params.id, req.user!);
      ApiResponse.success(res, payslip, 'Payslip details');
    } catch (error) {
      next(error);
    }
  }
}
