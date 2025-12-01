/**
 * Migration: Expand valuations table
 *
 * Adds organization, sharing, and status fields to support multi-user
 * valuations and shareable reports.
 */

exports.up = async (db, run, get, all) => {
  const columns = [
    {
      name: 'organization_id',
      sql: 'ALTER TABLE valuations ADD COLUMN organization_id TEXT'
    },
    {
      name: 'status',
      sql: 'ALTER TABLE valuations ADD COLUMN status TEXT DEFAULT \'draft\''
    },
    {
      name: 'shared_token',
      sql: 'ALTER TABLE valuations ADD COLUMN shared_token TEXT UNIQUE'
    },
    {
      name: 'shared_by',
      sql: 'ALTER TABLE valuations ADD COLUMN shared_by TEXT'
    },
    {
      name: 'shared_at',
      sql: 'ALTER TABLE valuations ADD COLUMN shared_at DATETIME'
    },
    {
      name: 'expires_at',
      sql: 'ALTER TABLE valuations ADD COLUMN expires_at DATETIME'
    }
  ];

  // Try to add each column
  for (const col of columns) {
    try {
      await run(col.sql);
      console.log(`  Added column: ${col.name}`);
    } catch (err) {
      if (err.message.includes('duplicate column') || err.message.includes('Cannot add a UNIQUE column')) {
        console.log(`  Column already exists: ${col.name}`);
      } else {
        throw err;
      }
    }
  }

  // Add foreign key constraint for organization_id (if not exists)
  try {
    await run('ALTER TABLE valuations ADD CONSTRAINT fk_val_org FOREIGN KEY(organization_id) REFERENCES organizations(id)');
    console.log('  Added foreign key: organization_id -> organizations');
  } catch (err) {
    console.log('  Foreign key already exists: fk_val_org');
  }

  // Create indexes
  try {
    await run('CREATE INDEX IF NOT EXISTS idx_val_org ON valuations(organization_id)');
    console.log('  Created index: idx_val_org');
  } catch (err) {
    console.log('  Index already exists: idx_val_org');
  }

  try {
    await run('CREATE INDEX IF NOT EXISTS idx_val_shared_token ON valuations(shared_token)');
    console.log('  Created index: idx_val_shared_token');
  } catch (err) {
    console.log('  Index already exists: idx_val_shared_token');
  }

  try {
    await run('CREATE INDEX IF NOT EXISTS idx_val_status ON valuations(status)');
    console.log('  Created index: idx_val_status');
  } catch (err) {
    console.log('  Index already exists: idx_val_status');
  }

  console.log('✓ Valuations table expanded');
};

exports.down = async (db, run, get, all) => {
  // Rollback: Drop added columns (SQLite limitation)
  // For MVP, we'll skip rollback
  console.log('Rollback not supported for this migration');
};
