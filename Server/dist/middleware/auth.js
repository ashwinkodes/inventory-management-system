"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireClubAccess = exports.requireAdmin = exports.authenticateToken = void 0;
const sessionManager_1 = require("../utils/sessionManager");
const authenticateToken = async (req, res, next) => {
    // Try to get token from Authorization header or cookie
    const authHeader = req.headers['authorization'];
    const headerToken = authHeader && authHeader.split(' ')[1];
    const cookieToken = req.cookies?.sessionToken;
    const token = headerToken || cookieToken;
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    try {
        const user = await sessionManager_1.SessionManager.validateSession(token);
        if (!user) {
            return res.status(401).json({ error: 'Invalid or expired session' });
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Session validation error:', error);
        return res.status(403).json({ error: 'Authentication failed' });
    }
};
exports.authenticateToken = authenticateToken;
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireClubAccess = (req, res, next) => {
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
exports.requireClubAccess = requireClubAccess;
//# sourceMappingURL=auth.js.map