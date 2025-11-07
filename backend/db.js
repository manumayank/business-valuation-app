const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'valuation.db');
const db = new sqlite3.Database(dbPath);

// Initialize database schema
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err && err.code !== 'SQLITE_ERROR') console.error(err);
      });

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
  run,
  get,
  all
};
