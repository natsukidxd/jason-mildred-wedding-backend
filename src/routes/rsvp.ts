import { Router } from 'express';
import { RSVP } from '../models';
import { z } from 'zod';

const router = Router();

// Validation schema
const rsvpSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  attendance: z.enum(['Attending', 'Not Attending']),
  guests: z.number().min(1).max(2).default(1),
  wishes: z.string().optional(),
});

// POST /api/rsvp - Create RSVP
router.post('/', async (req, res) => {
  try {
    const validatedData = rsvpSchema.parse(req.body);

    const rsvp = await RSVP.create({
      ...validatedData,
      wishes: validatedData.wishes || '',
    } as any);

    // Auto-create comment from RSVP wishes
    if (validatedData.wishes) {
      const { Comment } = await import('../models');
      await Comment.create({
        name: validatedData.name,
        message: validatedData.wishes,
        attendance: validatedData.attendance,
      } as any);
    }

    res.status(201).json({
      success: true,
      data: rsvp,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    console.error('RSVP creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create RSVP',
    });
  }
});

// GET /api/rsvp - Get all RSVPs (admin endpoint)
router.get('/', async (req, res) => {
  try {
    const rsvps = await RSVP.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json({
      success: true,
      data: rsvps,
    });
  } catch (error) {
    console.error('RSVP fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch RSVPs',
    });
  }
});

export default router;