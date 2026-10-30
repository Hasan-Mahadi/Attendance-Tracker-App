import { Router } from 'express';
import { AttendanceController } from './controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { Roles } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

// Employee actions
router.get('/today', AttendanceController.getToday);
router.post('/check-in', AttendanceController.checkIn);
router.post('/check-out', AttendanceController.checkOut);
router.post('/lunch-out', AttendanceController.lunchOut);
router.post('/lunch-in', AttendanceController.lunchIn);
router.get('/my', AttendanceController.getMyAttendance);
router.post('/corrections', AttendanceController.requestCorrection);

// Admin/HR actions
router.get(
  '/',
  authorize(Roles.SUPER_ADMIN, Roles.HR_ADMIN),
  AttendanceController.getCompanyAttendance
);
router.patch(
  '/corrections/:id',
  authorize(Roles.SUPER_ADMIN, Roles.HR_ADMIN),
  AttendanceController.reviewCorrection
);
router.post(
  '/manual',
  authorize(Roles.SUPER_ADMIN, Roles.HR_ADMIN),
  AttendanceController.manualEntry
);

export default router;
