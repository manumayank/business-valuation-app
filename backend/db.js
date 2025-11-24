const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Use DATABASE_PATH environment variable or default to local file
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'valuation.db');

// Ensure the directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Migration tracking table
const migrations = [];

// Initialize database schema (legacy - kept for backward compatibility)
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Note: Users table is created and managed by migrations
      // Skip creating it here to avoid conflicts with migration 001

      // Valuations table
      db.run(`
        CREATE TABLE IF NOT EXISTS valuations (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          input_data TEXT NOT NULL,
          valuation_result TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err && err.code !== 'SQLITE_ERROR') console.error(err);
      });

      // Completed improvements table
      db.run(`
        CREATE TABLE IF NOT EXISTS completed_improvements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          valuation_id TEXT NOT NULL,
          improvement_key TEXT NOT NULL,
          completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(valuation_id, improvement_key),
          FOREIGN KEY(valuation_id) REFERENCES valuations(id)
        )
      `, (err) => {
        if (err && err.code !== 'SQLITE_ERROR') console.error(err);
        resolve();
      });
    });
  });
}

// Create migrations table for tracking applied migrations
function initMigrations() {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Run pending migrations
async function runMigrations() {
  try {
    await initMigrations();

    // Get list of migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
      console.log('Migrations directory created');
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js'))
      .sort();

    for (const file of files) {
      const migrationName = path.basename(file, '.js');

      // Check if migration already applied
      const exists = await get('SELECT * FROM migrations WHERE name = ?', [migrationName]);

      if (!exists) {
        console.log(`Running migration: ${migrationName}`);
        const migration = require(path.join(migrationsDir, file));
        await migration.up(db, run, get, all);
        await run('INSERT INTO migrations (name) VALUES (?)', [migrationName]);
        console.log(`✓ Migration completed: ${migrationName}`);
      }
    }

    console.log('All migrations completed');
  } catch (err) {
    console.error('Migration error:', err);
    throw err;
  }
}

// Database helper methods
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = {
  db,
  initializeDatabase,
  initMigrations,
  runMigrations,
  run,
  get,
  all
};
