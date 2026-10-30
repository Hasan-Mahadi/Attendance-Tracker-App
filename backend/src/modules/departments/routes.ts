import { Router } from 'express';
import { DepartmentController } from './controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { Roles } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

router.get('/', DepartmentController.getAll);
router.post('/', authorize(Roles.SUPER_ADMIN, Roles.HR_ADMIN), DepartmentController.create);
router.patch('/:id', authorize(Roles.SUPER_ADMIN, Roles.HR_ADMIN), DepartmentController.update);

export default router;
