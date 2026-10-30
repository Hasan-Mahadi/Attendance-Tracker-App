import { Router } from 'express';
import { PayrollController } from './controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { Roles } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

// Employee payslip routes
router.get('/my-payslips', PayrollController.getMyPayslips);
router.get('/records/:id', PayrollController.getPayslipById);

// Admin/HR payroll routes
router.get('/policy', authorize(Roles.SUPER_ADMIN, Roles.HR_ADMIN), PayrollController.getPolicy);
router.put('/policy/:id', authorize(Roles.SUPER_ADMIN), PayrollController.updatePolicy);
router.post('/preview', authorize(Roles.SUPER_ADMIN, Roles.HR_ADMIN), PayrollController.preview);
router.post('/finalize', authorize(Roles.SUPER_ADMIN, Roles.HR_ADMIN), PayrollController.finalize);
router.get('/periods', authorize(Roles.SUPER_ADMIN, Roles.HR_ADMIN), PayrollController.getPeriods);
router.get(
  '/periods/:id/records',
  authorize(Roles.SUPER_ADMIN, Roles.HR_ADMIN),
  PayrollController.getPeriodRecords
);

export default router;
