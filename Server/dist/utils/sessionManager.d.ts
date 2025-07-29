export declare class SessionManager {
    static createSession(userId: string): Promise<string>;
    static validateSession(token: string): Promise<{
        id: string;
        name: string;
        email: string;
        role: string;
        clubIds: string;
        isActive: boolean;
        isApproved: boolean;
    } | null>;
    static deleteSession(token: string): Promise<void>;
    static deleteAllUserSessions(userId: string): Promise<void>;
    static cleanupExpiredSessions(userId?: string): Promise<void>;
    static getUserSessions(userId: string): Promise<{
        id: string;
        expiresAt: Date;
        createdAt: Date;
    }[]>;
}
