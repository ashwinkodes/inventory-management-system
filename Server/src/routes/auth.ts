import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { SessionManager } from '../utils/sessionManager';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const registerSchema = z.object({
    email: z.string().email(),
    name: z.string().min(1),
    phone: z.string().optional(),
    clubId: z.string().min(1)
});

const loginSchema = z.object({
    email: z.string().email(),

    password: z.string().min(1)
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const validatedData = registerSchema.parse(req.body);
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.email }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user (pending approval)
        const user = await prisma.user.create({
            data: {
                email: validatedData.email,
                name: validatedData.name,
                phone: validatedData.phone,
                clubIds: validatedData.clubId, // Store club ID in clubIds field
                password: hashedPassword,
                isApproved: false // Requires admin approval
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                clubIds: true,
                isApproved: true
            }
        });

        res.status(201).json({
            message: 'Registration successful! Please wait for admin approval before logging in.',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                isApproved: user.isApproved
            }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid data', details: error.errors });
        }
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to create account' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const validatedData = loginSchema.parse(req.body);

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: validatedData.email }
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if user is approved
        if (!user.isApproved) {
            return res.status(401).json({ error: 'Account pending admin approval' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create session
        const sessionToken = await SessionManager.createSession(user.id);

        // Set secure HTTP-only cookie
        res.cookie('sessionToken', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                clubIds: user.clubIds,
                isApproved: user.isApproved
            },
            token: sessionToken // Also return token for Authorization header usage
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid data', details: error.errors });
        }
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
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

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        // Get token from cookie or header
        const authHeader = req.headers['authorization'];
        const headerToken = authHeader && authHeader.split(' ')[1];
        const cookieToken = req.cookies?.sessionToken;
        const token = headerToken || cookieToken;

        if (token) {
            await SessionManager.deleteSession(token);
        }

        // Clear the cookie
        res.clearCookie('sessionToken');

        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Failed to logout' });
    }
});

// GET /api/auth/pending-users (Admin only)
router.get('/pending-users', authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const pendingUsers = await prisma.user.findMany({
            where: { 
                isApproved: false,
                isActive: true 
            },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                createdAt: true,
                isApproved: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(pendingUsers);
    } catch (error) {
        console.error('Error fetching pending users:', error);
        res.status(500).json({ error: 'Failed to fetch pending users' });
    }
});

// POST /api/auth/approve-user/:userId (Admin only)
router.post('/approve-user/:userId', authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { userId } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.isApproved) {
            return res.status(400).json({ error: 'User is already approved' });
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                isApproved: true,
                approvedBy: req.user.id,
                approvedAt: new Date()
            }
        });

        res.json({ message: 'User approved successfully' });
    } catch (error) {
        console.error('Error approving user:', error);
        res.status(500).json({ error: 'Failed to approve user' });
    }
});

// POST /api/auth/reject-user/:userId (Admin only)
router.post('/reject-user/:userId', authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { userId } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Soft delete by setting isActive to false
        await prisma.user.update({
            where: { id: userId },
            data: {
                isActive: false,
                approvedBy: req.user.id,
                approvedAt: new Date()
            }
        });

        res.json({ message: 'User rejected successfully' });
    } catch (error) {
        console.error('Error rejecting user:', error);
        res.status(500).json({ error: 'Failed to reject user' });
    }
});

export default router;