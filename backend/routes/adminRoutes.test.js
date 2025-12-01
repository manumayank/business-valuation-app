/**
 * Integration Tests for Admin Routes
 * Tests the Admin Dashboard API endpoints
 * Run with: npm test
 */

const express = require('express');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const adminRoutes = require('./adminRoutes');

// Mock the database
jest.mock('../db', () => ({
  get: jest.fn(),
  all: jest.fn(),
  run: jest.fn()
}));

const db = require('../db');

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => Promise.resolve('hashed_password'))
}));

// Mock authentication middleware
jest.mock('../middleware/authMiddleware', () => ({
  requireAuth: (req, res, next) => {
    req.user = { userId: 'admin-user-123' };
    next();
  }
}));

// Create a test app
const createTestApp = (isAdmin = true) => {
  const app = express();
  app.use(express.json());

  // Mock admin check
  if (isAdmin) {
    db.get.mockImplementation((query, params) => {
      if (query.includes('SELECT role FROM users')) {
        return Promise.resolve({ role: 'admin' });
      }
      return Promise.resolve(null);
    });
  }

  app.use('/api/admin', adminRoutes);
  return app;
};

// Sample test data
const sampleAdvisors = [
  {
    id: 1,
    fullName: 'John Doe',
    email: 'john@test.com',
    role: 'advisor',
    created_at: '2024-01-15',
    is_active: 1,
    businessCount: 5,
    engagementCount: 10
  },
  {
    id: 2,
    fullName: 'Jane Smith',
    email: 'jane@test.com',
    role: 'advisor',
    created_at: '2024-02-20',
    is_active: 0,
    businessCount: 3,
    engagementCount: 7
  }
];

const sampleBusinesses = [
  {
    id: 1,
    name: 'Tech Corp',
    industry: 'Technology',
    advisorName: 'John Doe',
    advisorEmail: 'john@test.com',
    engagementCount: 2
  }
];

const sampleEngagements = [
  {
    id: 1,
    business_id: 1,
    advisor_id: 1,
    status: 'intake',
    engagement_type: 'valuation',
    businessName: 'Tech Corp',
    advisorName: 'John Doe'
  }
];

const sampleActivity = [
  {
    id: 1,
    action: 'advisor_created',
    entity_type: 'user',
    entity_id: 2,
    details: JSON.stringify({ name: 'Jane Smith', email: 'jane@test.com' }),
    created_at: '2024-03-01',
    userName: 'Admin User'
  }
];

