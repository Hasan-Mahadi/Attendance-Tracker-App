import { Router, Request, Response, NextFunction } from 'express';
import { Holiday, IHoliday } from '../../models/Holiday.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { Roles } from '../../config/constants.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { getDhakaDateOnly } from '../attendance/service.js';

export class HolidayService {
  static async getHolidays(year?: number) {
    const y = year || new Date().getFullYear();
    return Holiday.find({ year: y, isActive: true })
      .populate('departments', 'name')
      .sort({ date: 1 });
  }

  static async create(data: {
    name: string;
    date: string;
    isRecurring?: boolean;
    departments?: string[];
    userId: string;
  }) {
    const holidayDate = getDhakaDateOnly(new Date(data.date));
    const year = holidayDate.getUTCFullYear();

    const existing = await Holiday.findOne({ date: holidayDate, name: data.name.trim() });
    if (existing) {
      throw ApiError.conflict('A holiday with this name and date already exists');
    }

    return Holiday.create({
      name: data.name.trim(),
      date: holidayDate,
      year,
      isRecurring: !!data.isRecurring,
      departments: data.departments || [],
      createdBy: data.userId,
    });
  }

  static async delete(id: string) {
    const holiday = await Holiday.findById(id);
    if (!holiday) throw ApiError.notFound('Holiday not found');
    await holiday.deleteOne();
    return { success: true };
  }
}

export class HolidayController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? Number(req.query.year) : undefined;
      const holidays = await HolidayService.getHolidays(year);
      ApiResponse.success(res, holidays, 'Holidays retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const holiday = await HolidayService.create({
        ...req.body,
        userId: req.user!.id,
      });
      ApiResponse.success(res, holiday, 'Holiday created', 201);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await HolidayService.delete(req.params.id);
      ApiResponse.success(res, null, 'Holiday deleted');
    } catch (error) {
      next(error);
    }
  }
}

const router = Router();
router.use(authenticate);

router.get('/', HolidayController.getAll);
router.post('/', authorize(Roles.SUPER_ADMIN, Roles.HR_ADMIN), HolidayController.create);
router.delete('/:id', authorize(Roles.SUPER_ADMIN, Roles.HR_ADMIN), HolidayController.delete);

export default router;
