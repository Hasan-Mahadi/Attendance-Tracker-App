import { Request, Response, NextFunction } from 'express';
import { SettingsService } from './service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

export class SettingsController {
  // ─── Company Settings ──────────────────────────────────────────

  static async getCompanySettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await SettingsService.getCompanySettings();
      ApiResponse.success(res, settings, 'Company settings retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async updateCompanySettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await SettingsService.updateCompanySettings(req.body, req.user!.id);
      ApiResponse.success(res, settings, 'Company settings updated');
    } catch (error) {
      next(error);
    }
  }

  // ─── Work Schedules ────────────────────────────────────────────

  static async getWorkSchedules(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schedules = await SettingsService.getWorkSchedules();
      ApiResponse.success(res, schedules, 'Work schedules retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createWorkSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schedule = await SettingsService.createWorkSchedule(req.body);
      ApiResponse.success(res, schedule, 'Work schedule created', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateWorkSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schedule = await SettingsService.updateWorkSchedule(req.params.id, req.body, req.user!.id);
      ApiResponse.success(res, schedule, 'Work schedule updated');
    } catch (error) {
      next(error);
    }
  }

  // ─── Attendance Policies ───────────────────────────────────────

  static async getAttendancePolicies(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policies = await SettingsService.getAttendancePolicies();
      ApiResponse.success(res, policies, 'Attendance policies retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async updateAttendancePolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policy = await SettingsService.updateAttendancePolicy(req.params.id, req.body, req.user!.id);
      ApiResponse.success(res, policy, 'Attendance policy updated');
    } catch (error) {
      next(error);
    }
  }

  // ─── Leave Categories ──────────────────────────────────────────

  static async getLeaveCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await SettingsService.getLeaveCategories();
      ApiResponse.success(res, categories, 'Leave categories retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createLeaveCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await SettingsService.createLeaveCategory(req.body, req.user!.id);
      ApiResponse.success(res, category, 'Leave category created', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateLeaveCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await SettingsService.updateLeaveCategory(req.params.id, req.body, req.user!.id);
      ApiResponse.success(res, category, 'Leave category updated');
    } catch (error) {
      next(error);
    }
  }

  static async deleteLeaveCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await SettingsService.deleteLeaveCategory(req.params.id, req.user!.id);
      ApiResponse.success(res, category, 'Leave category deactivated');
    } catch (error) {
      next(error);
    }
  }

  // ─── Leave Policies ────────────────────────────────────────────

  static async getLeavePolicies(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policies = await SettingsService.getLeavePolicies();
      ApiResponse.success(res, policies, 'Leave policies retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createLeavePolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policy = await SettingsService.createLeavePolicy(req.body, req.user!.id);
      ApiResponse.success(res, policy, 'Leave policy created', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateLeavePolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policy = await SettingsService.updateLeavePolicy(req.params.id, req.body, req.user!.id);
      ApiResponse.success(res, policy, 'Leave policy updated');
    } catch (error) {
      next(error);
    }
  }

  // ─── Expense Categories ────────────────────────────────────────

  static async getExpenseCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await SettingsService.getExpenseCategories();
      ApiResponse.success(res, categories, 'Expense categories retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createExpenseCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await SettingsService.createExpenseCategory(req.body, req.user!.id);
      ApiResponse.success(res, category, 'Expense category created', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateExpenseCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await SettingsService.updateExpenseCategory(req.params.id, req.body, req.user!.id);
      ApiResponse.success(res, category, 'Expense category updated');
    } catch (error) {
      next(error);
    }
  }

  static async deleteExpenseCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await SettingsService.deleteExpenseCategory(req.params.id, req.user!.id);
      ApiResponse.success(res, category, 'Expense category deactivated');
    } catch (error) {
      next(error);
    }
  }

  // ─── Performance Policy ────────────────────────────────────────

  static async getPerformancePolicy(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policy = await SettingsService.getPerformancePolicy();
      ApiResponse.success(res, policy, 'Performance policy retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async updatePerformancePolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policy = await SettingsService.updatePerformancePolicy(req.params.id, req.body, req.user!.id);
      ApiResponse.success(res, policy, 'Performance policy updated');
    } catch (error) {
      next(error);
    }
  }
}
