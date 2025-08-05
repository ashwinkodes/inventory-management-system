import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createRequestSchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  tripName: z.string().min(1),
  intentionsCode: z.string().min(1),
  purpose: z.enum(['tramping', 'climbing', 'kayaking', 'camping', 'course', 'other']),
  experience: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  notes: z.string().optional(),
  gearItems: z.array(z.object({
    gearId: z.string(),
    quantity: z.number().int().min(1)
  }))
});

// GET /api/requests - Get user's requests
router.get('/', authenticateToken, async (req, res) => {
  try {
    const requests = await prisma.request.findMany({
      where: {
        userId: req.user!.id
      },
      include: {
        items: {
          include: {
            gearItem: {
              select: {
                id: true,
                name: true,
                brand: true,
                category: true,
                imageUrl: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// POST /api/requests - Create new request
router.post('/', authenticateToken, async (req, res) => {
  try {
    const validatedData = createRequestSchema.parse(req.body);

    // Validate dates
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);
    
    if (startDate >= endDate) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    if (startDate < new Date()) {
      return res.status(400).json({ error: 'Request cannot be for past dates' });
    }

    // Validate gear items exist and are available
    const gearIds = validatedData.gearItems.map(item => item.gearId);
    const gearItems = await prisma.gearItem.findMany({
      where: {
        id: { in: gearIds },
        isActive: true
      }
    });

    if (gearItems.length !== gearIds.length) {
      return res.status(400).json({ error: 'Some gear items are not available' });
    }

    // Check for conflicts with existing approved requests
    const conflictingRequests = await prisma.request.findMany({
      where: {
        status: { in: ['APPROVED', 'CHECKED_OUT'] },
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate }
          }
        ],
        items: {
          some: {
            gearItem: {
              id: { in: gearIds }
            }
          }
        }
      },
      include: {
        items: {
          include: {
            gearItem: true
          }
        }
      }
    });

    if (conflictingRequests.length > 0) {
      const conflictingGear = conflictingRequests.flatMap(req => 
        req.items.filter(item => gearIds.includes(item.gearItem.id))
          .map(item => item.gearItem.name)
      );
      return res.status(400).json({ 
        error: `Some gear is already reserved for this period: ${conflictingGear.join(', ')}` 
      });
    }

    // Create the request
    const request = await prisma.request.create({
      data: {
        userId: req.user!.id,
        startDate,
        endDate,
        tripName: validatedData.tripName,
        intentionsCode: validatedData.intentionsCode,
        purpose: validatedData.purpose,
        experience: validatedData.experience,
        notes: validatedData.notes,
        items: {
          create: validatedData.gearItems.map(item => ({
            gearItemId: item.gearId,
            quantity: item.quantity
          }))
        }
      },
      include: {
        items: {
          include: {
            gearItem: {
              select: {
                id: true,
                name: true,
                brand: true,
                category: true,
                imageUrl: true
              }
            }
          }
        }
      }
    });

    res.status(201).json(request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error creating request:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// GET /api/requests/all - Get all requests (admin only)
router.get('/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, userId } = req.query;
    
    let where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (userId) {
      where.userId = userId;
    }

    const requests = await prisma.request.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          include: {
            gearItem: {
              select: {
                id: true,
                name: true,
                brand: true,
                category: true,
                imageUrl: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching all requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// PUT /api/requests/:id/status - Update request status (admin only)
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['APPROVED', 'REJECTED', 'CHECKED_OUT', 'RETURNED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const request = await prisma.request.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            gearItem: true
          }
        }
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Update the request
    const updatedRequest = await prisma.request.update({
      where: { id },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: req.user!.id,
        reviewNotes: notes
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        items: {
          include: {
            gearItem: true
          }
        }
      }
    });

    res.json(updatedRequest);
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ error: 'Failed to update request status' });
  }
});

// PUT /api/requests/:id/items - Modify request items (admin only)
router.put('/:id/items', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body; // Array of { gearId, quantity }

    const request = await prisma.request.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Only allow modifications for pending or approved requests
    if (!['PENDING', 'APPROVED'].includes(request.status)) {
      return res.status(400).json({ error: 'Cannot modify items for this request status' });
    }

    // Validate that all gear items exist
    const gearIds = items.map((item: any) => item.gearId);
    const gearItems = await prisma.gearItem.findMany({
      where: {
        id: { in: gearIds },
        isActive: true
      }
    });

    if (gearItems.length !== gearIds.length) {
      return res.status(400).json({ error: 'Some gear items are not available' });
    }

    // Delete existing items and create new ones
    await prisma.requestItem.deleteMany({
      where: { requestId: id }
    });

    const updatedRequest = await prisma.request.update({
      where: { id },
      data: {
        items: {
          create: items.map((item: any) => ({
            gearItemId: item.gearId,
            quantity: item.quantity
          }))
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        items: {
          include: {
            gearItem: {
              select: {
                id: true,
                name: true,
                brand: true,
                category: true,
                imageUrl: true
              }
            }
          }
        }
      }
    });

    res.json(updatedRequest);
  } catch (error) {
    console.error('Error modifying request items:', error);
    res.status(500).json({ error: 'Failed to modify request items' });
  }
});

// DELETE /api/requests/:id - Cancel request (user can cancel their own pending requests)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const request = await prisma.request.findUnique({
      where: { id }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Users can only cancel their own requests, and only if they're pending
    if (request.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    if (request.status !== 'PENDING' && req.user!.role !== 'ADMIN') {
      return res.status(400).json({ error: 'Can only cancel pending requests' });
    }

    await prisma.request.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      }
    });

    res.json({ message: 'Request cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling request:', error);
    res.status(500).json({ error: 'Failed to cancel request' });
  }
});

export default router;