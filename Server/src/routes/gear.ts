// server/src/routes/gear.ts
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createGearSchema = z.object({
    name: z.string().min(1),
    brand: z.string().optional(),
    model: z.string().optional(),
    category: z.enum([
        'BACKPACK', 'SLEEPING_BAG', 'SLEEPING_PAD', 'TENT', 'COOKING',
        'CLIMBING_HARNESS', 'CLIMBING_SHOES', 'ICE_AXE', 'CRAMPONS',
        'HELMET', 'ROPE', 'CANOE_KAYAK', 'PADDLE', 'PFD', 'OTHER'
    ]),
    description: z.string().optional(),
    condition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'RETIRED']).default('GOOD'),
    size: z.string().optional(),
    weight: z.string().optional(),
    clubId: z.string(),
    purchasePrice: z.number().optional(),
    notes: z.string().optional()
});

// GET /api/gear - Get all gear items with filtering
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { category, available, clubId, search } = req.query;
        const { startDate, endDate } = req.query;

        let where: any = {
            isActive: true
        };

        // Filter by category
        if (category && category !== 'all') {
            where.category = category;
        }

        // Filter by club
        if (clubId) {
            where.clubId = clubId;
        } else if (req.user?.role !== 'ADMIN') {
            // Non-admins can only see gear from their clubs
            where.clubId = { in: req.user?.clubIds || [] };
        }

        // Search functionality
        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { brand: { contains: search as string, mode: 'insensitive' } },
                { model: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        let gear = await prisma.gearItem.findMany({
            where,
            include: {
                requests: {
                    where: {
                        status: { in: ['APPROVED', 'ACTIVE'] },
                        ...(startDate && endDate ? {
                            OR: [
                                {
                                    startDate: { lte: new Date(endDate as string) },
                                    endDate: { gte: new Date(startDate as string) }
                                }
                            ]
                        } : {})
                    },
                    select: {
                        startDate: true,
                        endDate: true,
                        status: true
                    }
                }
            },
            orderBy: [
                { category: 'asc' },
                { name: 'asc' }
            ]
        });

        // Filter by availability if requested
        if (available === 'true' && startDate && endDate) {
            gear = gear.filter(item => item.requests.length === 0);
        }

        // Add availability info
        const gearWithAvailability = gear.map(item => ({
            ...item,
            isAvailable: item.requests.length === 0,
            nextAvailable: item.requests.length > 0
                ? item.requests.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())[0].endDate
                : null
        }));

        res.json(gearWithAvailability);
    } catch (error) {
        console.error('Error fetching gear:', error);
        res.status(500).json({ error: 'Failed to fetch gear items' });
    }
});

// GET /api/gear/:id - Get specific gear item
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const gear = await prisma.gearItem.findUnique({
            where: { id: req.params.id },
            include: {
                requests: {
                    include: {
                        request: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        request: {
                            startDate: 'desc'
                        }
                    }
                }
            }
        });

        if (!gear) {
            return res.status(404).json({ error: 'Gear item not found' });
        }

        // Check access permissions
        if (req.user?.role !== 'ADMIN' && !req.user?.clubIds.includes(gear.clubId)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(gear);
    } catch (error) {
        console.error('Error fetching gear item:', error);
        res.status(500).json({ error: 'Failed to fetch gear item' });
    }
});

// POST /api/gear - Create new gear item (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const validatedData = createGearSchema.parse(req.body);

        const gear = await prisma.gearItem.create({
            data: {
                ...validatedData,
                purchaseDate: new Date()
            }
        });

        res.status(201).json(gear);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid data', details: error.errors });
        }
        console.error('Error creating gear:', error);
        res.status(500).json({ error: 'Failed to create gear item' });
    }
});

// PUT /api/gear/:id - Update gear item (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const validatedData = createGearSchema.partial().parse(req.body);

        const gear = await prisma.gearItem.update({
            where: { id: req.params.id },
            data: validatedData
        });

        res.json(gear);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid data', details: error.errors });
        }
        console.error('Error updating gear:', error);
        res.status(500).json({ error: 'Failed to update gear item' });
    }
});

// DELETE /api/gear/:id - Soft delete gear item (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await prisma.gearItem.update({
            where: { id: req.params.id },
            data: { isActive: false }
        });

        res.json({ message: 'Gear item deactivated successfully' });
    } catch (error) {
        console.error('Error deleting gear:', error);
        res.status(500).json({ error: 'Failed to delete gear item' });
    }
});

// GET /api/gear/categories/stats - Get gear statistics by category
router.get('/categories/stats', authenticateToken, async (req, res) => {
    try {
        const stats = await prisma.gearItem.groupBy({
            by: ['category'],
            where: {
                isActive: true,
                ...(req.user?.role !== 'ADMIN' ? {
                    clubId: { in: req.user?.clubIds || [] }
                } : {})
            },
            _count: {
                id: true
            }
        });

        res.json(stats);
    } catch (error) {
        console.error('Error fetching gear stats:', error);
        res.status(500).json({ error: 'Failed to fetch gear statistics' });
    }
});

export default router;