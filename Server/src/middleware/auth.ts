// server/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { SessionManager } from '../utils/sessionManager';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: string;
                clubIds: string;
            };
        }
    }
}

interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        clubIds: string;
    };
}

export const authenticateToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    // Try to get token from Authorization header or cookie
    const authHeader = req.headers['authorization'];
    const headerToken = authHeader && authHeader.split(' ')[1];
    const cookieToken = req.cookies?.sessionToken;
    
    const token = headerToken || cookieToken;

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const user = await SessionManager.validateSession(token);

        if (!user) {
            return res.status(401).json({ error: 'Invalid or expired session' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Session validation error:', error);
        return res.status(403).json({ error: 'Authentication failed' });
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

    // Members can only access their clubs (simplified for now)
    if (!clubId || req.user.clubIds !== clubId) {
        return res.status(403).json({ error: 'Access denied for this club' });
    }

    next();
};