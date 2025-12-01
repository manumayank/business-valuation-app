/**
 * Migration: Create organizations table
 *
 * Organizations represent teams/companies that use the platform.
 * Each user belongs to one or more organizations.
 */

exports.up = async (db, run, get, all) => {
  // Create organizations table
  await run(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      logo_url TEXT,
      website TEXT,
      subscription_tier TEXT DEFAULT 'free',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(owner_id) REFERENCES users(id)
    )
  `);
  console.log('  Created table: organizations');

  // Create index on owner_id for fast lookups
  try {
    await run('CREATE INDEX IF NOT EXISTS idx_org_owner ON organizations(owner_id)');
    console.log('  Created index: idx_org_owner');
  } catch (err) {
    console.log('  Index already exists: idx_org_owner');
  }

  // Create index on subscription_tier for filtering
  try {
    await run('CREATE INDEX IF NOT EXISTS idx_org_tier ON organizations(subscription_tier)');
    console.log('  Created index: idx_org_tier');
  } catch (err) {
    console.log('  Index already exists: idx_org_tier');
  }

  console.log('✓ Organizations table created');
};

exports.down = async (db, run, get, all) => {
  // Rollback: Drop table
  await run('DROP TABLE IF EXISTS organizations');
  console.log('✓ Organizations table dropped');
};
