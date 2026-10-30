import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from './service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

export class AttendanceController {
  static async getToday(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const record = await AttendanceService.getTodayAttendance(req.user!.employeeId);
      ApiResponse.success(res, record, "Today's attendance status");
    } catch (error) {
      next(error);
    }
  }

  static async checkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AttendanceService.checkIn(
        req.user!.employeeId,
        req.user!.id,
        req.body.notes
      );
      ApiResponse.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async checkOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AttendanceService.checkOut(
        req.user!.employeeId,
        req.user!.id,
        req.body.notes
      );
      ApiResponse.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async lunchOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AttendanceService.lunchOut(req.user!.employeeId, req.user!.id);
      ApiResponse.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async lunchIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AttendanceService.lunchIn(req.user!.employeeId, req.user!.id);
      ApiResponse.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async getMyAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const records = await AttendanceService.getEmployeeAttendance(
        req.user!.employeeId,
        req.query
      );
      ApiResponse.success(res, records, 'Personal attendance history');
    } catch (error) {
      next(error);
    }
  }

  static async getCompanyAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AttendanceService.getCompanyAttendance(req.query);
      ApiResponse.paginated(
        res,
        result.items,
        result.pagination,
        'Company attendance records'
      );
    } catch (error) {
      next(error);
    }
  }

  static async requestCorrection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const correction = await AttendanceService.requestCorrection({
        attendanceRecordId: req.body.attendanceRecordId,
        employeeId: req.user!.employeeId,
        correctedData: req.body.correctedData,
        reason: req.body.reason,
        requestedBy: req.user!.id,
      });
      ApiResponse.success(res, correction, 'Correction request submitted', 201);
    } catch (error) {
      next(error);
    }
  }

  static async reviewCorrection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { action, reviewNotes } = req.body;
      const result = await AttendanceService.reviewCorrection(
        req.params.id,
        action,
        reviewNotes,
        req.user!.id
      );
      ApiResponse.success(res, result, `Correction request ${action}`);
    } catch (error) {
      next(error);
    }
  }

  static async manualEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const record = await AttendanceService.manualEntry({
        ...req.body,
        adminUserId: req.user!.id,
      });
      ApiResponse.success(res, record, 'Attendance record updated manually');
    } catch (error) {
      next(error);
    }
  }
}
