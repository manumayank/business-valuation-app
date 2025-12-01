/**
 * Migration: Add Business Portal Features
 *
 * Adds:
 * - access_token to engagements for public business portal access
 * - advisor_id to engagements (if not exists)
 * - engagement_type to engagements
 * - industry, contact_email, contact_name to businesses
 * - engagement_reports table for generated reports
 * - Modifies questionnaire_responses to support JSON storage
 */

const crypto = require('crypto');

exports.up = async (db, run, get, all) => {
  console.log('🔨 Adding Business Portal features...\n');

  try {
    // ============================================
    // ENGAGEMENTS TABLE UPDATES
    // ============================================

    // Add access_token column (without UNIQUE constraint - SQLite limitation)
    console.log('  Adding access_token to engagements...');
    try {
      await run(`ALTER TABLE engagements ADD COLUMN access_token TEXT`);
      console.log('  ✓ access_token column added');
    } catch (err) {
      if (err.message.includes('duplicate column')) {
        console.log('  ⚠️  access_token column already exists');
      } else {
        console.log('  ⚠️  ' + err.message);
      }
    }

    // Create index for access_token
    try {
      await run('CREATE INDEX IF NOT EXISTS idx_engagements_access_token ON engagements(access_token)');
      console.log('  ✓ access_token index created');
    } catch (err) {
      console.log('  ⚠️  ' + err.message);
    }

    // Add advisor_id column (might be named assigned_advisor_id)
    console.log('  Checking advisor_id column...');
    try {
      await run(`ALTER TABLE engagements ADD COLUMN advisor_id TEXT REFERENCES users(id)`);
      console.log('  ✓ advisor_id column added');
    } catch (err) {
      if (err.message.includes('duplicate column')) {
        console.log('  ⚠️  advisor_id column already exists');
      } else {
        // Try to create alias/sync with assigned_advisor_id
        try {
          await run(`UPDATE engagements SET advisor_id = assigned_advisor_id WHERE advisor_id IS NULL`);
        } catch (e) {
          // Column might not exist either way
        }
      }
    }

    // Add engagement_type column
    console.log('  Adding engagement_type to engagements...');
    try {
      await run(`ALTER TABLE engagements ADD COLUMN engagement_type TEXT DEFAULT 'vac'`);
      console.log('  ✓ engagement_type column added');
    } catch (err) {
      if (err.message.includes('duplicate column')) {
        console.log('  ⚠️  engagement_type column already exists');
      } else {
        console.log('  ⚠️  ' + err.message);
      }
    }

    // Add questionnaire_completed_at column
    console.log('  Adding questionnaire_completed_at to engagements...');
    try {
      await run(`ALTER TABLE engagements ADD COLUMN questionnaire_completed_at DATETIME`);
      console.log('  ✓ questionnaire_completed_at column added');
    } catch (err) {
      if (err.message.includes('duplicate column')) {
        console.log('  ⚠️  questionnaire_completed_at column already exists');
      }
    }

    // Generate access tokens for existing engagements
    console.log('  Generating access tokens for existing engagements...');
    const engagements = await all('SELECT id FROM engagements WHERE access_token IS NULL');
    for (const eng of engagements) {
      const token = crypto.randomBytes(32).toString('hex');
      await run('UPDATE engagements SET access_token = ? WHERE id = ?', [token, eng.id]);
    }
    console.log(`  ✓ Generated tokens for ${engagements.length} engagements`);

    // ============================================
    // BUSINESSES TABLE UPDATES
    // ============================================

    console.log('  Adding columns to businesses...');

    try {
      await run(`ALTER TABLE businesses ADD COLUMN industry TEXT`);
      console.log('  ✓ industry column added');
    } catch (err) {
      if (!err.message.includes('duplicate column')) console.log('  ⚠️  ' + err.message);
    }

    try {
      await run(`ALTER TABLE businesses ADD COLUMN contact_email TEXT`);
      console.log('  ✓ contact_email column added');
    } catch (err) {
      if (!err.message.includes('duplicate column')) console.log('  ⚠️  ' + err.message);
    }

    try {
      await run(`ALTER TABLE businesses ADD COLUMN contact_name TEXT`);
      console.log('  ✓ contact_name column added');
    } catch (err) {
      if (!err.message.includes('duplicate column')) console.log('  ⚠️  ' + err.message);
    }

    try {
      await run(`ALTER TABLE businesses ADD COLUMN advisor_id TEXT REFERENCES users(id)`);
      await run('CREATE INDEX IF NOT EXISTS idx_businesses_advisor_id ON businesses(advisor_id)');
      console.log('  ✓ advisor_id column added to businesses');
    } catch (err) {
      if (!err.message.includes('duplicate column')) console.log('  ⚠️  ' + err.message);
    }

    // ============================================
    // QUESTIONNAIRE_RESPONSES TABLE UPDATE
    // ============================================

    console.log('  Adding responses JSON column to questionnaire_responses...');
    try {
      await run(`ALTER TABLE questionnaire_responses ADD COLUMN responses TEXT`);
      console.log('  ✓ responses column added');
    } catch (err) {
      if (!err.message.includes('duplicate column')) console.log('  ⚠️  ' + err.message);
    }

    // ============================================
    // ENGAGEMENT REPORTS TABLE
    // ============================================

    console.log('  Creating engagement_reports table...');
    try {
      await run(`
        CREATE TABLE IF NOT EXISTS engagement_reports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          engagement_id TEXT NOT NULL,
          report_type TEXT NOT NULL,
          title TEXT NOT NULL,
          file_path TEXT,
          generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          generated_by TEXT,
          is_shared_with_business BOOLEAN DEFAULT 0,
          share_token TEXT UNIQUE,
          FOREIGN KEY(engagement_id) REFERENCES engagements(id),
          FOREIGN KEY(generated_by) REFERENCES users(id)
        )
      `);
      await run('CREATE INDEX IF NOT EXISTS idx_engagement_reports_engagement ON engagement_reports(engagement_id)');
      await run('CREATE INDEX IF NOT EXISTS idx_engagement_reports_share ON engagement_reports(is_shared_with_business)');
      console.log('  ✓ engagement_reports table created');
    } catch (err) {
      console.log('  ⚠️  engagement_reports: ' + err.message);
    }

    // ============================================
    // USERS TABLE UPDATES (for admin)
    // ============================================

    console.log('  Adding role column to users...');
    try {
      await run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`);
      console.log('  ✓ role column added');
    } catch (err) {
      if (!err.message.includes('duplicate column')) console.log('  ⚠️  ' + err.message);
    }

    console.log('  Adding is_active column to users...');
    try {
      await run(`ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1`);
      console.log('  ✓ is_active column added');
    } catch (err) {
      if (!err.message.includes('duplicate column')) console.log('  ⚠️  ' + err.message);
    }

    // ============================================
    // ADD DETAILS COLUMN TO AUDIT_LOGS
    // ============================================

    console.log('  Adding details column to audit_logs...');
    try {
      await run(`ALTER TABLE audit_logs ADD COLUMN details TEXT`);
      console.log('  ✓ details column added to audit_logs');
    } catch (err) {
      if (!err.message.includes('duplicate column')) console.log('  ⚠️  ' + err.message);
    }

    // ============================================
    // DOCUMENTS TABLE UPDATES
    // ============================================

    console.log('  Adding category column to documents...');
    try {
      await run(`ALTER TABLE documents ADD COLUMN category TEXT`);
      console.log('  ✓ category column added');
    } catch (err) {
      if (!err.message.includes('duplicate column')) console.log('  ⚠️  ' + err.message);
    }

    try {
      await run(`ALTER TABLE documents ADD COLUMN uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
      console.log('  ✓ uploaded_at column added');
    } catch (err) {
      if (!err.message.includes('duplicate column')) console.log('  ⚠️  ' + err.message);
    }

    console.log('\n✅ Business Portal features added successfully!\n');

  } catch (err) {
    console.error('❌ ERROR adding Business Portal features:', err.message);
    throw err;
  }
};

exports.down = async (db, run, get, all) => {
  console.log('⬇️  Rolling back Business Portal features...');

  try {
    await run('DROP TABLE IF EXISTS engagement_reports');
    console.log('  ✓ Dropped engagement_reports table');
  } catch (err) {
    console.log('  ⚠️  ' + err.message);
  }

  // Note: SQLite doesn't support DROP COLUMN, so we can't easily rollback column additions

  console.log('✅ Rollback complete');
};
