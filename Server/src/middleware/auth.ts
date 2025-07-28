// server/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        clubIds: string[];
    };
}

export const authenticateToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        // Fetch fresh user data
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                role: true,
                clubIds: true,
                isActive: true
            }
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'User not found or inactive' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

export const requireAdmin = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

export const requireClubAccess = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const clubId = req.params.clubId || req.body.clubId;

    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Admins have access to all clubs
    if (req.user.role === 'ADMIN') {
        return next();
    }

    // Members can only access their clubs
    if (!clubId || !req.user.clubIds.includes(clubId)) {
        return res.status(403).json({ error: 'Access denied for this club' });
    }

    next();
};