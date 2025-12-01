/**
 * Integration Tests for Deal Analysis Routes
 * Tests M&A deal evaluation endpoints
 */

const express = require('express');
const request = require('supertest');
const dealAnalysisRoutes = require('./dealAnalysisRoutes');

// Mock the database
jest.mock('../db', () => ({
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn()
}));

// Mock deal analysis engine
jest.mock('../services/dealAnalysisEngine', () => ({
  analyzeDeal: jest.fn((data) => ({
    dealMetrics: {
      offeredPrice: data.offeredPrice,
      premium: { percentage: 15, assessment: 'fair' }
    },
    roiAnalysis: {
      expectedROI: 250000,
      expectedROIPercent: 25,
      paybackPeriodYears: 4
    },
    synergies: {
      totalSynergies: 500000,
      revenueSynergies: 300000,
      costSynergies: 200000
    },
    riskAssessment: {
      overallRiskScore: 45,
      grade: 'B'
    },
    dealScorecard: {
      overallScore: 7.5,
      recommendation: 'proceed'
    }
  })),
  generateDealScenarios: jest.fn(() => ({
    bestCase: { roi: 35, value: 1500000 },
    baseCase: { roi: 25, value: 1200000 },
    worstCase: { roi: 10, value: 900000 }
  }))
}));

// Mock auth middleware
jest.mock('../middleware/authMiddleware', () => ({
  requireAuth: (req, res, next) => {
    req.user = { userId: 'user-123', email: 'test@example.com' };
    next();
  }
}));

const db = require('../db');
const { analyzeDeal } = require('../services/dealAnalysisEngine');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.db = { run: db.run, get: db.get, all: db.all };
    next();
  });
  app.use('/api/valuations', dealAnalysisRoutes);
  return app;
};

// Sample valid deal data
const validDealData = {
  offeredPrice: 5000000,
  targetEBITDA: 800000,
  targetProfit: 600000,
  targetRevenue: 4000000,
  industry: 'tech'
};

