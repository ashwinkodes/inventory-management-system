"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/src/routes/gear.ts
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Validation schemas
const createGearSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    brand: zod_1.z.string().optional(),
    model: zod_1.z.string().optional(),
    category: zod_1.z.enum([
        'BACKPACK', 'SLEEPING_BAG', 'SLEEPING_PAD', 'TENT', 'COOKING',
        'CLIMBING_HARNESS', 'CLIMBING_SHOES', 'ICE_AXE', 'CRAMPONS',
        'HELMET', 'ROPE', 'CANOE_KAYAK', 'PADDLE', 'PFD', 'OTHER'
    ]),
    description: zod_1.z.string().optional(),
    condition: zod_1.z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'RETIRED']).default('GOOD'),
    size: zod_1.z.string().optional(),
    weight: zod_1.z.string().optional(),
    clubId: zod_1.z.string(),
    purchasePrice: zod_1.z.number().optional(),
    notes: zod_1.z.string().optional()
});
// GET /api/gear - Get all gear items with filtering
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { category, available, clubId, search } = req.query;
        const { startDate, endDate } = req.query;
        let where = {
            isActive: true
        };
        // Filter by category
        if (category && category !== 'all') {
            where.category = category;
        }
        // Filter by club
        if (clubId) {
            where.clubId = clubId;
        }
        else if (req.user?.role !== 'ADMIN') {
            // Non-admins can only see gear from their clubs
            where.clubId = req.user?.clubIds || 'default-club';
        }
        // Search functionality
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { brand: { contains: search, mode: 'insensitive' } },
                { model: { contains: search, mode: 'insensitive' } }
            ];
        }
        let gear = await prisma.gearItem.findMany({
            where,
            include: {
                requests: {
                    where: {
                        status: { in: ['APPROVED', 'CHECKED_OUT'] },
                        ...(startDate && endDate ? {
                            request: {
                                OR: [
                                    {
                                        startDate: { lte: new Date(endDate) },
                                        endDate: { gte: new Date(startDate) }
                                    }
                                ]
                            }
                        } : {})
                    },
                    include: {
                        request: {
                            select: {
                                startDate: true,
                                endDate: true,
                                status: true
                            }
                        }
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
                ? item.requests.sort((a, b) => new Date(a.request.endDate).getTime() - new Date(b.request.endDate).getTime())[0].request.endDate
                : null
        }));
        res.json(gearWithAvailability);
    }
    catch (error) {
        console.error('Error fetching gear:', error);
        res.status(500).json({ error: 'Failed to fetch gear items' });
    }
});
// GET /api/gear/:id - Get specific gear item
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
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
        if (req.user?.role !== 'ADMIN' && req.user?.clubIds !== gear.clubId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json(gear);
    }
    catch (error) {
        console.error('Error fetching gear item:', error);
        res.status(500).json({ error: 'Failed to fetch gear item' });
    }
});
// POST /api/gear - Create new gear item (admin only)
router.post('/', auth_1.authenticateToken, auth_1.requireAdmin, upload_1.uploadGearImage.single('image'), async (req, res) => {
    try {
        const validatedData = createGearSchema.parse(req.body);
        // Handle image upload
        let imageUrl = null;
        if (req.file) {
            imageUrl = (0, upload_1.getFileUrl)(req.file.filename);
        }
        const gear = await prisma.gearItem.create({
            data: {
                ...validatedData,
                imageUrl,
                purchaseDate: new Date()
            }
        });
        res.status(201).json(gear);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid data', details: error.errors });
        }
        console.error('Error creating gear:', error);
        res.status(500).json({ error: 'Failed to create gear item' });
    }
});
// PUT /api/gear/:id - Update gear item (admin only)
router.put('/:id', auth_1.authenticateToken, auth_1.requireAdmin, upload_1.uploadGearImage.single('image'), async (req, res) => {
    try {
        const validatedData = createGearSchema.partial().parse(req.body);
        // Get current gear to check for existing image
        const currentGear = await prisma.gearItem.findUnique({
            where: { id: req.params.id },
            select: { imageUrl: true }
        });
        if (!currentGear) {
            return res.status(404).json({ error: 'Gear item not found' });
        }
        let updateData = { ...validatedData };
        // Handle new image upload
        if (req.file) {
            // Delete old image if it exists
            if (currentGear.imageUrl) {
                const oldImagePath = path_1.default.join(process.cwd(), 'uploads', 'gear-images', path_1.default.basename(currentGear.imageUrl));
                (0, upload_1.deleteUploadedFile)(oldImagePath);
            }
            updateData.imageUrl = (0, upload_1.getFileUrl)(req.file.filename);
        }
        const gear = await prisma.gearItem.update({
            where: { id: req.params.id },
            data: updateData
        });
        res.json(gear);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid data', details: error.errors });
        }
        console.error('Error updating gear:', error);
        res.status(500).json({ error: 'Failed to update gear item' });
    }
});
// DELETE /api/gear/:id - Soft delete gear item (admin only)
router.delete('/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        // Get current gear to check for image
        const currentGear = await prisma.gearItem.findUnique({
            where: { id: req.params.id },
            select: { imageUrl: true }
        });
        if (!currentGear) {
            return res.status(404).json({ error: 'Gear item not found' });
        }
        await prisma.gearItem.update({
            where: { id: req.params.id },
            data: { isActive: false }
        });
        // Optionally delete image file when gear is deactivated
        // Uncomment the lines below if you want to delete images immediately
        // if (currentGear.imageUrl) {
        //     const imagePath = path.join(process.cwd(), 'uploads', 'gear-images', path.basename(currentGear.imageUrl));
        //     deleteUploadedFile(imagePath);
        // }
        res.json({ message: 'Gear item deactivated successfully' });
    }
    catch (error) {
        console.error('Error deleting gear:', error);
        res.status(500).json({ error: 'Failed to delete gear item' });
    }
});
// GET /api/gear/categories/stats - Get gear statistics by category
router.get('/categories/stats', auth_1.authenticateToken, async (req, res) => {
    try {
        const stats = await prisma.gearItem.groupBy({
            by: ['category'],
            where: {
                isActive: true,
                ...(req.user?.role !== 'ADMIN' ? {
                    clubId: req.user?.clubIds || 'default-club'
                } : {})
            },
            _count: {
                id: true
            }
        });
        res.json(stats);
    }
    catch (error) {
        console.error('Error fetching gear stats:', error);
        res.status(500).json({ error: 'Failed to fetch gear statistics' });
    }
});
exports.default = router;
//# sourceMappingURL=gear.js.map