describe('Admin Routes', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('GET /api/admin/stats', () => {
    test('should return dashboard statistics with correct format', async () => {
      const app = createTestApp();

      db.get.mockImplementation((query) => {
        if (query.includes('SELECT role')) return Promise.resolve({ role: 'admin' });
        if (query.includes("role = 'advisor'")) return Promise.resolve({ count: 5 });
        if (query.includes('FROM businesses')) return Promise.resolve({ count: 10 });
        if (query.includes('FROM engagements') && !query.includes('status')) return Promise.resolve({ count: 15 });
        if (query.includes("IN (?, ?)")) return Promise.resolve({ count: 8 });
        if (query.includes("status = 'review'")) return Promise.resolve({ count: 3 });
        if (query.includes("status = 'completed'")) return Promise.resolve({ count: 7 });
        return Promise.resolve({ count: 0 });
      });

      const response = await request(app).get('/api/admin/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('totalAdvisors');
      expect(response.body.stats).toHaveProperty('totalBusinesses');
      expect(response.body.stats).toHaveProperty('totalEngagements');
      expect(response.body.stats).toHaveProperty('activeEngagements');
      expect(response.body.stats).toHaveProperty('pendingReview');
      expect(response.body.stats).toHaveProperty('completedEngagements');
    });

    test('should handle errors gracefully', async () => {
      const app = createTestApp();

      db.get.mockImplementation((query) => {
        if (query.includes('SELECT role')) return Promise.resolve({ role: 'admin' });
        return Promise.reject(new Error('Database error'));
      });

      const response = await request(app).get('/api/admin/stats');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/admin/advisors', () => {
    test('should return list of advisors with fullName and status fields', async () => {
      const app = createTestApp();

      db.get.mockResolvedValue({ role: 'admin' });
      db.all.mockResolvedValue(sampleAdvisors);

      const response = await request(app).get('/api/admin/advisors');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('advisors');
      expect(Array.isArray(response.body.advisors)).toBe(true);

      // Verify the first advisor has correct field names
      if (response.body.advisors.length > 0) {
        const advisor = response.body.advisors[0];
        expect(advisor).toHaveProperty('fullName');
        expect(advisor).toHaveProperty('status');
        expect(['active', 'inactive']).toContain(advisor.status);
      }
    });

    test('should support search filter', async () => {
      const app = createTestApp();

      db.get.mockResolvedValue({ role: 'admin' });
      db.all.mockResolvedValue([sampleAdvisors[0]]);

      const response = await request(app)
        .get('/api/admin/advisors')
        .query({ search: 'john' });

      expect(response.status).toBe(200);
      expect(response.body.advisors).toHaveLength(1);
    });

    test('should support status filter', async () => {
      const app = createTestApp();

      db.get.mockResolvedValue({ role: 'admin' });
      db.all.mockResolvedValue([sampleAdvisors[0]]);

      const response = await request(app)
        .get('/api/admin/advisors')
        .query({ status: 'active' });

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/admin/advisors', () => {
    test('should create new advisor with fullName field', async () => {
      const app = createTestApp();

      db.get.mockImplementation((query) => {
        if (query.includes('SELECT role')) return Promise.resolve({ role: 'admin' });
        if (query.includes('SELECT id FROM users')) return Promise.resolve(null); // No existing user
        return Promise.resolve(null);
      });
      db.run.mockResolvedValue({ lastID: 3 });

      const response = await request(app)
        .post('/api/admin/advisors')
        .send({
          fullName: 'New Advisor',
          email: 'new@test.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('advisor');
      expect(response.body.advisor).toHaveProperty('fullName', 'New Advisor');
      expect(response.body.advisor).toHaveProperty('status', 'active');
    });

    test('should also accept name field for backwards compatibility', async () => {
      const app = createTestApp();

      db.get.mockImplementation((query) => {
        if (query.includes('SELECT role')) return Promise.resolve({ role: 'admin' });
        if (query.includes('SELECT id FROM users')) return Promise.resolve(null);
        return Promise.resolve(null);
      });
      db.run.mockResolvedValue({ lastID: 4 });

      const response = await request(app)
        .post('/api/admin/advisors')
        .send({
          name: 'Legacy Advisor',
          email: 'legacy@test.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(201);
      expect(response.body.advisor).toHaveProperty('fullName', 'Legacy Advisor');
    });

    test('should return 400 for missing required fields', async () => {
      const app = createTestApp();

      db.get.mockResolvedValue({ role: 'admin' });

      const response = await request(app)
        .post('/api/admin/advisors')
        .send({
          email: 'incomplete@test.com'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should return 409 for duplicate email', async () => {
      const app = createTestApp();

      db.get.mockImplementation((query) => {
        if (query.includes('SELECT role')) return Promise.resolve({ role: 'admin' });
        if (query.includes('SELECT id FROM users')) return Promise.resolve({ id: 1 }); // Existing user
        return Promise.resolve(null);
      });

      const response = await request(app)
        .post('/api/admin/advisors')
        .send({
          fullName: 'Duplicate User',
          email: 'existing@test.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/admin/advisors/:id', () => {
    test('should update advisor details', async () => {
      const app = createTestApp();

      db.get.mockImplementation((query, params) => {
        if (query.includes('SELECT role')) return Promise.resolve({ role: 'admin' });
        if (query.includes('SELECT * FROM users WHERE id = ?')) {
          return Promise.resolve({ id: 1, full_name: 'Old Name', email: 'old@test.com', is_active: 1 });
        }
        return Promise.resolve(null);
      });
      db.run.mockResolvedValue({ changes: 1 });

      const response = await request(app)
        .put('/api/admin/advisors/1')
        .send({
          fullName: 'Updated Name',
          email: 'updated@test.com'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    test('should return 404 for non-existent advisor', async () => {
      const app = createTestApp();

      db.get.mockImplementation((query) => {
        if (query.includes('SELECT role')) return Promise.resolve({ role: 'admin' });
        if (query.includes('SELECT * FROM users')) return Promise.resolve(null);
        return Promise.resolve(null);
      });

      const response = await request(app)
        .put('/api/admin/advisors/999')
        .send({
          fullName: 'Updated Name'
        });

      expect(response.status).toBe(404);
    });

    test('should return 400 when no updates provided', async () => {
      const app = createTestApp();

      db.get.mockImplementation((query) => {
        if (query.includes('SELECT role')) return Promise.resolve({ role: 'admin' });
        if (query.includes('SELECT * FROM users')) {
          return Promise.resolve({ id: 1, full_name: 'Name', email: 'test@test.com' });
        }
        return Promise.resolve(null);
      });

      const response = await request(app)
        .put('/api/admin/advisors/1')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/admin/advisors/:id/status', () => {
    test('should toggle advisor status to active', async () => {
      const app = createTestApp();

      db.get.mockImplementation((query) => {
        if (query.includes('SELECT role')) return Promise.resolve({ role: 'admin' });
        if (query.includes('SELECT * FROM users')) {
          return Promise.resolve({ id: 1, full_name: 'Test User', is_active: 0 });
        }
        return Promise.resolve(null);
      });
      db.run.mockResolvedValue({ changes: 1 });

      const response = await request(app)
        .put('/api/admin/advisors/1/status')
        .send({ status: 'active' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('activated');
    });

    test('should toggle advisor status to inactive', async () => {
      const app = createTestApp();

      db.get.mockImplementation((query) => {
        if (query.includes('SELECT role')) return Promise.resolve({ role: 'admin' });
        if (query.includes('SELECT * FROM users')) {
          return Promise.resolve({ id: 1, full_name: 'Test User', is_active: 1 });
        }
        return Promise.resolve(null);
      });
      db.run.mockResolvedValue({ changes: 1 });

      const response = await request(app)
        .put('/api/admin/advisors/1/status')
        .send({ status: 'inactive' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deactivated');
    });

    test('should return 404 for non-existent advisor', async () => {
      const app = createTestApp();

      db.get.mockImplementation((query) => {
        if (query.includes('SELECT role')) return Promise.resolve({ role: 'admin' });
        if (query.includes('SELECT * FROM users')) return Promise.resolve(null);
        return Promise.resolve(null);
      });

      const response = await request(app)
        .put('/api/admin/advisors/999/status')
        .send({ status: 'active' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/admin/advisors/:id', () => {
    test('should deactivate advisor (soft delete)', async () => {
      const app = createTestApp();

      db.get.mockImplementation((query) => {
        if (query.includes('SELECT role')) return Promise.resolve({ role: 'admin' });
        if (query.includes('SELECT * FROM users')) {
          return Promise.resolve({ id: 1, name: 'Test User', is_active: 1 });
        }
        return Promise.resolve(null);
      });
      db.run.mockResolvedValue({ changes: 1 });

      const response = await request(app)
        .delete('/api/admin/advisors/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    test('should return 404 for non-existent advisor', async () => {
      const app = createTestApp();

      db.get.mockImplementation((query) => {
        if (query.includes('SELECT role')) return Promise.resolve({ role: 'admin' });
        if (query.includes('SELECT * FROM users')) return Promise.resolve(null);
        return Promise.resolve(null);
      });

      const response = await request(app)
        .delete('/api/admin/advisors/999');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/admin/businesses', () => {
    test('should return list of businesses', async () => {
      const app = createTestApp();

      db.get.mockResolvedValue({ role: 'admin' });
      db.all.mockResolvedValue(sampleBusinesses);

      const response = await request(app).get('/api/admin/businesses');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('businesses');
      expect(Array.isArray(response.body.businesses)).toBe(true);
    });

    test('should support search filter', async () => {
      const app = createTestApp();

      db.get.mockResolvedValue({ role: 'admin' });
      db.all.mockResolvedValue([sampleBusinesses[0]]);

      const response = await request(app)
        .get('/api/admin/businesses')
        .query({ search: 'tech' });

      expect(response.status).toBe(200);
    });

    test('should support advisor filter', async () => {
      const app = createTestApp();

      db.get.mockResolvedValue({ role: 'admin' });
      db.all.mockResolvedValue([sampleBusinesses[0]]);

      const response = await request(app)
        .get('/api/admin/businesses')
        .query({ advisorId: '1' });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/admin/businesses/:id', () => {
    test('should return business details with engagements', async () => {
      const app = createTestApp();

      db.get.mockImplementation((query) => {
        if (query.includes('SELECT role')) return Promise.resolve({ role: 'admin' });
        if (query.includes('FROM businesses b')) {
          return Promise.resolve(sampleBusinesses[0]);
        }
        return Promise.resolve(null);
      });
      db.all.mockResolvedValue(sampleEngagements);

      const response = await request(app).get('/api/admin/businesses/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('business');
      expect(response.body).toHaveProperty('engagements');
    });

    test('should return 404 for non-existent business', async () => {
      const app = createTestApp();

      db.get.mockImplementation((query) => {
        if (query.includes('SELECT role')) return Promise.resolve({ role: 'admin' });
        return Promise.resolve(null);
      });

      const response = await request(app).get('/api/admin/businesses/999');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/admin/engagements', () => {
    test('should return list of engagements', async () => {
      const app = createTestApp();

      db.get.mockResolvedValue({ role: 'admin' });
      db.all.mockResolvedValue(sampleEngagements);

      const response = await request(app).get('/api/admin/engagements');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('engagements');
      expect(Array.isArray(response.body.engagements)).toBe(true);
    });

    test('should support status filter', async () => {
      const app = createTestApp();

      db.get.mockResolvedValue({ role: 'admin' });
      db.all.mockResolvedValue([sampleEngagements[0]]);

      const response = await request(app)
        .get('/api/admin/engagements')
        .query({ status: 'intake' });

      expect(response.status).toBe(200);
    });

    test('should support engagement type filter', async () => {
      const app = createTestApp();

      db.get.mockResolvedValue({ role: 'admin' });
      db.all.mockResolvedValue([sampleEngagements[0]]);

      const response = await request(app)
        .get('/api/admin/engagements')
        .query({ engagementType: 'valuation' });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/admin/activity', () => {
    test('should return activity log', async () => {
      const app = createTestApp();

      db.get.mockResolvedValue({ role: 'admin' });
      db.all.mockResolvedValue(sampleActivity);

      const response = await request(app).get('/api/admin/activity');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('activities');
      expect(Array.isArray(response.body.activities)).toBe(true);
    });

    test('should support pagination with limit and offset', async () => {
      const app = createTestApp();

      db.get.mockResolvedValue({ role: 'admin' });
      db.all.mockResolvedValue(sampleActivity);

      const response = await request(app)
        .get('/api/admin/activity')
        .query({ limit: 10, offset: 0 });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/admin/overview', () => {
    test('should return dashboard overview data', async () => {
      const app = createTestApp();

      db.get.mockResolvedValue({ role: 'admin' });
      db.all.mockImplementation((query) => {
        if (query.includes('ORDER BY engagementCount')) {
          return Promise.resolve([{ id: 1, fullName: 'Top Advisor', engagementCount: 10 }]);
        }
        if (query.includes('FROM businesses')) {
          return Promise.resolve(sampleBusinesses);
        }
        if (query.includes('FROM audit_logs')) {
          return Promise.resolve(sampleActivity);
        }
        return Promise.resolve([]);
      });

      const response = await request(app).get('/api/admin/overview');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('topAdvisors');
      expect(response.body).toHaveProperty('recentBusinesses');
      expect(response.body).toHaveProperty('recentActivity');
    });
  });

  // ==================== INDUSTRY MULTIPLES TESTS ====================

  describe('GET /api/admin/industry-multiples', () => {
    const sampleMultiples = [
      { id: 1, naicsCode: '541511', industryName: 'Custom Computer Programming', multiple: 4.5, source: 'admin' },
      { id: 2, naicsCode: '541512', industryName: 'Computer Systems Design', multiple: 5.0, source: 'admin' }
    ];

    test('should return list of industry multiples', async () => {
      const app = createTestApp();

      db.get.mockResolvedValue({ role: 'admin' });
      db.all.mockResolvedValue(sampleMultiples);

      const response = await request(app).get('/api/admin/industry-multiples');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('multiples');
      expect(Array.isArray(response.body.multiples)).toBe(true);
    });

    test('should support search filter', async () => {
      const app = createTestApp();

      db.get.mockResolvedValue({ role: 'admin' });
      db.all.mockResolvedValue([sampleMultiples[0]]);

      const response = await request(app)
        .get('/api/admin/industry-multiples')
        .query({ search: 'Programming' });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/admin/industry-multiples/:id', () => {
    test('should return single industry multiple', async () => {
      const app = createTestApp();

      db.get.mockImplementation((query) => {
        if (query.includes('SELECT role')) return Promise.resolve({ role: 'admin' });
        if (query.includes('FROM industry_multiples')) {
          return Promise.resolve({
            id: 1,
            naicsCode: '541511',
            industryName: 'Custom Computer Programming',
            multiple: 4.5,
            source: 'admin'
          });
        }
        return Promise.resolve(null);
      });

      const response = await request(app).get('/api/admin/industry-multiples/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('multiple');
      expect(response.body.multiple).toHaveProperty('naicsCode', '541511');
    });

    test('should return 404 for non-existent multiple', async () => {
      const app = createTestApp();

      db.get.mockImplementation((query) => {
        if (query.includes('SELECT role')) return Promise.resolve({ role: 'admin' });
        return Promise.resolve(null);
      });

      const response = await request(app).get('/api/admin/industry-multiples/999');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/admin/industry-multiples', () => {
    test('should create new industry multiple', async () => {
      const app = createTestApp();

      db.get.mockImplementation((query) => {
        if (query.includes('SELECT role')) return Promise.resolve({ role: 'admin' });
        if (query.includes('SELECT id FROM industry_multiples')) return Promise.resolve(null);
        return Promise.resolve(null);
      });
      db.run.mockResolvedValue({ lastID: 1 });

      const response = await request(app)
        .post('/api/admin/industry-multiples')
        .send({
          naicsCode: '541511',
          industryName: 'Custom Computer Programming',
          multiple: 4.5
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('multiple');
      expect(response.body.multiple).toHaveProperty('naicsCode', '541511');
    });

    test('should return 400 for missing required fields', async () => {
      const app = createTestApp();

      db.get.mockResolvedValue({ role: 'admin' });

      const response = await request(app)
        .post('/api/admin/industry-multiples')
        .send({
          naicsCode: '541511'
          // missing industryName and multiple
        });

      expect(response.status).toBe(400);
    });

    test('should return 409 for duplicate NAICS code', async () => {
      const app = createTestApp();

      db.get.mockImplementation((query) => {
        if (query.includes('SELECT role')) return Promise.resolve({ role: 'admin' });
        if (query.includes('SELECT id FROM industry_multiples')) return Promise.resolve({ id: 1 });
        return Promise.resolve(null);
      });

      const response = await request(app)
        .post('/api/admin/industry-multiples')
        .send({
          naicsCode: '541511',
          industryName: 'Duplicate',
          multiple: 4.5
        });

      expect(response.status).toBe(409);
    });
  });

  describe('PUT /api/admin/industry-multiples/:id', () => {
    test('should update industry multiple', async () => {
      const app = createTestApp();

      db.get.mockImplementation((query) => {
        if (query.includes('SELECT role')) return Promise.resolve({ role: 'admin' });
        if (query.includes('SELECT * FROM industry_multiples')) {
          return Promise.resolve({
            id: 1,
            naics_code: '541511',
            industry_name: 'Old Name',
            multiple: 4.5
          });
        }
        return Promise.resolve(null);
      });
      db.run.mockResolvedValue({ changes: 1 });

      const response = await request(app)
        .put('/api/admin/industry-multiples/1')
        .send({
          industryName: 'Updated Name',
          multiple: 5.0
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    test('should return 404 for non-existent multiple', async () => {
      const app = createTestApp();

      db.get.mockImplementation((query) => {
        if (query.includes('SELECT role')) return Promise.resolve({ role: 'admin' });
        return Promise.resolve(null);
      });

      const response = await request(app)
        .put('/api/admin/industry-multiples/999')
        .send({ multiple: 5.0 });

      expect(response.status).toBe(404);
    });

    test('should return 400 when no updates provided', async () => {
      const app = createTestApp();

      db.get.mockImplementation((query) => {
        if (query.includes('SELECT role')) return Promise.resolve({ role: 'admin' });
        if (query.includes('SELECT * FROM industry_multiples')) {
          return Promise.resolve({ id: 1, naics_code: '541511' });
        }
        return Promise.resolve(null);
      });

      const response = await request(app)
        .put('/api/admin/industry-multiples/1')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/admin/industry-multiples/:id', () => {
    test('should delete industry multiple', async () => {
      const app = createTestApp();

      db.get.mockImplementation((query) => {
        if (query.includes('SELECT role')) return Promise.resolve({ role: 'admin' });
        if (query.includes('SELECT * FROM industry_multiples')) {
          return Promise.resolve({
            id: 1,
            naics_code: '541511',
            industry_name: 'Test Industry'
          });
        }
        return Promise.resolve(null);
      });
      db.run.mockResolvedValue({ changes: 1 });

      const response = await request(app).delete('/api/admin/industry-multiples/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    test('should return 404 for non-existent multiple', async () => {
      const app = createTestApp();

      db.get.mockImplementation((query) => {
        if (query.includes('SELECT role')) return Promise.resolve({ role: 'admin' });
        return Promise.resolve(null);
      });

      const response = await request(app).delete('/api/admin/industry-multiples/999');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/admin/industry-multiples/bulk', () => {
    test('should bulk import industry multiples', async () => {
      const app = createTestApp();

      db.get.mockResolvedValue({ role: 'admin' });
      db.run.mockResolvedValue({ changes: 1 });

      const response = await request(app)
        .post('/api/admin/industry-multiples/bulk')
        .send({
          multiples: [
            { naicsCode: '541511', industryName: 'Programming', multiple: 4.5 },
            { naicsCode: '541512', industryName: 'Systems Design', multiple: 5.0 }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('imported', 2);
      expect(response.body).toHaveProperty('skipped', 0);
    });

    test('should handle partial failures in bulk import', async () => {
      const app = createTestApp();

      db.get.mockResolvedValue({ role: 'admin' });
      db.run.mockResolvedValue({ changes: 1 });

      const response = await request(app)
        .post('/api/admin/industry-multiples/bulk')
        .send({
          multiples: [
            { naicsCode: '541511', industryName: 'Programming', multiple: 4.5 },
            { naicsCode: '541512' } // Missing required fields
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.imported).toBe(1);
      expect(response.body.skipped).toBe(1);
    });

    test('should return 400 for empty multiples array', async () => {
      const app = createTestApp();

      db.get.mockResolvedValue({ role: 'admin' });

      const response = await request(app)
        .post('/api/admin/industry-multiples/bulk')
        .send({ multiples: [] });

      expect(response.status).toBe(400);
    });
  });

  describe('Authorization', () => {
    test('should return 403 for non-admin users', async () => {
      const app = express();
      app.use(express.json());

      // Mock non-admin user
      db.get.mockResolvedValue({ role: 'advisor' });

      app.use('/api/admin', adminRoutes);

      const response = await request(app).get('/api/admin/stats');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Admin access required');
    });
  });
});
