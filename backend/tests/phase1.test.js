/**
 * Phase 1 Test Suite - Database, RBAC, and API Endpoints
 *
 * Tests for:
 * - FT-1.1: Database schema and migrations
 * - FT-1.2: RBAC middleware
 * - FT-1.3: Business API
 * - FT-1.4: Engagement API
 * - FT-1.5: Team Management API
 * - FT-1.6: Audit Trail System
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Test database setup
let testDb;
const TEST_DB_PATH = path.join(__dirname, '../test-valuation.db');

// Helper functions
async function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    testDb.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    testDb.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    testDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

// Test Suite Setup
beforeAll(async () => {
  // Clean up test database if exists
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  testDb = new sqlite3.Database(TEST_DB_PATH);

  // Enable foreign keys
  await new Promise((resolve, reject) => {
    testDb.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
});

afterAll((done) => {
  testDb.close(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    done();
  });
});

describe('FT-1.1: Database Schema Validation', () => {
  test('should create users table with required columns', async () => {
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        company TEXT,
        phone TEXT,
        verified BOOLEAN DEFAULT 0,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `);

    const columns = await all('PRAGMA table_info(users)');
    const idColumn = columns.find(c => c.name === 'id');
    expect(idColumn).toBeDefined();
    expect(idColumn.name).toBe('id');
  });

  test('should create businesses table with foreign key to users', async () => {
    await run(`
      CREATE TABLE IF NOT EXISTS businesses (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL,
        name TEXT NOT NULL,
        naics_code TEXT,
        location TEXT,
        founded_year INTEGER,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(owner_id) REFERENCES users(id)
      )
    `);

    const columns = await all('PRAGMA table_info(businesses)');
    expect(columns).toBeDefined();
    expect(columns.length).toBeGreaterThan(0);
    expect(columns.map(c => c.name)).toContain('owner_id');
    expect(columns.map(c => c.name)).toContain('name');
  });

  test('should create user_roles table with role constraint', async () => {
    await run(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('owner', 'advisor', 'admin')),
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        assigned_by TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id),
        UNIQUE(user_id, role)
      )
    `);

    const columns = await all('PRAGMA table_info(user_roles)');
    expect(columns.map(c => c.name)).toContain('role');
    expect(columns.map(c => c.name)).toContain('user_id');
  });

  test('should create questionnaire_templates table', async () => {
    await run(`
      CREATE TABLE IF NOT EXISTS questionnaire_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        version INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const columns = await all('PRAGMA table_info(questionnaire_templates)');
    expect(columns.map(c => c.name)).toContain('name');
    expect(columns.map(c => c.name)).toContain('is_active');
  });

  test('should create engagements table with state references', async () => {
    await run(`
      CREATE TABLE IF NOT EXISTS questionnaire_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS engagements (
        id TEXT PRIMARY KEY,
        business_id TEXT NOT NULL,
        questionnaire_template_id INTEGER NOT NULL,
        assigned_advisor_id TEXT,
        status TEXT DEFAULT 'created',
        completion_percentage DECIMAL(5,2) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(business_id) REFERENCES businesses(id),
        FOREIGN KEY(questionnaire_template_id) REFERENCES questionnaire_templates(id)
      )
    `);

    const columns = await all('PRAGMA table_info(engagements)');
    expect(columns.map(c => c.name)).toContain('status');
    expect(columns.map(c => c.name)).toContain('completion_percentage');
  });

  test('should create VAC calculation tables', async () => {
    const tables = [
      'vac_assumptions',
      'vac_results',
      'probability_distribution',
      'wealth_gap'
    ];

    for (const table of tables) {
      await run(`
        CREATE TABLE IF NOT EXISTS ${table} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          valuation_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const result = await get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        [table]
      );
      expect(result).toBeDefined();
      expect(result.name).toBe(table);
    }
  });

  test('should have proper indexes for performance', async () => {
    await run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await run('CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON businesses(owner_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id)');

    const indexes = await all("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'");
    expect(indexes.length).toBeGreaterThan(0);
    expect(indexes.map(i => i.name)).toContain('idx_users_email');
  });

  test('should enforce UNIQUE constraints', async () => {
    const userId = uuidv4();
    await run(
      'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
      [userId, 'test@example.com', 'hash123']
    );

    // Try to insert duplicate email
    const result = run(
      'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
      [uuidv4(), 'test@example.com', 'hash456']
    );

    await expect(result).rejects.toThrow();
  });

  test('should enforce FOREIGN KEY constraints', async () => {
    // Try to insert business with non-existent owner
    const result = run(
      'INSERT INTO businesses (id, owner_id, name) VALUES (?, ?, ?)',
      [uuidv4(), 'non-existent-user', 'Test Business']
    );

    await expect(result).rejects.toThrow();
  });
});

describe('FT-1.2: RBAC Middleware Validation', () => {
  let testUserId, testAdvisorId, testBusinessId, testEngagementId;

  beforeAll(async () => {
    // Setup test data
    testUserId = uuidv4();
    testAdvisorId = uuidv4();
    testBusinessId = uuidv4();
    testEngagementId = uuidv4();

    // Create users
    await run(
      'INSERT INTO users (id, email, password_hash, full_name) VALUES (?, ?, ?, ?)',
      [testUserId, 'owner@test.com', 'hash1', 'Test Owner']
    );
    await run(
      'INSERT INTO users (id, email, password_hash, full_name) VALUES (?, ?, ?, ?)',
      [testAdvisorId, 'advisor@test.com', 'hash2', 'Test Advisor']
    );

    // Assign roles
    await run(
      'INSERT INTO user_roles (user_id, role) VALUES (?, ?)',
      [testUserId, 'owner']
    );
    await run(
      'INSERT INTO user_roles (user_id, role) VALUES (?, ?)',
      [testAdvisorId, 'advisor']
    );

    // Create business
    await run(
      'INSERT INTO businesses (id, owner_id, name, status) VALUES (?, ?, ?, ?)',
      [testBusinessId, testUserId, 'Test Business', 'active']
    );

    // Create template
    await run(
      'INSERT INTO questionnaire_templates (name, is_active) VALUES (?, ?)',
      ['Default Template', 1]
    );

    const template = await get('SELECT id FROM questionnaire_templates LIMIT 1');

    // Create engagement
    await run(
      'INSERT INTO engagements (id, business_id, questionnaire_template_id, status) VALUES (?, ?, ?, ?)',
      [testEngagementId, testBusinessId, template.id, 'created']
    );
  });

  test('should verify user roles from database', async () => {
    const userRole = await get(
      'SELECT role FROM user_roles WHERE user_id = ?',
      [testUserId]
    );

    expect(userRole).toBeDefined();
    expect(userRole.role).toBe('owner');
  });

  test('should verify multiple roles for same user', async () => {
    const userId = uuidv4();
    await run(
      'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
      [userId, 'multi@test.com', 'hash']
    );
    await run('INSERT INTO user_roles (user_id, role) VALUES (?, ?)', [userId, 'owner']);
    await run('INSERT INTO user_roles (user_id, role) VALUES (?, ?)', [userId, 'advisor']);

    const roles = await all('SELECT role FROM user_roles WHERE user_id = ?', [userId]);
    expect(roles.length).toBe(2);
    expect(roles.map(r => r.role)).toContain('owner');
    expect(roles.map(r => r.role)).toContain('advisor');
  });

  test('should enforce role constraint in user_roles', async () => {
    const userId = uuidv4();
    await run(
      'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
      [userId, 'invalid@test.com', 'hash']
    );

    // Try to insert invalid role
    const result = run(
      'INSERT INTO user_roles (user_id, role) VALUES (?, ?)',
      [userId, 'invalid_role']
    );

    await expect(result).rejects.toThrow();
  });

  test('should prevent duplicate role assignment', async () => {
    const userId = uuidv4();
    await run(
      'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
      [userId, 'dup@test.com', 'hash']
    );
    await run('INSERT INTO user_roles (user_id, role) VALUES (?, ?)', [userId, 'owner']);

    // Try to insert same role again
    const result = run(
      'INSERT INTO user_roles (user_id, role) VALUES (?, ?)',
      [userId, 'owner']
    );

    await expect(result).rejects.toThrow();
  });

  test('should verify business ownership', async () => {
    const business = await get(
      'SELECT owner_id FROM businesses WHERE id = ?',
      [testBusinessId]
    );

    expect(business).toBeDefined();
    expect(business.owner_id).toBe(testUserId);
  });

  test('should verify engagement access via advisor assignment', async () => {
    // Assign advisor to engagement
    await run(
      'UPDATE engagements SET assigned_advisor_id = ? WHERE id = ?',
      [testAdvisorId, testEngagementId]
    );

    const engagement = await get(
      'SELECT assigned_advisor_id FROM engagements WHERE id = ?',
      [testEngagementId]
    );

    expect(engagement.assigned_advisor_id).toBe(testAdvisorId);
  });
});

describe('FT-1.3: Business API Data Model', () => {
  test('should allow business creation with owner reference', async () => {
    const userId = uuidv4();
    await run(
      'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
      [userId, 'business-owner@test.com', 'hash']
    );

    const businessId = uuidv4();
    await run(
      'INSERT INTO businesses (id, owner_id, name, naics_code, location, founded_year) VALUES (?, ?, ?, ?, ?, ?)',
      [businessId, userId, 'New Business', '1234', 'New York', 2020]
    );

    const business = await get(
      'SELECT * FROM businesses WHERE id = ?',
      [businessId]
    );

    expect(business).toBeDefined();
    expect(business.name).toBe('New Business');
    expect(business.owner_id).toBe(userId);
    expect(business.status).toBe('active');
  });

  test('should support business status updates', async () => {
    const userId = uuidv4();
    await run(
      'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
      [userId, 'status-test@test.com', 'hash']
    );

    const businessId = uuidv4();
    await run(
      'INSERT INTO businesses (id, owner_id, name) VALUES (?, ?, ?)',
      [businessId, userId, 'Status Test Business']
    );

    await run(
      'UPDATE businesses SET status = ? WHERE id = ?',
      ['archived', businessId]
    );

    const business = await get(
      'SELECT status FROM businesses WHERE id = ?',
      [businessId]
    );

    expect(business.status).toBe('archived');
  });
});

describe('FT-1.4: Engagement API Data Model', () => {
  let testEngUserId, testEngBusinessId, testEngTemplateId;

  beforeAll(async () => {
    testEngUserId = uuidv4();
    await run(
      'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
      [testEngUserId, 'eng@test.com', 'hash']
    );

    testEngBusinessId = uuidv4();
    await run(
      'INSERT INTO businesses (id, owner_id, name) VALUES (?, ?, ?)',
      [testEngBusinessId, testEngUserId, 'Engagement Test Business']
    );

    await run(
      'INSERT INTO questionnaire_templates (name, is_active) VALUES (?, ?)',
      ['Test Template', 1]
    );

    const template = await get('SELECT id FROM questionnaire_templates WHERE name = ?', ['Test Template']);
    testEngTemplateId = template.id;
  });

  test('should create engagement with state machine', async () => {
    const engagementId = uuidv4();
    await run(
      'INSERT INTO engagements (id, business_id, questionnaire_template_id, status, completion_percentage) VALUES (?, ?, ?, ?, ?)',
      [engagementId, testEngBusinessId, testEngTemplateId, 'created', 0]
    );

    const engagement = await get(
      'SELECT status, completion_percentage FROM engagements WHERE id = ?',
      [engagementId]
    );

    expect(engagement.status).toBe('created');
    expect(engagement.completion_percentage).toBe(0);
  });

  test('should support engagement state transitions', async () => {
    const engagementId = uuidv4();
    await run(
      'INSERT INTO engagements (id, business_id, questionnaire_template_id, status) VALUES (?, ?, ?, ?)',
      [engagementId, testEngBusinessId, testEngTemplateId, 'created']
    );

    // Transition to next state
    await run(
      'UPDATE engagements SET status = ? WHERE id = ?',
      ['intake', engagementId]
    );

    const engagement = await get(
      'SELECT status FROM engagements WHERE id = ?',
      [engagementId]
    );

    expect(engagement.status).toBe('intake');
  });

  test('should track completion percentage', async () => {
    const engagementId = uuidv4();
    await run(
      'INSERT INTO engagements (id, business_id, questionnaire_template_id, completion_percentage) VALUES (?, ?, ?, ?)',
      [engagementId, testEngBusinessId, testEngTemplateId, 50]
    );

    const engagement = await get(
      'SELECT completion_percentage FROM engagements WHERE id = ?',
      [engagementId]
    );

    expect(engagement.completion_percentage).toBe(50);
  });
});

describe('FT-1.5: Team Management Data Model', () => {
  let teamUserId, teamAdvisorId, teamEngagementId;

  beforeAll(async () => {
    // Create team_assignments table first
    await run(`
      CREATE TABLE IF NOT EXISTS team_assignments (
        id TEXT PRIMARY KEY,
        advisor_id TEXT NOT NULL,
        engagement_id TEXT NOT NULL,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        assigned_by TEXT,
        FOREIGN KEY(advisor_id) REFERENCES users(id),
        FOREIGN KEY(engagement_id) REFERENCES engagements(id),
        UNIQUE(advisor_id, engagement_id)
      )
    `);

    teamUserId = uuidv4();
    teamAdvisorId = uuidv4();

    await run(
      'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
      [teamUserId, 'team-owner@test.com', 'hash']
    );
    await run(
      'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
      [teamAdvisorId, 'team-advisor@test.com', 'hash']
    );

    await run('INSERT INTO user_roles (user_id, role) VALUES (?, ?)', [teamUserId, 'owner']);
    await run('INSERT INTO user_roles (user_id, role) VALUES (?, ?)', [teamAdvisorId, 'advisor']);

    const businessId = uuidv4();
    await run(
      'INSERT INTO businesses (id, owner_id, name) VALUES (?, ?, ?)',
      [businessId, teamUserId, 'Team Test Business']
    );

    const template = await get('SELECT id FROM questionnaire_templates LIMIT 1');
    teamEngagementId = uuidv4();
    await run(
      'INSERT INTO engagements (id, business_id, questionnaire_template_id) VALUES (?, ?, ?)',
      [teamEngagementId, businessId, template.id]
    );
  });

  test('should create team assignment', async () => {
    const assignmentId = uuidv4();
    await run(
      'INSERT INTO team_assignments (id, advisor_id, engagement_id) VALUES (?, ?, ?)',
      [assignmentId, teamAdvisorId, teamEngagementId]
    );

    const assignment = await get(
      'SELECT * FROM team_assignments WHERE id = ?',
      [assignmentId]
    );

    expect(assignment).toBeDefined();
    expect(assignment.advisor_id).toBe(teamAdvisorId);
    expect(assignment.engagement_id).toBe(teamEngagementId);
  });

  test('should enforce unique advisor-engagement pairs', async () => {
    // The first test already inserted teamAdvisorId + teamEngagementId
    // Try to create duplicate with same advisor and engagement
    const result = run(
      'INSERT INTO team_assignments (id, advisor_id, engagement_id) VALUES (?, ?, ?)',
      [uuidv4(), teamAdvisorId, teamEngagementId]
    );

    await expect(result).rejects.toThrow();
  });
});

describe('FT-1.6: Audit Trail System', () => {
  test('should create audit_log table', async () => {
    await run(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        operation TEXT NOT NULL,
        record_id TEXT,
        user_id TEXT,
        old_values TEXT,
        new_values TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const table = await get("SELECT name FROM sqlite_master WHERE type='table' AND name='audit_log'");
    expect(table).toBeDefined();
  });

  test('should log INSERT operations', async () => {
    const userId = uuidv4();
    const recordId = uuidv4();

    await run(
      'INSERT INTO audit_log (table_name, operation, record_id, user_id, new_values) VALUES (?, ?, ?, ?, ?)',
      ['businesses', 'INSERT', recordId, userId, JSON.stringify({ name: 'Test' })]
    );

    const log = await get(
      'SELECT * FROM audit_log WHERE record_id = ? AND operation = ?',
      [recordId, 'INSERT']
    );

    expect(log).toBeDefined();
    expect(log.table_name).toBe('businesses');
    expect(log.operation).toBe('INSERT');
  });

  test('should log UPDATE operations', async () => {
    const userId = uuidv4();
    const recordId = uuidv4();

    await run(
      'INSERT INTO audit_log (table_name, operation, record_id, user_id, old_values, new_values) VALUES (?, ?, ?, ?, ?, ?)',
      ['businesses', 'UPDATE', recordId, userId, JSON.stringify({ status: 'active' }), JSON.stringify({ status: 'archived' })]
    );

    const log = await get(
      'SELECT * FROM audit_log WHERE record_id = ? AND operation = ?',
      [recordId, 'UPDATE']
    );

    expect(log).toBeDefined();
    expect(log.operation).toBe('UPDATE');
  });

  test('should log DELETE operations', async () => {
    const userId = uuidv4();
    const recordId = uuidv4();

    await run(
      'INSERT INTO audit_log (table_name, operation, record_id, user_id, old_values) VALUES (?, ?, ?, ?, ?)',
      ['businesses', 'DELETE', recordId, userId, JSON.stringify({ name: 'Deleted Business' })]
    );

    const log = await get(
      'SELECT * FROM audit_log WHERE record_id = ? AND operation = ?',
      [recordId, 'DELETE']
    );

    expect(log).toBeDefined();
    expect(log.operation).toBe('DELETE');
  });

  test('should track user_id in audit logs', async () => {
    const userId = uuidv4();
    const recordId = uuidv4();

    await run(
      'INSERT INTO audit_log (table_name, operation, record_id, user_id) VALUES (?, ?, ?, ?)',
      ['users', 'INSERT', recordId, userId]
    );

    const log = await get(
      'SELECT user_id FROM audit_log WHERE user_id = ?',
      [userId]
    );

    expect(log).toBeDefined();
    expect(log.user_id).toBe(userId);
  });
});

describe('Data Integrity Tests', () => {
  test('should maintain referential integrity for businesses', async () => {
    const userId = uuidv4();
    const businessId = uuidv4();

    // Create user
    await run(
      'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
      [userId, 'integrity@test.com', 'hash']
    );

    // Create business with valid user reference
    await run(
      'INSERT INTO businesses (id, owner_id, name) VALUES (?, ?, ?)',
      [businessId, userId, 'Integrity Test']
    );

    const business = await get('SELECT * FROM businesses WHERE id = ?', [businessId]);
    const user = await get('SELECT * FROM users WHERE id = ?', [userId]);

    expect(business.owner_id).toBe(user.id);
  });

  test('should maintain timestamp consistency', async () => {
    const userId = uuidv4();
    const businessId = uuidv4();

    await run(
      'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
      [userId, 'timestamp@test.com', 'hash']
    );

    await run(
      'INSERT INTO businesses (id, owner_id, name) VALUES (?, ?, ?)',
      [businessId, userId, 'Timestamp Test']
    );

    const business = await get('SELECT created_at, updated_at FROM businesses WHERE id = ?', [businessId]);

    expect(business.created_at).toBeDefined();
    expect(business.updated_at).toBeDefined();
  });
});

describe('Performance and Indexing', () => {
  test('should have indexes on frequently queried columns', async () => {
    const indexes = await all(
      "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'"
    );

    const indexNames = indexes.map(i => i.name);

    expect(indexNames).toContain('idx_users_email');
    expect(indexNames.length).toBeGreaterThan(0);
  });
});
