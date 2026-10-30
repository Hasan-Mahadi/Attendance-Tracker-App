import { Router } from 'express';
import { EmployeeController } from './controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { Roles } from '../../config/constants.js';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  createInvitationSchema,
  updateSalarySchema,
} from './validators.js';

const router = Router();

// All employee routes require authentication
router.use(authenticate);

// Export CSV (Admin/HR only)
router.get(
  '/export/csv',
  authorize(Roles.SUPER_ADMIN, Roles.HR_ADMIN),
  EmployeeController.exportCsv
);

// List employees (Admin/HR only)
router.get(
  '/',
  authorize(Roles.SUPER_ADMIN, Roles.HR_ADMIN),
  EmployeeController.getAll
);

// Create employee (Admin/HR only)
router.post(
  '/',
  authorize(Roles.SUPER_ADMIN, Roles.HR_ADMIN),
  validate(createEmployeeSchema),
  EmployeeController.create
);

// Create registration invitation (Admin/HR only)
router.post(
  '/invitations',
  authorize(Roles.SUPER_ADMIN, Roles.HR_ADMIN),
  validate(createInvitationSchema),
  EmployeeController.createInvitation
);

// Get single employee by ID (Employee can view own, Admin/HR can view all)
router.get('/:id', EmployeeController.getById);

// Update employee (Admin/HR only)
router.patch(
  '/:id',
  authorize(Roles.SUPER_ADMIN, Roles.HR_ADMIN),
  validate(updateEmployeeSchema),
  EmployeeController.update
);

// Update employee salary (Super Admin / HR Admin only)
router.put(
  '/:id/salary',
  authorize(Roles.SUPER_ADMIN, Roles.HR_ADMIN),
  validate(updateSalarySchema),
  EmployeeController.updateSalary
);

export default router;
