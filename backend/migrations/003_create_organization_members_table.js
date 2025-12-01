/**
 * Migration: Create organization_members table
 *
 * Links users to organizations with role-based access control (RBAC).
 * Roles: owner, admin, editor, viewer
 */

exports.up = async (db, run, get, all) => {
  // Create organization_members table
  await run(`
    CREATE TABLE IF NOT EXISTS organization_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'viewer',
      status TEXT DEFAULT 'active',
      invited_by TEXT,
      invited_at DATETIME,
      accepted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(organization_id, user_id),
      FOREIGN KEY(organization_id) REFERENCES organizations(id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(invited_by) REFERENCES users(id)
    )
  `);
  console.log('  Created table: organization_members');

  // Create indexes for fast queries
  try {
    await run('CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id)');
    console.log('  Created index: idx_org_members_org');
  } catch (err) {
    console.log('  Index already exists: idx_org_members_org');
  }

  try {
    await run('CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id)');
    console.log('  Created index: idx_org_members_user');
  } catch (err) {
    console.log('  Index already exists: idx_org_members_user');
  }

  try {
    await run('CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role)');
    console.log('  Created index: idx_org_members_role');
  } catch (err) {
    console.log('  Index already exists: idx_org_members_role');
  }

  console.log('✓ Organization members table created');
};

exports.down = async (db, run, get, all) => {
  // Rollback: Drop table
  await run('DROP TABLE IF EXISTS organization_members');
  console.log('✓ Organization members table dropped');
};
