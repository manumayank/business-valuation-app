/**
 * Migration: Create audit_logs and user_preferences tables
 *
 * Audit logs: Track all user actions for compliance and debugging
 * User preferences: Store user settings (theme, currency, notifications, etc.)
 */

exports.up = async (db, run, get, all) => {
  // Create audit_logs table
  await run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      organization_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      changes TEXT,
      ip_address TEXT,
      user_agent TEXT,
      status TEXT DEFAULT 'success',
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(organization_id) REFERENCES organizations(id)
    )
  `);
  console.log('  Created table: audit_logs');

  // Create indexes on audit_logs
  try {
    await run('CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id)');
    console.log('  Created index: idx_audit_user');
  } catch (err) {
    console.log('  Index already exists: idx_audit_user');
  }

  try {
    await run('CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_logs(organization_id)');
    console.log('  Created index: idx_audit_org');
  } catch (err) {
    console.log('  Index already exists: idx_audit_org');
  }

  try {
    await run('CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at)');
    console.log('  Created index: idx_audit_created');
  } catch (err) {
    console.log('  Index already exists: idx_audit_created');
  }

  // Create user_preferences table
  await run(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY,
      theme TEXT DEFAULT 'light',
      currency TEXT DEFAULT 'USD',
      date_format TEXT DEFAULT 'MM/DD/YYYY',
      notifications_enabled BOOLEAN DEFAULT 1,
      email_reports BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
  console.log('  Created table: user_preferences');

  console.log('✓ Audit logs and preferences tables created');
};

exports.down = async (db, run, get, all) => {
  // Rollback: Drop tables
  await run('DROP TABLE IF EXISTS audit_logs');
  await run('DROP TABLE IF EXISTS user_preferences');
  console.log('✓ Audit logs and preferences tables dropped');
};
