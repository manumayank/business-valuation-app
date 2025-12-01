/**
 * Integration Tests for Engagement Routes
 * Tests engagement CRUD operations and access control
 */

const express = require('express');
const request = require('supertest');
const engagementRoutes = require('./engagementRoutes');

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
    if (req.params.businessId === 'unauthorized') {
      return res.status(403).json({ error: 'Access denied' });
    }
    req.business = { id: req.params.businessId, name: 'Test Business', owner_id: 'user-123' };
    next();
  },
  requireEngagementAccess: (req, res, next) => {
    if (req.params.engagementId === 'unauthorized') {
      return res.status(403).json({ error: 'Access denied' });
    }
    req.engagement = {
      id: req.params.engagementId,
      business_id: 'biz-123',
      owner_id: 'user-123',
      questionnaire_template_id: 1,
      assigned_advisor_id: 'user-123',
      engagement_type: 'vac',
      access_token: 'test-token-abc123',
      status: 'created',
      completion_percentage: 0,
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
  // Mount at both paths to match server.js setup
  app.use('/api/businesses', engagementRoutes);
  app.use('/api/engagements', engagementRoutes);
  app.use('/api', engagementRoutes);
  return app;
};

describe('Engagement Routes', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('POST /api/businesses/:businessId/engagements', () => {
    test('should create engagement successfully', async () => {
      db.get
        .mockResolvedValueOnce({ id: 1, name: 'Default Template' }) // template check
        .mockResolvedValueOnce({ name: 'Test Business' }) // business name
        .mockResolvedValueOnce({ id: 1 }); // default template
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/businesses/biz-123/engagements')
        .send({ engagementType: 'vac' });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Engagement created successfully');
      expect(response.body.engagement).toBeDefined();
      expect(response.body.engagement.id).toBeDefined();
      expect(response.body.engagement.accessToken).toBeDefined();
      expect(response.body.engagement.shareableUrl).toBeDefined();
    });

    test('should reject invalid engagement type', async () => {
      const app = createTestApp();

      const response = await request(app)
        .post('/api/businesses/biz-123/engagements')
        .send({ engagementType: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid engagement type');
      expect(response.body.validTypes).toBeDefined();
    });

    test('should create engagement with default type', async () => {
      db.get
        .mockResolvedValueOnce(null) // no template
        .mockResolvedValueOnce({ name: 'Test Business' })
        .mockResolvedValueOnce({ id: 1 });
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/businesses/biz-123/engagements')
        .send({});

      expect(response.status).toBe(201);
      expect(response.body.engagement.engagementType).toBe('vac');
    });

    test('should handle provided questionnaire template', async () => {
      // When a valid template ID is provided, it should be used
      db.get
        .mockResolvedValueOnce({ id: 1, name: 'Valid Template' }) // template exists
        .mockResolvedValueOnce({ name: 'Test Business' }); // business name
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/businesses/biz-123/engagements')
        .send({ questionnaireTemplateId: 1 });

      expect(response.status).toBe(201);
      expect(response.body.engagement.questionnaireTemplateId).toBe(1);
    });

    test('should handle database error', async () => {
      db.get.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .post('/api/businesses/biz-123/engagements')
        .send({ engagementType: 'vac' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create engagement');
    });

    test('should return 403 for unauthorized business', async () => {
      const app = createTestApp();

      const response = await request(app)
        .post('/api/businesses/unauthorized/engagements')
        .send({ engagementType: 'vac' });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/engagements', () => {
    test('should list all accessible engagements', async () => {
      db.all.mockResolvedValue([
        {
          id: 'eng-1',
          business_id: 'biz-1',
          business_name: 'Business One',
          questionnaire_template_id: 1,
          assigned_advisor_id: 'user-123',
          status: 'created',
          completion_percentage: 0,
          created_at: '2024-01-01',
          updated_at: '2024-01-15'
        },
        {
          id: 'eng-2',
          business_id: 'biz-2',
          business_name: 'Business Two',
          questionnaire_template_id: 1,
          assigned_advisor_id: 'user-123',
          status: 'intake',
          completion_percentage: 25,
          created_at: '2024-01-02',
          updated_at: '2024-01-16'
        }
      ]);
      const app = createTestApp();

      const response = await request(app)
        .get('/api/engagements');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(2);
      expect(response.body.engagements).toHaveLength(2);
      expect(response.body.engagements[0].businessName).toBe('Business One');
    });

    test('should return empty list when no engagements', async () => {
      db.all.mockResolvedValue([]);
      const app = createTestApp();

      const response = await request(app)
        .get('/api/engagements');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
      expect(response.body.engagements).toHaveLength(0);
    });

    test('should handle database error', async () => {
      db.all.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .get('/api/engagements');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to retrieve engagements');
    });
  });

  describe('GET /api/engagements/:engagementId', () => {
    test('should get engagement details', async () => {
      db.get
        .mockResolvedValueOnce({ risk_score: 75, risk_category: 'medium', score_breakdown: '{}', calculated_at: '2024-01-15' })
        .mockResolvedValueOnce({ count: 5 });
      const app = createTestApp();

      const response = await request(app)
        .get('/api/engagements/eng-123');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('eng-123');
      expect(response.body.businessId).toBe('biz-123');
      expect(response.body.status).toBe('created');
      expect(response.body.shareableUrl).toBeDefined();
      expect(response.body.riskScore).toBeDefined();
      expect(response.body.responseCount).toBe(5);
    });

    test('should handle engagement without risk score', async () => {
      db.get
        .mockResolvedValueOnce(null) // No risk score
        .mockResolvedValueOnce({ count: 0 });
      const app = createTestApp();

      const response = await request(app)
        .get('/api/engagements/eng-123');

      expect(response.status).toBe(200);
      expect(response.body.riskScore).toBeNull();
    });

    test('should return 403 for unauthorized engagement', async () => {
      const app = createTestApp();

      const response = await request(app)
        .get('/api/engagements/unauthorized');

      expect(response.status).toBe(403);
    });

    test('should handle database error', async () => {
      db.get.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .get('/api/engagements/eng-123');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to retrieve engagement');
    });
  });

  describe('PUT /api/engagements/:engagementId', () => {
    test('should update engagement status', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const app = createTestApp();

      const response = await request(app)
        .put('/api/engagements/eng-123')
        .send({ status: 'intake' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Engagement updated successfully');
      expect(response.body.engagement.status).toBe('intake');
    });

    test('should update completion percentage', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const app = createTestApp();

      const response = await request(app)
        .put('/api/engagements/eng-123')
        .send({ completionPercentage: 50 });

      expect(response.status).toBe(200);
      expect(response.body.engagement.completionPercentage).toBe(50);
    });

    test('should update assigned advisor', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const app = createTestApp();

      const response = await request(app)
        .put('/api/engagements/eng-123')
        .send({ assignedAdvisorId: 'advisor-456' });

      expect(response.status).toBe(200);
      expect(response.body.engagement.assignedAdvisorId).toBe('advisor-456');
    });

    test('should reject invalid status', async () => {
      const app = createTestApp();

      const response = await request(app)
        .put('/api/engagements/eng-123')
        .send({ status: 'invalid_status' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid status');
      expect(response.body.validStatuses).toBeDefined();
    });

    test('should reject invalid completion percentage (negative)', async () => {
      const app = createTestApp();

      const response = await request(app)
        .put('/api/engagements/eng-123')
        .send({ completionPercentage: -10 });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('between 0 and 100');
    });

    test('should reject invalid completion percentage (over 100)', async () => {
      const app = createTestApp();

      const response = await request(app)
        .put('/api/engagements/eng-123')
        .send({ completionPercentage: 150 });

      expect(response.status).toBe(400);
    });

    test('should reject empty update', async () => {
      const app = createTestApp();

      const response = await request(app)
        .put('/api/engagements/eng-123')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No fields to update');
    });

    test('should return 403 for unauthorized engagement', async () => {
      const app = createTestApp();

      const response = await request(app)
        .put('/api/engagements/unauthorized')
        .send({ status: 'intake' });

      expect(response.status).toBe(403);
    });

    test('should handle database error', async () => {
      db.run.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .put('/api/engagements/eng-123')
        .send({ status: 'intake' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to update engagement');
    });
  });

  describe('DELETE /api/engagements/:engagementId', () => {
    test('should delete engagement as owner', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const app = createTestApp();

      const response = await request(app)
        .delete('/api/engagements/eng-123');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Engagement deleted successfully');
    });

    test('should delete related data before engagement', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const app = createTestApp();

      await request(app)
        .delete('/api/engagements/eng-123');

      // Check that related tables were cleaned up
      const deleteCalls = db.run.mock.calls.filter(call =>
        call[0].includes('DELETE FROM')
      );
      expect(deleteCalls.length).toBeGreaterThanOrEqual(4); // responses, risk_scores, documents, team_assignments, engagements
    });

    test('should return 403 for unauthorized engagement', async () => {
      const app = createTestApp();

      const response = await request(app)
        .delete('/api/engagements/unauthorized');

      expect(response.status).toBe(403);
    });

    test('should handle database error', async () => {
      db.run.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .delete('/api/engagements/eng-123');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to delete engagement');
    });
  });

  describe('Edge Cases', () => {
    test('should handle all valid engagement types', async () => {
      const validTypes = ['vac', 'valuation', 'exit_planning', 'mna'];
      db.get
        .mockResolvedValue(null)
        .mockResolvedValue({ name: 'Test Business' })
        .mockResolvedValue({ id: 1 });
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      for (const type of validTypes) {
        const response = await request(app)
          .post('/api/businesses/biz-123/engagements')
          .send({ engagementType: type });

        expect(response.status).toBe(201);
        expect(response.body.engagement.engagementType).toBe(type);
      }
    });

    test('should handle all valid engagement statuses', async () => {
      const validStatuses = ['created', 'intake', 'review', 'under_review', 'drafted', 'reports'];
      db.run.mockResolvedValue({ changes: 1 });
      const app = createTestApp();

      for (const status of validStatuses) {
        const response = await request(app)
          .put('/api/engagements/eng-123')
          .send({ status });

        expect(response.status).toBe(200);
        expect(response.body.engagement.status).toBe(status);
      }
    });

    test('should handle boundary completion percentages', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const app = createTestApp();

      // Test 0%
      let response = await request(app)
        .put('/api/engagements/eng-123')
        .send({ completionPercentage: 0 });
      expect(response.status).toBe(200);

      // Test 100%
      response = await request(app)
        .put('/api/engagements/eng-123')
        .send({ completionPercentage: 100 });
      expect(response.status).toBe(200);
    });
  });
});
