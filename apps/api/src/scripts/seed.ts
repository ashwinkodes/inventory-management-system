import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Reset gear/request data for idempotent reseeds (order matters for FKs).
  await prisma.requestItem.deleteMany();
  await prisma.request.deleteMany();
  await prisma.gearVisibility.deleteMany();
  await prisma.gearItem.deleteMany();

  // Create clubs
  const autc = await prisma.club.upsert({
    where: { slug: "autc" },
    update: {},
    create: {
      name: "Auckland University Tramping Club",
      slug: "autc",
      description: "AUTC - Tramping, hiking, and outdoor adventures",
    },
  });

  const aurac = await prisma.club.upsert({
    where: { slug: "aurac" },
    update: {},
    create: {
      name: "Auckland University Rock and Alpine Club",
      slug: "aurac",
      description: "AURAC - Rock climbing and alpine sports",
    },
  });

  const aucc = await prisma.club.upsert({
    where: { slug: "aucc" },
    update: {},
    create: {
      name: "Auckland University Canoe Club",
      slug: "aucc",
      description: "AUCC - Kayaking and canoeing",
    },
  });

  // Create admin user
  const adminHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash: adminHash,
      name: "Admin User",
      role: "ADMIN",
      isApproved: true,
      clubs: {
        create: [{ clubId: autc.id }, { clubId: aurac.id }, { clubId: aucc.id }],
      },
    },
  });

  // Create member user
  const memberHash = await bcrypt.hash("member123", 12);
  const member = await prisma.user.upsert({
    where: { email: "member@example.com" },
    update: {},
    create: {
      email: "member@example.com",
      passwordHash: memberHash,
      name: "Test Member",
      role: "MEMBER",
      isApproved: true,
      clubs: {
        create: [{ clubId: autc.id }, { clubId: aurac.id }],
      },
    },
  });

  // Create pending user
  const pendingHash = await bcrypt.hash("pending123", 12);
  await prisma.user.upsert({
    where: { email: "pending@example.com" },
    update: {},
    create: {
      email: "pending@example.com",
      passwordHash: pendingHash,
      name: "Pending User",
      role: "MEMBER",
      isApproved: false,
      clubs: {
        create: [{ clubId: autc.id }],
      },
    },
  });

  // Create gear items for AUTC
  const autcGear = [
    { name: "Osprey Atmos 65L", brand: "Osprey", category: "Backpacks", condition: "GOOD", quantity: 3 },
    { name: "Deuter Aircontact 55+10", brand: "Deuter", category: "Backpacks", condition: "EXCELLENT", quantity: 2 },
    { name: "MSR Hubba Hubba 2P", brand: "MSR", category: "Tents", condition: "GOOD", quantity: 4 },
    { name: "MSR Elixir 3P", brand: "MSR", category: "Tents", condition: "FAIR", quantity: 2 },
    { name: "Sea to Summit Comfort Plus Insulated", brand: "Sea to Summit", category: "Sleeping Mats", condition: "GOOD", quantity: 6 },
    { name: "Nemo Disco 15 Sleeping Bag", brand: "Nemo", category: "Sleeping Bags", condition: "GOOD", quantity: 5 },
    { name: "Sea to Summit Trek TkII", brand: "Sea to Summit", category: "Sleeping Bags", condition: "EXCELLENT", quantity: 3 },
    { name: "MSR PocketRocket Stove", brand: "MSR", category: "Cooking", condition: "GOOD", quantity: 4 },
    { name: "GSI Pinnacle Dualist Cookset", brand: "GSI", category: "Cooking", condition: "GOOD", quantity: 3 },
    { name: "Petzl Actik Core Headlamp", brand: "Petzl", category: "Lighting", condition: "GOOD", quantity: 8 },
    { name: "Garmin inReach Mini 2", brand: "Garmin", category: "Navigation", condition: "EXCELLENT", quantity: 2 },
    { name: "Suunto MC-2 Compass", brand: "Suunto", category: "Navigation", condition: "GOOD", quantity: 5 },
  ];

  for (const gear of autcGear) {
    await prisma.gearItem.create({
      data: { ...gear, ownerClubId: autc.id },
    });
  }

  // Create gear items for AURAC
  const auracGear = [
    { name: "Petzl Boreo Helmet", brand: "Petzl", category: "Climbing", condition: "GOOD", quantity: 10 },
    { name: "Black Diamond Momentum Harness", brand: "Black Diamond", category: "Climbing", condition: "GOOD", quantity: 8 },
    { name: "Petzl GriGri+", brand: "Petzl", category: "Climbing", condition: "EXCELLENT", quantity: 6 },
    { name: "Black Diamond ATC-Guide", brand: "Black Diamond", category: "Climbing", condition: "GOOD", quantity: 6 },
    { name: "Mammut 9.5mm Crag Classic 60m", brand: "Mammut", category: "Climbing", condition: "GOOD", quantity: 4 },
    { name: "Black Diamond Camalot C4 Set", brand: "Black Diamond", category: "Climbing", condition: "EXCELLENT", quantity: 3 },
    { name: "Petzl Spirit Quickdraw (set of 6)", brand: "Petzl", category: "Climbing", condition: "GOOD", quantity: 5 },
    { name: "Ice Axe - Petzl Summit", brand: "Petzl", category: "Climbing", condition: "GOOD", quantity: 4 },
    { name: "Crampons - Petzl Vasak", brand: "Petzl", category: "Climbing", condition: "GOOD", quantity: 4 },
    { name: "Avalanche Transceiver", brand: "BCA", category: "Safety", condition: "GOOD", quantity: 3 },
  ];

  for (const gear of auracGear) {
    await prisma.gearItem.create({
      data: { ...gear, ownerClubId: aurac.id },
    });
  }

  // Create gear for AUCC
  const auccGear = [
    { name: "Prijon Seayak 520", brand: "Prijon", category: "Paddling", condition: "GOOD", quantity: 4 },
    { name: "Dagger Mamba 8.1", brand: "Dagger", category: "Paddling", condition: "GOOD", quantity: 3 },
    { name: "Werner Camano Paddle", brand: "Werner", category: "Paddling", condition: "GOOD", quantity: 6 },
    { name: "NRS cVest PFD", brand: "NRS", category: "Safety", condition: "GOOD", quantity: 8 },
    { name: "Sweet Protection Strutter Helmet", brand: "Sweet Protection", category: "Safety", condition: "GOOD", quantity: 6 },
    { name: "NRS HydroSkin Drysuit", brand: "NRS", category: "Clothing", condition: "FAIR", quantity: 4 },
  ];

  for (const gear of auccGear) {
    await prisma.gearItem.create({
      data: { ...gear, ownerClubId: aucc.id },
    });
  }

  // Set up cross-club visibility: share some AUTC tents with AURAC and vice versa
  const autcTents = await prisma.gearItem.findMany({
    where: { ownerClubId: autc.id, category: "Tents" },
  });
  for (const tent of autcTents) {
    await prisma.gearVisibility.create({
      data: { gearId: tent.id, clubId: aurac.id },
    });
  }

  const auracHelmets = await prisma.gearItem.findMany({
    where: { ownerClubId: aurac.id, name: { contains: "Helmet" } },
  });
  for (const helmet of auracHelmets) {
    await prisma.gearVisibility.create({
      data: { gearId: helmet.id, clubId: autc.id },
    });
  }

  console.log("Seed complete!");
  console.log(`  Clubs: ${autc.name}, ${aurac.name}, ${aucc.name}`);
  console.log(`  Admin: admin@example.com / admin123`);
  console.log(`  Member: member@example.com / member123`);
  console.log(`  Pending: pending@example.com / pending123`);
  console.log(`  AUTC gear: ${autcGear.length} items`);
  console.log(`  AURAC gear: ${auracGear.length} items`);
  console.log(`  AUCC gear: ${auccGear.length} items`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
