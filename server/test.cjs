const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const doctors = await prisma.doctor.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { area: true }
  });
  console.log(JSON.stringify(doctors, null, 2));
}
main().then(() => process.exit(0));
