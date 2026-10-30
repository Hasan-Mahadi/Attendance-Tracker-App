import { Router } from 'express';
import { SettingsController } from './controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { Roles } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

// ─── Read Settings (All Authenticated Users) ─────────────────────
router.get('/company', SettingsController.getCompanySettings);
router.get('/schedules', SettingsController.getWorkSchedules);
router.get('/attendance-policies', SettingsController.getAttendancePolicies);
router.get('/leave-categories', SettingsController.getLeaveCategories);
router.get('/leave-policies', SettingsController.getLeavePolicies);
router.get('/expense-categories', SettingsController.getExpenseCategories);
router.get('/performance-policy', SettingsController.getPerformancePolicy);

// ─── Super Admin Mutation Routes ─────────────────────────────────
router.put('/company', authorize(Roles.SUPER_ADMIN), SettingsController.updateCompanySettings);

router.post('/schedules', authorize(Roles.SUPER_ADMIN), SettingsController.createWorkSchedule);
router.put('/schedules/:id', authorize(Roles.SUPER_ADMIN), SettingsController.updateWorkSchedule);

router.put(
  '/attendance-policies/:id',
  authorize(Roles.SUPER_ADMIN),
  SettingsController.updateAttendancePolicy
);

router.post('/leave-categories', authorize(Roles.SUPER_ADMIN), SettingsController.createLeaveCategory);
router.put('/leave-categories/:id', authorize(Roles.SUPER_ADMIN), SettingsController.updateLeaveCategory);
router.delete('/leave-categories/:id', authorize(Roles.SUPER_ADMIN), SettingsController.deleteLeaveCategory);

router.post('/leave-policies', authorize(Roles.SUPER_ADMIN), SettingsController.createLeavePolicy);
router.put('/leave-policies/:id', authorize(Roles.SUPER_ADMIN), SettingsController.updateLeavePolicy);

router.post('/expense-categories', authorize(Roles.SUPER_ADMIN), SettingsController.createExpenseCategory);
router.put('/expense-categories/:id', authorize(Roles.SUPER_ADMIN), SettingsController.updateExpenseCategory);
router.delete('/expense-categories/:id', authorize(Roles.SUPER_ADMIN), SettingsController.deleteExpenseCategory);

router.put('/performance-policy/:id', authorize(Roles.SUPER_ADMIN), SettingsController.updatePerformancePolicy);

export default router;
