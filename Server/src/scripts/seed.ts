import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Create default admin user
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123'; // Change this in production!

    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail }
    });

    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        
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
    } else {
        console.log('ℹ️  Admin user already exists');
    }

    // Create a test member user
    const memberEmail = 'member@example.com';
    const memberPassword = 'member123';

    const existingMember = await prisma.user.findUnique({
        where: { email: memberEmail }
    });

    if (!existingMember) {
        const hashedPassword = await bcrypt.hash(memberPassword, 12);
        
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
    } else {
        console.log('ℹ️  Member user already exists');
    }

    // Create a pending user for testing approvals
    const pendingEmail = 'pending@example.com';
    const pendingPassword = 'pending123';

    const existingPending = await prisma.user.findUnique({
        where: { email: pendingEmail }
    });

    if (!existingPending) {
        const hashedPassword = await bcrypt.hash(pendingPassword, 12);
        
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
    } else {
        console.log('ℹ️  Pending user already exists');
    }

    // Create sample gear items with NZ-popular brands
    const gearItems = [
        // Backpacks - Macpac, Osprey, Gregory
        {
            name: 'Cascade 65L',
            brand: 'Macpac',
            model: 'Cascade',
            category: 'BACKPACK',
            description: 'Large capacity hiking backpack ideal for multi-day tramping trips',
            condition: 'GOOD',
            size: '65L',
            weight: '2.1kg',
            clubId: 'default-club',
            purchasePrice: 299.99,
            notes: 'Popular choice for Great Walks'
        },
        {
            name: 'Atmos AG 50',
            brand: 'Osprey',
            model: 'Atmos AG',
            category: 'BACKPACK',
            description: 'Anti-Gravity suspension system for comfortable carrying',
            condition: 'EXCELLENT',
            size: '50L',
            weight: '1.9kg',
            clubId: 'default-club',
            purchasePrice: 425.00,
            notes: 'Excellent ventilation system'
        },
        {
            name: 'Kahu 22L',
            brand: 'Macpac',
            model: 'Kahu',
            category: 'BACKPACK',
            description: 'Day pack perfect for day hikes and urban adventures',
            condition: 'GOOD',
            size: '22L',
            weight: '0.8kg',
            clubId: 'default-club',
            purchasePrice: 139.99
        },

        // Sleeping Bags - Macpac, Sea to Summit, Mountain Safety Research
        {
            name: 'Latitude XP',
            brand: 'Macpac',
            model: 'Latitude XP',
            category: 'SLEEPING_BAG',
            description: 'Synthetic sleeping bag rated to -5°C, great for NZ conditions',
            condition: 'GOOD',
            size: 'Regular',
            weight: '1.4kg',
            clubId: 'default-club',
            purchasePrice: 199.99,
            notes: 'Handles moisture well in NZ climate'
        },
        {
            name: 'Spark III',
            brand: 'Sea to Summit',
            model: 'Spark',
            category: 'SLEEPING_BAG',
            description: 'Ultralight down sleeping bag for summer tramping',
            condition: 'EXCELLENT',
            size: 'Long',
            weight: '0.6kg',
            clubId: 'default-club',
            purchasePrice: 459.99,
            notes: 'Premium down fill, very packable'
        },
        {
            name: 'Hyperthermic',
            brand: 'MSR',
            model: 'Hyperthermic',
            category: 'SLEEPING_BAG',
            description: 'Cold weather sleeping bag for alpine conditions',
            condition: 'GOOD',
            size: 'Regular',
            weight: '2.2kg',
            clubId: 'default-club',
            purchasePrice: 649.99
        },

        // Sleeping Pads - Therm-a-Rest, Sea to Summit, Exped
        {
            name: 'NeoAir XLite',
            brand: 'Therm-a-Rest',
            model: 'NeoAir XLite',
            category: 'SLEEPING_PAD',
            description: 'Ultralight inflatable sleeping pad with excellent R-value',
            condition: 'EXCELLENT',
            size: 'Regular',
            weight: '0.35kg',
            clubId: 'default-club',
            purchasePrice: 279.99,
            notes: 'R-value 4.2, very popular choice'
        },
        {
            name: 'Comfort Plus SI',
            brand: 'Sea to Summit',
            model: 'Comfort Plus',
            category: 'SLEEPING_PAD',
            description: 'Self-inflating sleeping pad with dual chambers',
            condition: 'GOOD',
            size: 'Large',
            weight: '0.9kg',
            clubId: 'default-club',
            purchasePrice: 199.99
        },
        {
            name: 'SynMat HL',
            brand: 'Exped',
            model: 'SynMat HL',
            category: 'SLEEPING_PAD',
            description: 'Lightweight synthetic insulated sleeping pad',
            condition: 'FAIR',
            size: 'Medium',
            weight: '0.48kg',
            clubId: 'default-club',
            purchasePrice: 169.99,
            notes: 'Minor repair needed on valve'
        },

        // Tents - The North Face, MSR, Macpac
        {
            name: 'VE 25',
            brand: 'The North Face',
            model: 'VE 25',
            category: 'TENT',
            description: 'Expedition tent for extreme weather conditions',
            condition: 'GOOD',
            size: '2-person',
            weight: '4.2kg',
            clubId: 'default-club',
            purchasePrice: 899.99,
            notes: 'Perfect for NZ alpine conditions'
        },
        {
            name: 'Hubba Hubba NX',
            brand: 'MSR',
            model: 'Hubba Hubba NX',
            category: 'TENT',
            description: 'Lightweight 2-person backpacking tent',
            condition: 'EXCELLENT',
            size: '2-person',
            weight: '1.7kg',
            clubId: 'default-club',
            purchasePrice: 649.99,
            notes: 'Excellent ventilation and setup'
        },
        {
            name: 'Minaret',
            brand: 'Macpac',
            model: 'Minaret',
            category: 'TENT',
            description: 'Classic Kiwi hiking tent, reliable in all conditions',
            condition: 'GOOD',
            size: '2-person',
            weight: '2.8kg',
            clubId: 'default-club',
            purchasePrice: 449.99,
            notes: 'NZ designed for NZ conditions'
        },

        // Climbing Gear - Black Diamond, Petzl, Mammut
        {
            name: 'Raven Pro',
            brand: 'Black Diamond',
            model: 'Raven Pro',
            category: 'ICE_AXE',
            description: 'Technical ice axe for alpine climbing and mountaineering',
            condition: 'GOOD',
            size: '70cm',
            weight: '0.55kg',
            clubId: 'default-club',
            purchasePrice: 189.99,
            notes: 'Recently sharpened'
        },
        {
            name: 'Glacier',
            brand: 'Petzl',
            model: 'Glacier',
            category: 'ICE_AXE',
            description: 'Classic mountaineering ice axe for snow and ice travel',
            condition: 'EXCELLENT',
            size: '60cm',
            weight: '0.48kg',
            clubId: 'default-club',
            purchasePrice: 159.99
        },
        {
            name: 'Contact Strap',
            brand: 'Black Diamond',
            model: 'Contact Strap',
            category: 'CRAMPONS',
            description: 'Versatile strap-on crampons for mountaineering',
            condition: 'GOOD',
            size: 'Medium',
            weight: '0.9kg',
            clubId: 'default-club',
            purchasePrice: 219.99,
            notes: 'Fits most mountaineering boots'
        },
        {
            name: 'Leopard',
            brand: 'Petzl',
            model: 'Leopard',
            category: 'CRAMPONS',
            description: 'Lightweight technical crampons for mixed climbing',
            condition: 'EXCELLENT',
            size: 'Large',
            weight: '0.85kg',
            clubId: 'default-club',
            purchasePrice: 329.99
        },

        // Helmets
        {
            name: 'Vector',
            brand: 'Black Diamond',
            model: 'Vector',
            category: 'HELMET',
            description: 'Lightweight climbing and mountaineering helmet',
            condition: 'GOOD',
            size: 'Medium',
            weight: '0.22kg',
            clubId: 'default-club',
            purchasePrice: 99.99
        },
        {
            name: 'Boreo',
            brand: 'Petzl',
            model: 'Boreo',
            category: 'HELMET',
            description: 'Versatile helmet for climbing and mountaineering',
            condition: 'EXCELLENT',
            size: 'Large',
            weight: '0.29kg',
            clubId: 'default-club',
            purchasePrice: 89.99
        },

        // Cooking Gear - MSR, Jetboil, Primus
        {
            name: 'PocketRocket 2',
            brand: 'MSR',
            model: 'PocketRocket 2',
            category: 'COOKING',
            description: 'Ultralight canister stove for backpacking',
            condition: 'EXCELLENT',
            weight: '0.073kg',
            clubId: 'default-club',
            purchasePrice: 79.99,
            notes: 'Includes piezo igniter'
        },
        {
            name: 'Flash',
            brand: 'Jetboil',
            model: 'Flash',
            category: 'COOKING',
            description: 'Fast-boiling integrated canister stove system',
            condition: 'GOOD',
            weight: '0.44kg',
            clubId: 'default-club',
            purchasePrice: 149.99,
            notes: 'Includes 1L FluxRing cooking cup'
        },
        {
            name: 'Eta Power',
            brand: 'Primus',
            model: 'Eta Power',
            category: 'COOKING',
            description: 'Efficient integrated cooking system with heat exchanger',
            condition: 'GOOD',
            weight: '0.89kg',
            clubId: 'default-club',
            purchasePrice: 199.99
        },

        // Water Activities - Werner, NRS, Palm
        {
            name: 'Camano',
            brand: 'Werner',
            model: 'Camano',
            category: 'PADDLE',
            description: 'Versatile touring paddle for sea kayaking',
            condition: 'GOOD',
            size: '220cm',
            weight: '0.9kg',
            clubId: 'default-club',
            purchasePrice: 329.99,
            notes: 'Carbon shaft with fiberglass blades'
        },
        {
            name: 'Chinook OS',
            brand: 'NRS',
            model: 'Chinook OS',
            category: 'PFD',
            description: 'Fishing and touring PFD with multiple pockets',
            condition: 'EXCELLENT',
            size: 'Large',
            weight: '0.8kg',
            clubId: 'default-club',
            purchasePrice: 179.99
        },
        {
            name: 'Taurus',
            brand: 'Palm',
            model: 'Taurus',
            category: 'PFD',
            description: 'High-performance whitewater PFD',
            condition: 'GOOD',
            size: 'Medium',
            weight: '0.65kg',
            clubId: 'default-club',
            purchasePrice: 199.99,
            notes: 'Quick-release belt included'
        }
    ];

    console.log('Creating sample gear items...');
    let createdCount = 0;

    for (const gearData of gearItems) {
        try {
            // Check if item already exists
            const existingItem = await prisma.gearItem.findFirst({
                where: {
                    name: gearData.name,
                    brand: gearData.brand,
                    model: gearData.model
                }
            });

            if (!existingItem) {
                await prisma.gearItem.create({
                    data: {
                        ...gearData,
                        purchaseDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000) // Random date within last year
                    } as any // TypeScript workaround for string enums
                });
                createdCount++;
                console.log(`✅ Created: ${gearData.brand} ${gearData.name}`);
            }
        } catch (error) {
            console.error(`❌ Failed to create ${gearData.name}:`, error);
        }
    }

    console.log(`🎒 Created ${createdCount} gear items`);
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