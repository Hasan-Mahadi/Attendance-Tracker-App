import { Request, Response, NextFunction } from 'express';
import { ExpenseService } from './service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

export class ExpenseController {
  static async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await ExpenseService.getCategories();
      ApiResponse.success(res, categories, 'Expense categories retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await ExpenseService.createCategory(req.body, req.user!.id);
      ApiResponse.success(res, category, 'Expense category created', 201);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const expense = await ExpenseService.createExpense({
        ...req.body,
        userId: req.user!.id,
      });
      ApiResponse.success(res, expense, 'Expense recorded successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ExpenseService.getExpenses(req.query);
      ApiResponse.paginated(
        res,
        result.items,
        result.pagination,
        'Expenses list retrieved'
      );
    } catch (error) {
      next(error);
    }
  }

  static async getFinancialSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const month = Number(req.query.month) || new Date().getMonth() + 1;
      const year = Number(req.query.year) || new Date().getFullYear();
      const summary = await ExpenseService.getFinancialSummary(month, year);
      ApiResponse.success(res, summary, 'Financial summary computed');
    } catch (error) {
      next(error);
    }
  }
}
