import { Router } from 'express';
import { ReportsController } from './controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { Roles } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

router.get('/attendance/monthly', ReportsController.getMonthlyAttendance);
router.get('/attendance/yearly', ReportsController.getYearlyAttendance);
router.get(
  '/attendance/export/csv',
  authorize(Roles.SUPER_ADMIN, Roles.HR_ADMIN),
  ReportsController.exportMonthlyAttendanceCsv
);

export default router;
