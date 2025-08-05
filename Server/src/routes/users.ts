import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const updateUserSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    role: z.enum(['ADMIN', 'MEMBER']).optional(),
    clubIds: z.string().optional(),
    isActive: z.boolean().optional()
});

const createUserSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
    clubId: z.string().min(1),
    password: z.string().min(6)
});

// GET /api/users - Get all users (Admin only)
router.get('/', authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { search, role, club, status } = req.query;
        
        const where: any = {};
        
        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { email: { contains: search as string, mode: 'insensitive' } }
            ];
        }
        
        if (role && role !== 'all') {
            where.role = role;
        }
        
        if (club && club !== 'all') {
            where.clubIds = { contains: club as string };
        }
        
        if (status === 'approved') {
            where.isApproved = true;
            where.isActive = true;
        } else if (status === 'pending') {
            where.isApproved = false;
            where.isActive = true;
        } else if (status === 'inactive') {
            where.isActive = false;
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                clubIds: true,
                isActive: true,
                isApproved: true,
                createdAt: true,
                approvedAt: true,
                approvedBy: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// POST /api/users - Create new user (Admin only)
router.post('/', authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const validatedData = createUserSchema.parse(req.body);

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.email }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(validatedData.password, 12);

        const user = await prisma.user.create({
            data: {
                email: validatedData.email,
                name: validatedData.name,
                phone: validatedData.phone,
                role: validatedData.role,
                clubIds: validatedData.clubId,
                password: hashedPassword,
                isApproved: true, // Admin-created users are auto-approved
                approvedBy: req.user.id,
                approvedAt: new Date()
            },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                clubIds: true,
                isActive: true,
                isApproved: true,
                createdAt: true
            }
        });

        res.status(201).json(user);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid data', details: error.errors });
        }
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// PUT /api/users/:userId - Update user (Admin only)
router.put('/:userId', authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { userId } = req.params;
        const validatedData = updateUserSchema.parse(req.body);

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if email is being changed and already exists
        if (validatedData.email && validatedData.email !== existingUser.email) {
            const emailExists = await prisma.user.findUnique({
                where: { email: validatedData.email }
            });

            if (emailExists) {
                return res.status(400).json({ error: 'Email already in use' });
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: validatedData,
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                clubIds: true,
                isActive: true,
                isApproved: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.json(updatedUser);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid data', details: error.errors });
        }
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE /api/users/:userId - Delete user (Admin only)
router.delete('/:userId', authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { userId } = req.params;

        // Prevent admin from deleting themselves
        if (userId === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Soft delete by setting isActive to false
        await prisma.user.update({
            where: { id: userId },
            data: {
                isActive: false
            }
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// POST /api/users/:userId/reset-password - Reset user password (Admin only)
router.post('/:userId/reset-password', authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { userId } = req.params;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 12);

        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword
            }
        });

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

export default router;