describe('Deal Analysis Routes', () => {
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('POST /api/valuations/:id/deal/analyze', () => {
    test('should analyze deal successfully', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/deal/analyze')
        .send(validDealData);

      expect(response.status).toBe(200);
      expect(response.body.dealMetrics).toBeDefined();
      expect(response.body.roiAnalysis).toBeDefined();
      expect(response.body.synergies).toBeDefined();
      expect(response.body.riskAssessment).toBeDefined();
      expect(response.body.dealScorecard).toBeDefined();
    });

    test('should return 404 for non-existent valuation', async () => {
      db.get.mockResolvedValue(null);
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/nonexistent/deal/analyze')
        .send(validDealData);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    test('should reject missing required fields', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/deal/analyze')
        .send({ offeredPrice: 5000000 });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required field');
    });

    test('should save analysis to database', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      await request(app)
        .post('/api/valuations/val-123/deal/analyze')
        .send(validDealData);

      expect(db.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO deal_analysis'),
        expect.any(Array)
      );
    });

    test('should handle optional fields with defaults', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/deal/analyze')
        .send(validDealData);

      expect(response.status).toBe(200);
      expect(analyzeDeal).toHaveBeenCalledWith(
        expect.objectContaining({
          integrationComplexity: 5,
          culturalFitRating: 5,
          customerConcentration: 0.3
        })
      );
    });

    test('should handle database error', async () => {
      db.get.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/deal/analyze')
        .send(validDealData);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to analyze deal');
    });
  });

  describe('POST /api/valuations/:id/deal/scenarios', () => {
    test('should generate deal scenarios', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/deal/scenarios')
        .send(validDealData);

      expect(response.status).toBe(200);
      expect(response.body.scenarios).toBeDefined();
      expect(response.body.scenarios.bestCase).toBeDefined();
      expect(response.body.scenarios.baseCase).toBeDefined();
      expect(response.body.scenarios.worstCase).toBeDefined();
    });

    test('should return 404 for non-existent valuation', async () => {
      db.get.mockResolvedValue(null);
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/nonexistent/deal/scenarios')
        .send(validDealData);

      expect(response.status).toBe(404);
    });

    test('should handle database error', async () => {
      db.get.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/deal/scenarios')
        .send(validDealData);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to generate scenarios');
    });
  });

  describe('GET /api/valuations/:id/deal/analysis', () => {
    test('should retrieve existing deal analysis', async () => {
      db.get
        .mockResolvedValueOnce({ id: 'val-123', user_id: 'user-123' })
        .mockResolvedValueOnce({
          analysis_data: JSON.stringify({ dealMetrics: {}, roiAnalysis: {} }),
          created_at: '2024-01-15'
        });
      const app = createTestApp();

      const response = await request(app)
        .get('/api/valuations/val-123/deal/analysis');

      expect(response.status).toBe(200);
      expect(response.body.analysis).toBeDefined();
      expect(response.body.retrievedAt).toBeDefined();
    });

    test('should return 404 when no analysis exists', async () => {
      db.get
        .mockResolvedValueOnce({ id: 'val-123', user_id: 'user-123' })
        .mockResolvedValueOnce(null);
      const app = createTestApp();

      const response = await request(app)
        .get('/api/valuations/val-123/deal/analysis');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('No deal analysis found');
    });

    test('should return 404 for non-existent valuation', async () => {
      db.get.mockResolvedValue(null);
      const app = createTestApp();

      const response = await request(app)
        .get('/api/valuations/nonexistent/deal/analysis');

      expect(response.status).toBe(404);
    });

    test('should handle database error', async () => {
      db.get.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .get('/api/valuations/val-123/deal/analysis');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to retrieve deal analysis');
    });
  });

  describe('POST /api/valuations/:id/deal/compare', () => {
    test('should compare multiple deals', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/deal/compare')
        .send({
          deals: [
            { ...validDealData, offeredPrice: 5000000 },
            { ...validDealData, offeredPrice: 5500000 }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.numberOfDeals).toBe(2);
      expect(response.body.summary).toBeDefined();
      expect(response.body.analyses).toHaveLength(2);
    });

    test('should reject empty deals array', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/deal/compare')
        .send({ deals: [] });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('non-empty array');
    });

    test('should reject non-array deals', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/deal/compare')
        .send({ deals: 'not an array' });

      expect(response.status).toBe(400);
    });

    test('should return 404 for non-existent valuation', async () => {
      db.get.mockResolvedValue(null);
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/nonexistent/deal/compare')
        .send({ deals: [validDealData] });

      expect(response.status).toBe(404);
    });

    test('should handle database error', async () => {
      db.get.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/deal/compare')
        .send({ deals: [validDealData] });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to compare deals');
    });
  });

  describe('POST /api/valuations/:id/deal/sensitivity', () => {
    test('should perform sensitivity analysis', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/deal/sensitivity')
        .send({
          baseData: validDealData,
          variable: 'offeredPrice',
          ranges: [4000000, 5000000, 6000000]
        });

      expect(response.status).toBe(200);
      expect(response.body.variable).toBe('offeredPrice');
      expect(response.body.results).toBeDefined();
      expect(response.body.results.length).toBe(3);
    });

    test('should reject missing variable', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/deal/sensitivity')
        .send({
          baseData: validDealData,
          ranges: [4000000, 5000000]
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('variable');
    });

    test('should reject missing ranges', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/deal/sensitivity')
        .send({
          baseData: validDealData,
          variable: 'offeredPrice'
        });

      expect(response.status).toBe(400);
    });

    test('should return 404 for non-existent valuation', async () => {
      db.get.mockResolvedValue(null);
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/nonexistent/deal/sensitivity')
        .send({
          baseData: validDealData,
          variable: 'offeredPrice',
          ranges: [4000000, 5000000]
        });

      expect(response.status).toBe(404);
    });

    test('should handle database error', async () => {
      db.get.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/deal/sensitivity')
        .send({
          baseData: validDealData,
          variable: 'offeredPrice',
          ranges: [4000000, 5000000]
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to perform sensitivity analysis');
    });
  });
});
