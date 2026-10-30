import { Request, Response, NextFunction } from 'express';
import { LeaveService } from './service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

export class LeaveController {
  static async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await LeaveService.getCategories();
      ApiResponse.success(res, categories, 'Leave categories retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getPolicies(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policies = await LeaveService.getPolicies();
      ApiResponse.success(res, policies, 'Leave policies retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getMyBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const year = req.query.year ? Number(req.query.year) : undefined;
      const balances = await LeaveService.getEmployeeBalances(req.user!.employeeId, year);
      ApiResponse.success(res, balances, 'Leave balances retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async submitRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request = await LeaveService.submitRequest({
        ...req.body,
        employeeId: req.user!.employeeId,
        userId: req.user!.id,
      });
      ApiResponse.success(res, request, 'Leave request submitted successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getMyRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const requests = await LeaveService.getEmployeeRequests(req.user!.employeeId, status);
      ApiResponse.success(res, requests, 'Personal leave requests retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async cancelRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request = await LeaveService.cancelRequest(
        req.params.id,
        req.user!.employeeId,
        req.body.reason || 'User cancelled'
      );
      ApiResponse.success(res, request, 'Leave request cancelled');
    } catch (error) {
      next(error);
    }
  }

  static async getAllRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await LeaveService.getAllRequests(req.query);
      ApiResponse.paginated(
        res,
        result.items,
        result.pagination,
        'Company leave requests retrieved'
      );
    } catch (error) {
      next(error);
    }
  }

  static async reviewRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { action, reviewNotes } = req.body;
      const result = await LeaveService.reviewRequest(
        req.params.id,
        action,
        reviewNotes,
        req.user!.id
      );
      ApiResponse.success(res, result, `Leave request ${action}`);
    } catch (error) {
      next(error);
    }
  }
}
