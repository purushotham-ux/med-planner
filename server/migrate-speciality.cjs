const { PrismaClient } = require('./node_modules/@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Converting speciality column from enum to text...');
  
  // Step 1: Convert the enum column to text, preserving existing data
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Doctor" 
    ALTER COLUMN "speciality" TYPE TEXT 
    USING "speciality"::TEXT;
  `);
  console.log('✓ Column converted to TEXT');
  
  // Step 2: Set default value
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Doctor" 
    ALTER COLUMN "speciality" SET DEFAULT 'General Physician';
  `);
  console.log('✓ Default set to "General Physician"');
  
  // Step 3: Drop the old enum type if it exists
  await prisma.$executeRawUnsafe(`
    DROP TYPE IF EXISTS "Speciality" CASCADE;
  `);
  console.log('✓ Old enum type dropped');
  
  // Step 4: Verify — show distinct speciality values
  const result = await prisma.$queryRawUnsafe(`
    SELECT DISTINCT "speciality", COUNT(*) as count 
    FROM "Doctor" 
    GROUP BY "speciality" 
    ORDER BY count DESC;
  `);
  console.log('\\nCurrent speciality values in database:');
  for (const row of result) {
    console.log(`  ${row.speciality}: ${row.count} doctors`);
  }
  
  console.log('\\n✅ Migration complete! Speciality is now a free-form string.');
}

main()
  .catch(e => { console.error('Migration failed:', e); process.exit(1); })
  .then(() => process.exit(0));
