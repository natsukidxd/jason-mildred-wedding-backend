import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { RSVP, Comment } from '../models';
import { Op } from 'sequelize';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

// Auth middleware
function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).admin = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

// POST /api/admin/login - Authenticate and get JWT token
router.post('/login', (req: Request, res: Response) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ success: false, error: 'Password is required' });
  }

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Invalid password' });
  }

  const token = jwt.sign(
    { role: 'admin', loggedInAt: new Date().toISOString() },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    data: {
      token,
      expiresIn: '24h',
    },
  });
});

// GET /api/admin/stats - Wedding statistics
router.get('/stats', authenticate, async (_req: Request, res: Response) => {
  try {
    const totalRSVPs = await RSVP.count();
    const attending = await RSVP.count({ where: { attendance: 'Attending' } });
    const notAttending = await RSVP.count({ where: { attendance: 'Not Attending' } });
    const totalComments = await Comment.count();

    // Sum of all guests (only for attending)
    const guestResult = await RSVP.findAll({
      where: { attendance: 'Attending' },
      attributes: ['guests'],
    });
    const totalGuests = guestResult.reduce((sum: number, r: any) => sum + (r.guests || 1), 0);

    // Recent activity (last 24 hours)
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentRSVPs = await RSVP.count({ where: { createdAt: { [Op.gte]: last24h } } });
    const recentComments = await Comment.count({ where: { createdAt: { [Op.gte]: last24h } } });

    res.json({
      success: true,
      data: {
        totalRSVPs,
        attending,
        notAttending,
        totalGuests,
        totalComments,
        recentActivity: {
          last24hRSVPs: recentRSVPs,
          last24hComments: recentComments,
        },
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

// GET /api/admin/rsvps - All RSVPs
router.get('/rsvps', authenticate, async (_req: Request, res: Response) => {
  try {
    const rsvps = await RSVP.findAll({
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: rsvps,
      total: rsvps.length,
    });
  } catch (error) {
    console.error('Admin RSVPs error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch RSVPs' });
  }
});

// GET /api/admin/comments - All comments/wishes
router.get('/comments', authenticate, async (_req: Request, res: Response) => {
  try {
    const comments = await Comment.findAll({
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: comments,
      total: comments.length,
    });
  } catch (error) {
    console.error('Admin comments error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch comments' });
  }
});

// GET /api/admin/export - Export RSVPs as JSON (for CSV conversion on frontend)
router.get('/export', authenticate, async (_req: Request, res: Response) => {
  try {
    const rsvps = await RSVP.findAll({
      order: [['createdAt', 'DESC']],
    });

    const exportData = rsvps.map((r: any) => ({
      name: r.name,
      attendance: r.attendance,
      guests: r.guests,
      wishes: r.wishes || '',
      guestNames: r.guestNames || [],
      rsvpDate: r.createdAt,
    }));

    res.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    console.error('Admin export error:', error);
    res.status(500).json({ success: false, error: 'Failed to export data' });
  }
});

export default router;