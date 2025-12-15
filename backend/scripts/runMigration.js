/**
 * Run pending migrations
 * Usage: node scripts/runMigration.js
 */

const { runMigrations } = require('../db');

async function main() {
  console.log('Starting migration runner...\n');

  try {
    await runMigrations();
    console.log('\n✅ Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  }
}

main();
