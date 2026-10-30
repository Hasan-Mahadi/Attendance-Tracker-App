import { Router, Request, Response, NextFunction } from 'express';
import { Notification } from '../../models/Notification.js';
import { authenticate } from '../../middleware/authenticate.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await Notification.find({ recipient: req.user!.id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user!.id,
      isRead: false,
    });
    ApiResponse.success(res, { notifications, unreadCount }, 'Notifications retrieved');
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user!.id },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );
    ApiResponse.success(res, notification, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
});

router.post('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Notification.updateMany(
      { recipient: req.user!.id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    ApiResponse.success(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
});

export default router;
