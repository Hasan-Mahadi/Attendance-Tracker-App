import { Router } from 'express';
import { ExpenseController } from './controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { Roles } from '../../config/constants.js';

const router = Router();

router.use(authenticate);
router.use(authorize(Roles.SUPER_ADMIN, Roles.HR_ADMIN));

router.get('/categories', ExpenseController.getCategories);
router.post('/categories', ExpenseController.createCategory);
router.get('/summary', ExpenseController.getFinancialSummary);
router.get('/', ExpenseController.getAll);
router.post('/', ExpenseController.create);

export default router;
