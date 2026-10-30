import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from './service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

export class EmployeeController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await EmployeeService.createEmployee(req.body, req.user!.id);
      ApiResponse.success(res, employee, 'Employee created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await EmployeeService.getEmployees(req.query);
      ApiResponse.paginated(
        res,
        result.items,
        result.pagination,
        'Employees retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await EmployeeService.getEmployeeById(
        req.params.id,
        req.user!
      );
      ApiResponse.success(res, employee, 'Employee profile retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await EmployeeService.updateEmployee(
        req.params.id,
        req.body,
        req.user!.id
      );
      ApiResponse.success(res, employee, 'Employee updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async createInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invitation = await EmployeeService.createInvitation(
        req.body,
        req.user!.id
      );
      ApiResponse.success(res, invitation, 'Registration invitation generated', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateSalary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const salary = await EmployeeService.updateSalary(
        req.params.id,
        req.body,
        req.user!.id
      );
      ApiResponse.success(res, salary, 'Salary profile updated');
    } catch (error) {
      next(error);
    }
  }

  static async exportCsv(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const csv = await EmployeeService.exportCsv();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="employees.csv"');
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}
