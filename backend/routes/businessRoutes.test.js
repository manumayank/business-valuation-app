/**
 * Integration Tests for Business Routes
 * Tests CRUD operations for businesses
 */

const express = require('express');
const request = require('supertest');
const businessRoutes = require('./businessRoutes');

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
  requireBusinessOwnership: (req, res, next) => {
    // Simulate business ownership check
    if (req.params.businessId === 'unauthorized-business') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to access this business'
      });
    }
    req.business = {
      id: req.params.businessId,
      name: 'Test Business',
      naics_code: '541511',
      location: 'New York',
      founded_year: 2020,
      owner_id: 'user-123',
      status: 'active',
      created_at: '2024-01-01',
      updated_at: '2024-01-15'
    };
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
  app.use('/api/businesses', businessRoutes);
  return app;
};

describe('Business Routes - CRUD API', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('POST /api/businesses', () => {
    const validBusiness = {
      name: 'Acme Corporation',
      naicsCode: '541511',
      location: 'San Francisco, CA',
      foundedYear: 2015
    };

    test('should create a new business successfully', async () => {
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/businesses')
        .send(validBusiness);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Business created successfully');
      expect(response.body.business).toBeDefined();
      expect(response.body.business.name).toBe('Acme Corporation');
      expect(response.body.business.naicsCode).toBe('541511');
      expect(response.body.business.location).toBe('San Francisco, CA');
      expect(response.body.business.foundedYear).toBe(2015);
      expect(response.body.business.status).toBe('active');
    });

    test('should reject creation without name', async () => {
      const app = createTestApp();

      const response = await request(app)
        .post('/api/businesses')
        .send({ naicsCode: '541511' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Business name is required');
    });

    test('should create business with only required fields', async () => {
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/businesses')
        .send({ name: 'Minimal Business' });

      expect(response.status).toBe(201);
      expect(response.body.business.name).toBe('Minimal Business');
      expect(response.body.business.naicsCode).toBeUndefined();
    });

    test('should handle database error', async () => {
      db.run.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .post('/api/businesses')
        .send(validBusiness);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create business');
    });

    test('should log audit trail for business creation', async () => {
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      await request(app)
        .post('/api/businesses')
        .send(validBusiness);

      // Check audit log was called (third run call)
      const auditCall = db.run.mock.calls.find(call =>
        call[0].includes('audit_log') && call[0].includes('INSERT')
      );
      expect(auditCall).toBeDefined();
    });
  });

  describe('GET /api/businesses', () => {
    test('should list all user businesses', async () => {
      db.all.mockResolvedValue([
        {
          id: 'biz-1',
          name: 'Business One',
          naics_code: '541511',
          location: 'New York',
          founded_year: 2020,
          owner_id: 'user-123',
          status: 'active',
          created_at: '2024-01-01',
          updated_at: '2024-01-15'
        },
        {
          id: 'biz-2',
          name: 'Business Two',
          naics_code: '541512',
          location: 'Los Angeles',
          founded_year: 2018,
          owner_id: 'user-123',
          status: 'active',
          created_at: '2024-01-02',
          updated_at: '2024-01-16'
        }
      ]);
      const app = createTestApp();

      const response = await request(app)
        .get('/api/businesses');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(2);
      expect(response.body.businesses).toHaveLength(2);
      expect(response.body.businesses[0].name).toBe('Business One');
      expect(response.body.businesses[1].name).toBe('Business Two');
    });

    test('should return empty list when no businesses', async () => {
      db.all.mockResolvedValue([]);
      const app = createTestApp();

      const response = await request(app)
        .get('/api/businesses');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
      expect(response.body.businesses).toHaveLength(0);
    });

    test('should map database fields to camelCase', async () => {
      db.all.mockResolvedValue([{
        id: 'biz-1',
        name: 'Test Business',
        naics_code: '541511',
        founded_year: 2020,
        owner_id: 'user-123',
        created_at: '2024-01-01',
        updated_at: '2024-01-15',
        status: 'active'
      }]);
      const app = createTestApp();

      const response = await request(app)
        .get('/api/businesses');

      expect(response.body.businesses[0].naicsCode).toBe('541511');
      expect(response.body.businesses[0].foundedYear).toBe(2020);
      expect(response.body.businesses[0].ownerId).toBe('user-123');
      expect(response.body.businesses[0].createdAt).toBe('2024-01-01');
      expect(response.body.businesses[0].updatedAt).toBe('2024-01-15');
    });

    test('should handle database error', async () => {
      db.all.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .get('/api/businesses');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to retrieve businesses');
    });
  });

  describe('GET /api/businesses/:businessId', () => {
    test('should get business details', async () => {
      db.get.mockResolvedValue({ count: 3 }); // engagement count
      const app = createTestApp();

      const response = await request(app)
        .get('/api/businesses/biz-123');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('biz-123');
      expect(response.body.name).toBe('Test Business');
      expect(response.body.engagementCount).toBe(3);
    });

    test('should return 403 for unauthorized business', async () => {
      const app = createTestApp();

      const response = await request(app)
        .get('/api/businesses/unauthorized-business');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
    });

    test('should handle business with no engagements', async () => {
      db.get.mockResolvedValue({ count: 0 });
      const app = createTestApp();

      const response = await request(app)
        .get('/api/businesses/biz-123');

      expect(response.status).toBe(200);
      expect(response.body.engagementCount).toBe(0);
    });

    test('should handle null engagement count', async () => {
      db.get.mockResolvedValue(null);
      const app = createTestApp();

      const response = await request(app)
        .get('/api/businesses/biz-123');

      expect(response.status).toBe(200);
      expect(response.body.engagementCount).toBe(0);
    });

    test('should handle database error', async () => {
      db.get.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .get('/api/businesses/biz-123');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to retrieve business');
    });
  });

  describe('PUT /api/businesses/:businessId', () => {
    test('should update business name', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const app = createTestApp();

      const response = await request(app)
        .put('/api/businesses/biz-123')
        .send({ name: 'Updated Business Name' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Business updated successfully');
      expect(response.body.business.name).toBe('Updated Business Name');
    });

    test('should update multiple fields', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const app = createTestApp();

      const response = await request(app)
        .put('/api/businesses/biz-123')
        .send({
          name: 'New Name',
          location: 'Chicago',
          naicsCode: '541519'
        });

      expect(response.status).toBe(200);
      expect(response.body.business.name).toBe('New Name');
      expect(response.body.business.location).toBe('Chicago');
      expect(response.body.business.naicsCode).toBe('541519');
    });

    test('should update status field', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const app = createTestApp();

      const response = await request(app)
        .put('/api/businesses/biz-123')
        .send({ status: 'inactive' });

      expect(response.status).toBe(200);
      expect(response.body.business.status).toBe('inactive');
    });

    test('should reject update with no fields', async () => {
      const app = createTestApp();

      const response = await request(app)
        .put('/api/businesses/biz-123')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No fields to update');
    });

    test('should return 403 for unauthorized business', async () => {
      const app = createTestApp();

      const response = await request(app)
        .put('/api/businesses/unauthorized-business')
        .send({ name: 'Hacked Name' });

      expect(response.status).toBe(403);
    });

    test('should log audit trail for updates', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const app = createTestApp();

      await request(app)
        .put('/api/businesses/biz-123')
        .send({ name: 'Updated Name' });

      // Check audit log was called
      const auditCall = db.run.mock.calls.find(call =>
        call[0].includes('audit_log') && call[0].includes('UPDATE')
      );
      expect(auditCall).toBeDefined();
    });

    test('should handle database error', async () => {
      db.run.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .put('/api/businesses/biz-123')
        .send({ name: 'Test' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to update business');
    });
  });

  describe('DELETE /api/businesses/:businessId', () => {
    test('should delete business without active engagements', async () => {
      db.get.mockResolvedValue({ count: 0 }); // No active engagements
      db.run.mockResolvedValue({ changes: 1 });
      const app = createTestApp();

      const response = await request(app)
        .delete('/api/businesses/biz-123');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Business deleted successfully');
    });

    test('should reject deletion with active engagements', async () => {
      db.get.mockResolvedValue({ count: 5 }); // Has active engagements
      const app = createTestApp();

      const response = await request(app)
        .delete('/api/businesses/biz-123');

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Cannot delete business');
      expect(response.body.engagementCount).toBe(5);
    });

    test('should return 403 for unauthorized business', async () => {
      const app = createTestApp();

      const response = await request(app)
        .delete('/api/businesses/unauthorized-business');

      expect(response.status).toBe(403);
    });

    test('should log audit trail for deletion', async () => {
      db.get.mockResolvedValue({ count: 0 });
      db.run.mockResolvedValue({ changes: 1 });
      const app = createTestApp();

      await request(app)
        .delete('/api/businesses/biz-123');

      // Check audit log was called
      const auditCall = db.run.mock.calls.find(call =>
        call[0].includes('audit_log') && call[0].includes('DELETE')
      );
      expect(auditCall).toBeDefined();
    });

    test('should handle database error', async () => {
      db.get.mockResolvedValue({ count: 0 });
      db.run.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .delete('/api/businesses/biz-123');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to delete business');
    });

    test('should handle null engagement count', async () => {
      db.get.mockResolvedValue(null); // No engagement count returned
      db.run.mockResolvedValue({ changes: 1 });
      const app = createTestApp();

      const response = await request(app)
        .delete('/api/businesses/biz-123');

      expect(response.status).toBe(200);
    });
  });

  describe('Edge Cases', () => {
    test('should handle special characters in business name', async () => {
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/businesses')
        .send({ name: "O'Brien & Co., Inc." });

      expect(response.status).toBe(201);
      expect(response.body.business.name).toBe("O'Brien & Co., Inc.");
    });

    test('should handle unicode in business name', async () => {
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/businesses')
        .send({ name: '株式会社テスト' });

      expect(response.status).toBe(201);
      expect(response.body.business.name).toBe('株式会社テスト');
    });

    test('should handle very long business name', async () => {
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const longName = 'A'.repeat(500);
      const response = await request(app)
        .post('/api/businesses')
        .send({ name: longName });

      expect(response.status).toBe(201);
      expect(response.body.business.name).toBe(longName);
    });

    test('should handle empty string name', async () => {
      const app = createTestApp();

      const response = await request(app)
        .post('/api/businesses')
        .send({ name: '' });

      expect(response.status).toBe(400);
    });
  });
});
