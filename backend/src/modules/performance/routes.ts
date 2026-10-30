import { Router } from 'express';
import { PerformanceController } from './controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { Roles } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

router.get('/my', PerformanceController.getMyPerformance);
router.get('/policy', PerformanceController.getPolicy);

// Admin/HR routes
router.get('/overview', authorize(Roles.SUPER_ADMIN, Roles.HR_ADMIN), PerformanceController.getOverview);
router.post('/evaluate', authorize(Roles.SUPER_ADMIN, Roles.HR_ADMIN), PerformanceController.runEvaluation);

export default router;
