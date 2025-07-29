"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database...');
    // Create default admin user
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123'; // Change this in production!
    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail }
    });
    if (!existingAdmin) {
        const hashedPassword = await bcryptjs_1.default.hash(adminPassword, 12);
        const admin = await prisma.user.create({
            data: {
                email: adminEmail,
                name: 'System Administrator',
                phone: '555-0000',
                password: hashedPassword,
                role: 'ADMIN',
                isApproved: true,
                isActive: true,
                clubIds: 'default-club'
            }
        });
        console.log(`✅ Created admin user: ${admin.email}`);
    }
    else {
        console.log('ℹ️  Admin user already exists');
    }
    // Create a test member user
    const memberEmail = 'member@example.com';
    const memberPassword = 'member123';
    const existingMember = await prisma.user.findUnique({
        where: { email: memberEmail }
    });
    if (!existingMember) {
        const hashedPassword = await bcryptjs_1.default.hash(memberPassword, 12);
        const member = await prisma.user.create({
            data: {
                email: memberEmail,
                name: 'Test Member',
                phone: '555-0001',
                password: hashedPassword,
                role: 'MEMBER',
                isApproved: true,
                isActive: true,
                clubIds: 'default-club'
            }
        });
        console.log(`✅ Created member user: ${member.email}`);
    }
    else {
        console.log('ℹ️  Member user already exists');
    }
    // Create a pending user for testing approvals
    const pendingEmail = 'pending@example.com';
    const pendingPassword = 'pending123';
    const existingPending = await prisma.user.findUnique({
        where: { email: pendingEmail }
    });
    if (!existingPending) {
        const hashedPassword = await bcryptjs_1.default.hash(pendingPassword, 12);
        const pending = await prisma.user.create({
            data: {
                email: pendingEmail,
                name: 'Pending User',
                phone: '555-0002',
                password: hashedPassword,
                role: 'MEMBER',
                isApproved: false, // This user needs approval
                isActive: true,
                clubIds: 'default-club'
            }
        });
        console.log(`✅ Created pending user: ${pending.email}`);
    }
    else {
        console.log('ℹ️  Pending user already exists');
    }
    console.log('🎉 Database seeding completed!');
}
main()
    .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map