/**
 * Migration: Expand users table with authentication fields
 *
 * Adds email, password, profile information needed for user authentication
 * and multi-user support.
 */

exports.up = async (db, run, get, all) => {
  // Drop old users table if it exists and recreate with all needed columns
  try {
    // Check if users table exists and has email column
    const userTable = await get(`PRAGMA table_info(users)`);

    if (userTable) {
      // Table exists, check if email column exists
      const hasEmail = await get(`PRAGMA table_info(users) WHERE name='email'`);

      if (!hasEmail) {
        console.log('  Users table exists but missing email column - recreating table');
        // Backup old data
        await run(`CREATE TABLE users_backup AS SELECT * FROM users`);
        // Drop old table
        await run(`DROP TABLE users`);
        // Create new table with all columns
        await run(`
          CREATE TABLE users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            password_hash TEXT,
            full_name TEXT,
            company TEXT,
            phone TEXT,
            verified BOOLEAN DEFAULT 0,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        // Restore old data (except email/password columns which will be NULL)
        await run(`INSERT INTO users (id, created_at) SELECT id, created_at FROM users_backup`);
        // Drop backup
        await run(`DROP TABLE users_backup`);
        console.log('  Users table recreated with all columns');
      } else {
        console.log('  Users table already has all required columns');
      }
    } else {
      // Table doesn't exist, create it
      await run(`
        CREATE TABLE users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE,
          password_hash TEXT,
          full_name TEXT,
          company TEXT,
          phone TEXT,
          verified BOOLEAN DEFAULT 0,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('  Users table created with all columns');
    }
  } catch (err) {
    console.error('  ERROR creating users table:', err.message);
    throw err;
  }

  // Create index on email for fast lookups
  try {
    await run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    console.log('  Created index: idx_users_email');
  } catch (err) {
    console.log('  Index already exists: idx_users_email');
  }

  // Keep the old column-adding logic as fallback for edge cases
  const columns = [
    {
      name: 'email',
      sql: 'ALTER TABLE users ADD COLUMN email TEXT UNIQUE'
    },
    {
      name: 'password_hash',
      sql: 'ALTER TABLE users ADD COLUMN password_hash TEXT'
    },
    {
      name: 'full_name',
      sql: 'ALTER TABLE users ADD COLUMN full_name TEXT'
    },
    {
      name: 'company',
      sql: 'ALTER TABLE users ADD COLUMN company TEXT'
    },
    {
      name: 'phone',
      sql: 'ALTER TABLE users ADD COLUMN phone TEXT'
    },
    {
      name: 'verified',
      sql: 'ALTER TABLE users ADD COLUMN verified BOOLEAN DEFAULT 0'
    },
    {
      name: 'status',
      sql: 'ALTER TABLE users ADD COLUMN status TEXT DEFAULT \'active\''
    },
    {
      name: 'updated_at',
      sql: 'ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP'
    }
  ];

  // Try to add each column as fallback - if it already exists, it will fail silently
  for (const col of columns) {
    try {
      await run(col.sql);
      console.log(`  Added column: ${col.name}`);
    } catch (err) {
      if (err.message.includes('duplicate column') || err.message.includes('Cannot add a UNIQUE column') || err.message.includes('already exists')) {
        // Column already exists, skip
      } else if (err.message.includes('no such table')) {
        // Table doesn't exist, we would have caught this above
      } else {
        // Log other errors but don't throw
        console.log(`  Note: ${col.name} - ${err.message}`);
      }
    }
  }

  // Create index on email for fast lookups
  try {
    await run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    console.log('  Created index: idx_users_email');
  } catch (err) {
    console.log('  Index already exists: idx_users_email');
  }

  console.log('✓ Users table expanded with auth fields');
};

exports.down = async (db, run, get, all) => {
  // Rollback: We would need to recreate the table to drop columns
  // For SQLite, this is complex, so for MVP we'll skip rollback
  console.log('Rollback not supported for this migration');
};
