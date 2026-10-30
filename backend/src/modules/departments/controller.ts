import { Request, Response, NextFunction } from 'express';
import { DepartmentService } from './service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

export class DepartmentController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activeOnly = req.query.active === 'true';
      const departments = await DepartmentService.getAll(activeOnly);
      ApiResponse.success(res, departments, 'Departments retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dept = await DepartmentService.create(req.body);
      ApiResponse.success(res, dept, 'Department created', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dept = await DepartmentService.update(req.params.id, req.body);
      ApiResponse.success(res, dept, 'Department updated');
    } catch (error) {
      next(error);
    }
  }
}
