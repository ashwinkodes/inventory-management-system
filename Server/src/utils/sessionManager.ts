import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class SessionManager {
    // Create a new session
    static async createSession(userId: string): Promise<string> {
        // Generate a secure random token
        const token = crypto.randomBytes(32).toString('hex');
        
        // Set expiration to 7 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Clean up expired sessions for this user
        await this.cleanupExpiredSessions(userId);

        // Create new session
        await prisma.session.create({
            data: {
                userId,
                token,
                expiresAt
            }
        });

        return token;
    }

    // Validate a session token
    static async validateSession(token: string) {
        const session = await prisma.session.findUnique({
            where: { token },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        clubIds: true,
                        isActive: true,
                        isApproved: true
                    }
                }
            }
        });

        // Check if session exists and is not expired
        if (!session || session.expiresAt < new Date()) {
            if (session) {
                // Clean up expired session
                await this.deleteSession(token);
            }
            return null;
        }

        // Check if user is active and approved
        if (!session.user.isActive || !session.user.isApproved) {
            return null;
        }

        // Update session expiration (sliding expiration)
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + 7);
        
        await prisma.session.update({
            where: { token },
            data: { expiresAt: newExpiresAt }
        });

        return session.user;
    }

    // Delete a specific session (logout)
    static async deleteSession(token: string): Promise<void> {
        await prisma.session.delete({
            where: { token }
        }).catch(() => {
            // Ignore if session doesn't exist
        });
    }

    // Delete all sessions for a user
    static async deleteAllUserSessions(userId: string): Promise<void> {
        await prisma.session.deleteMany({
            where: { userId }
        });
    }

    // Clean up expired sessions
    static async cleanupExpiredSessions(userId?: string): Promise<void> {
        const where = userId 
            ? { userId, expiresAt: { lt: new Date() } }
            : { expiresAt: { lt: new Date() } };

        await prisma.session.deleteMany({ where });
    }

    // Get all active sessions for a user (for admin purposes)
    static async getUserSessions(userId: string) {
        return await prisma.session.findMany({
            where: {
                userId,
                expiresAt: { gt: new Date() }
            },
            select: {
                id: true,
                createdAt: true,
                expiresAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}

// Cleanup expired sessions periodically (run every hour)
setInterval(() => {
    SessionManager.cleanupExpiredSessions();
}, 60 * 60 * 1000);