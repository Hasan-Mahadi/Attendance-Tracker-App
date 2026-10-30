import { Request, Response, NextFunction } from 'express';
import { PerformanceService } from './service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

export class PerformanceController {
  static async getPolicy(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policy = await PerformanceService.getActivePolicy();
      ApiResponse.success(res, policy, 'Active performance policy');
    } catch (error) {
      next(error);
    }
  }

  static async getMyPerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const year = req.query.year ? Number(req.query.year) : undefined;
      const history = await PerformanceService.getEmployeePerformance(req.user!.employeeId, year);
      ApiResponse.success(res, history, 'Performance history retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const month = Number(req.query.month) || new Date().getMonth() + 1;
      const year = Number(req.query.year) || new Date().getFullYear();
      const overview = await PerformanceService.getCompanyOverview(month, year);
      ApiResponse.success(res, overview, 'Company performance overview');
    } catch (error) {
      next(error);
    }
  }

  static async runEvaluation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const month = Number(req.body.month);
      const year = Number(req.body.year);
      const results = await PerformanceService.evaluateAll(month, year);
      ApiResponse.success(res, results, 'Performance evaluations computed');
    } catch (error) {
      next(error);
    }
  }
}
