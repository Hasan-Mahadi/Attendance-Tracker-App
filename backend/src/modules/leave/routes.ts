import { Router } from 'express';
import { LeaveController } from './controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { Roles } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

// Public to authenticated users
router.get('/categories', LeaveController.getCategories);
router.get('/policies', LeaveController.getPolicies);
router.get('/balances/my', LeaveController.getMyBalances);
router.get('/requests/my', LeaveController.getMyRequests);
router.post('/requests', LeaveController.submitRequest);
router.post('/requests/:id/cancel', LeaveController.cancelRequest);

// Admin/HR routes
router.get(
  '/requests',
  authorize(Roles.SUPER_ADMIN, Roles.HR_ADMIN),
  LeaveController.getAllRequests
);
router.patch(
  '/requests/:id/review',
  authorize(Roles.SUPER_ADMIN, Roles.HR_ADMIN),
  LeaveController.reviewRequest
);

export default router;
