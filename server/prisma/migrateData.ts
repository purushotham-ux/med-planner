import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Finding admin user...');
  let user = await prisma.user.findUnique({
    where: { email: 'admin@medrep.local' }
  });

  if (!user) {
    console.log('No admin user found. Creating one...');
    user = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@medrep.local',
        passwordHash: 'dummy' // They won't log in this way anymore if we remove it
      }
    });
  }

  const userId = user.id;
  console.log(`Using User ID: ${userId}`);

  console.log('Updating Areas...');
  await prisma.area.updateMany({ data: { userId } });

  console.log('Updating Beats...');
  await prisma.beat.updateMany({ data: { userId } });

  console.log('Updating Doctors...');
  await prisma.doctor.updateMany({ data: { userId } });

  console.log('Updating Chemists...');
  await prisma.chemist.updateMany({ data: { userId } });

  console.log('Updating Plans...');
  await prisma.plan.updateMany({ data: { userId } });

  console.log('Updating Visits...');
  await prisma.visit.updateMany({ data: { userId } });

  console.log('Migration completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
