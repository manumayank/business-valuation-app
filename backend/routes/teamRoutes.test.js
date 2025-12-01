/**
 * Integration Tests for Team Management Routes
 * Tests advisor assignment and team operations
 */

const express = require('express');
const request = require('supertest');
const teamRoutes = require('./teamRoutes');

// Mock the database
jest.mock('../db', () => ({
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn()
}));

// Mock auth middleware
jest.mock('../middleware/authMiddleware', () => ({
  requireAuth: (req, res, next) => {
    req.user = { userId: 'user-123', email: 'test@example.com' };
    next();
  },
  requireRole: (role) => (req, res, next) => {
    if (req.headers['x-no-admin']) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `This action requires one of these roles: ${role}`
      });
    }
    req.userRole = role;
    next();
  }
}));

const db = require('../db');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.db = { run: db.run, get: db.get, all: db.all };
    next();
  });
  app.use('/api/team', teamRoutes);
  return app;
};

describe('Team Routes', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('POST /api/team/assign-advisor', () => {
    test('should assign advisor to engagement', async () => {
      db.get
        .mockResolvedValueOnce({ id: 'eng-123', business_id: 'biz-123' }) // engagement exists
        .mockResolvedValueOnce({ id: 'advisor-123' }); // advisor exists
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/team/assign-advisor')
        .send({ engagementId: 'eng-123', advisorId: 'advisor-123' });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Advisor assigned successfully');
      expect(response.body.assignment).toBeDefined();
      expect(response.body.assignment.advisorId).toBe('advisor-123');
      expect(response.body.assignment.engagementId).toBe('eng-123');
    });

    test('should reject missing engagement ID', async () => {
      const app = createTestApp();

      const response = await request(app)
        .post('/api/team/assign-advisor')
        .send({ advisorId: 'advisor-123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    test('should reject missing advisor ID', async () => {
      const app = createTestApp();

      const response = await request(app)
        .post('/api/team/assign-advisor')
        .send({ engagementId: 'eng-123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    test('should return 403 for unauthorized engagement', async () => {
      db.get.mockResolvedValue(null); // No access to engagement
      const app = createTestApp();

      const response = await request(app)
        .post('/api/team/assign-advisor')
        .send({ engagementId: 'eng-123', advisorId: 'advisor-123' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
    });

    test('should return 400 for invalid advisor', async () => {
      db.get
        .mockResolvedValueOnce({ id: 'eng-123' }) // engagement exists
        .mockResolvedValueOnce(null); // advisor not found
      const app = createTestApp();

      const response = await request(app)
        .post('/api/team/assign-advisor')
        .send({ engagementId: 'eng-123', advisorId: 'invalid-advisor' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid advisor');
    });

    test('should handle database error', async () => {
      db.get.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .post('/api/team/assign-advisor')
        .send({ engagementId: 'eng-123', advisorId: 'advisor-123' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to assign advisor');
    });
  });

  describe('GET /api/team/advisors', () => {
    test('should list all advisors', async () => {
      db.all.mockResolvedValue([
        { id: 'adv-1', email: 'advisor1@test.com', full_name: 'John Advisor', company: 'Firm A', role: 'advisor' },
        { id: 'adv-2', email: 'advisor2@test.com', full_name: 'Jane Admin', company: 'Firm B', role: 'admin' }
      ]);
      const app = createTestApp();

      const response = await request(app)
        .get('/api/team/advisors');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(2);
      expect(response.body.advisors).toHaveLength(2);
      expect(response.body.advisors[0].fullName).toBe('John Advisor');
    });

    test('should return empty list when no advisors', async () => {
      db.all.mockResolvedValue([]);
      const app = createTestApp();

      const response = await request(app)
        .get('/api/team/advisors');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
      expect(response.body.advisors).toHaveLength(0);
    });

    test('should handle database error', async () => {
      db.all.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .get('/api/team/advisors');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to retrieve advisors');
    });
  });

  describe('GET /api/team/users/:userId', () => {
    test('should get user profile with roles', async () => {
      db.get.mockResolvedValue({
        id: 'user-123',
        email: 'user@test.com',
        full_name: 'Test User',
        company: 'Test Corp',
        phone: '555-1234',
        verified: 1,
        status: 'active',
        created_at: '2024-01-01'
      });
      db.all.mockResolvedValue([
        { role: 'owner', assigned_at: '2024-01-01' },
        { role: 'advisor', assigned_at: '2024-01-15' }
      ]);
      const app = createTestApp();

      const response = await request(app)
        .get('/api/team/users/user-123');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('user-123');
      expect(response.body.fullName).toBe('Test User');
      expect(response.body.roles).toHaveLength(2);
    });

    test('should return 404 for non-existent user', async () => {
      db.get.mockResolvedValue(null);
      const app = createTestApp();

      const response = await request(app)
        .get('/api/team/users/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    test('should handle database error', async () => {
      db.get.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .get('/api/team/users/user-123');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to retrieve user');
    });
  });

  describe('PUT /api/team/users/:userId/role', () => {
    test('should assign role to user', async () => {
      db.get
        .mockResolvedValueOnce({ id: 'user-123' }) // user exists
        .mockResolvedValueOnce(null); // role not assigned yet
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const response = await request(app)
        .put('/api/team/users/user-123/role')
        .send({ role: 'advisor' });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('assigned successfully');
      expect(response.body.role).toBe('advisor');
    });

    test('should reject invalid role', async () => {
      const app = createTestApp();

      const response = await request(app)
        .put('/api/team/users/user-123/role')
        .send({ role: 'invalid_role' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid role');
      expect(response.body.validRoles).toBeDefined();
    });

    test('should reject missing role', async () => {
      const app = createTestApp();

      const response = await request(app)
        .put('/api/team/users/user-123/role')
        .send({});

      expect(response.status).toBe(400);
    });

    test('should return 404 for non-existent user', async () => {
      db.get.mockResolvedValue(null);
      const app = createTestApp();

      const response = await request(app)
        .put('/api/team/users/nonexistent/role')
        .send({ role: 'advisor' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    test('should return 409 if role already assigned', async () => {
      db.get
        .mockResolvedValueOnce({ id: 'user-123' }) // user exists
        .mockResolvedValueOnce({ id: 1 }); // role already exists
      const app = createTestApp();

      const response = await request(app)
        .put('/api/team/users/user-123/role')
        .send({ role: 'advisor' });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Role already assigned');
    });

    test('should handle database error', async () => {
      db.get.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .put('/api/team/users/user-123/role')
        .send({ role: 'advisor' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to assign role');
    });
  });

  describe('DELETE /api/team/assignments/:assignmentId', () => {
    test('should remove assignment', async () => {
      db.get.mockResolvedValue({
        id: 'assign-123',
        advisor_id: 'adv-123',
        engagement_id: 'eng-123'
      });
      db.run.mockResolvedValue({ changes: 1 });
      const app = createTestApp();

      const response = await request(app)
        .delete('/api/team/assignments/assign-123');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Assignment removed successfully');
    });

    test('should return 404 for non-existent assignment', async () => {
      db.get.mockResolvedValue(null);
      const app = createTestApp();

      const response = await request(app)
        .delete('/api/team/assignments/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Assignment not found');
    });

    test('should handle database error', async () => {
      db.get.mockResolvedValue({ id: 'assign-123' });
      db.run.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .delete('/api/team/assignments/assign-123');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to remove assignment');
    });
  });

  describe('Valid Roles', () => {
    test('should accept owner role', async () => {
      db.get
        .mockResolvedValueOnce({ id: 'user-123' })
        .mockResolvedValueOnce(null);
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const response = await request(app)
        .put('/api/team/users/user-123/role')
        .send({ role: 'owner' });

      expect(response.status).toBe(201);
    });

    test('should accept advisor role', async () => {
      db.get
        .mockResolvedValueOnce({ id: 'user-123' })
        .mockResolvedValueOnce(null);
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const response = await request(app)
        .put('/api/team/users/user-123/role')
        .send({ role: 'advisor' });

      expect(response.status).toBe(201);
    });

    test('should accept admin role', async () => {
      db.get
        .mockResolvedValueOnce({ id: 'user-123' })
        .mockResolvedValueOnce(null);
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const response = await request(app)
        .put('/api/team/users/user-123/role')
        .send({ role: 'admin' });

      expect(response.status).toBe(201);
    });
  });
});
