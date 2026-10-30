import { Router, Request, Response, NextFunction } from 'express';
import { AuditLog } from '../../models/AuditLog.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { Roles } from '../../config/constants.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

const router = Router();
router.use(authenticate);
router.use(authorize(Roles.SUPER_ADMIN));

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (req.query.action) query.action = req.query.action;
    if (req.query.resource) query.resource = req.query.resource;

    const [items, totalItems] = await Promise.all([
      AuditLog.find(query)
        .populate({
          path: 'userId',
          select: 'email role employeeId',
          populate: {
            path: 'employeeId',
            select: 'firstName lastName employeeCode designation',
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    ApiResponse.paginated(
      res,
      items,
      {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      'Audit logs retrieved'
    );
  } catch (error) {
    next(error);
  }
});

export default router;
