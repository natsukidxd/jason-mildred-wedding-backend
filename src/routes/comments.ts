import { Router } from 'express';
import { Comment } from '../models';

const router = Router();

// GET /api/comments - Get paginated comments
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * perPage;

const { count, rows: comments } = await Comment.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit: perPage,
      offset: offset,
    });

    const totalPages = Math.ceil(count / perPage);

    res.json({
      success: true,
      data: {
        comments: comments.map((c: any) => ({
          id: parseInt((c.id as string).slice(0, 8), 16), // Simple ID conversion for frontend
          name: c.name,
          message: c.message,
          attendance: c.attendance,
          timestamp: formatTimestamp(c.createdAt as Date),
        })),
        page,
        totalPages,
        total: count,
      },
    });
  } catch (error) {
    console.error('Comments fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments',
    });
  }
});

// Helper function
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  return `${hours} hour${hours > 1 ? 's' : ''} ago`;
}

export default router;