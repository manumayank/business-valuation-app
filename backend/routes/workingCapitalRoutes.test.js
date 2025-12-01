/**
 * Integration Tests for Working Capital Routes
 * Tests working capital analysis, optimization, and recommendations endpoints
 */

const express = require('express');
const request = require('supertest');
const workingCapitalRoutes = require('./workingCapitalRoutes');

// Mock the database
jest.mock('../db', () => ({
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn()
}));

// Mock working capital engine
jest.mock('../services/workingCapitalEngine', () => ({
  analyzeWorkingCapital: jest.fn((data) => ({
    metrics: {
      dso: 45,
      dio: 30,
      dpo: 25,
      ccc: 50,
      wcPercentage: 15
    },
    benchmarks: {
      dso: 35,
      dio: 25,
      dpo: 30,
      ccc: 30,
      wcPercentage: 12,
      description: 'Tech Industry'
    },
    recommendations: [
      { priority: 'high', category: 'receivables', title: 'Improve DSO', impact: 50000 },
      { priority: 'medium', category: 'inventory', title: 'Reduce DIO', impact: 25000 },
      { priority: 'info', category: 'strength', title: 'Good payables', impact: 0 }
    ],
    riskAssessment: {
      score: 65,
      grade: 'B',
      factors: ['High DSO', 'Moderate inventory']
    },
    optimizationImpact: {
      totalCashReleased: 75000,
      cccImprovement: 20,
      valuationLift: 187500
    }
  })),
  INDUSTRY_BENCHMARKS: {
    tech: { dso: 35, dio: 25, dpo: 30, ccc: 30, wcPercentage: 12, description: 'Technology sector' },
    manufacturing: { dso: 45, dio: 60, dpo: 40, ccc: 65, wcPercentage: 20, description: 'Manufacturing sector' },
    retail: { dso: 10, dio: 45, dpo: 35, ccc: 20, wcPercentage: 15, description: 'Retail sector' }
  }
}));

// Mock auth middleware
jest.mock('../middleware/authMiddleware', () => ({
  requireAuth: (req, res, next) => {
    req.user = { userId: 'user-123', email: 'test@example.com' };
    next();
  }
}));

const db = require('../db');
const { analyzeWorkingCapital, INDUSTRY_BENCHMARKS } = require('../services/workingCapitalEngine');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.db = { run: db.run, get: db.get, all: db.all };
    next();
  });
  app.use('/api/valuations', workingCapitalRoutes);
  return app;
};

// Sample valid input data
const validInputData = {
  accountsReceivable: 500000,
  inventory: 300000,
  accountsPayable: 200000,
  costOfGoodsSold: 2000000,
  annualRevenue: 5000000,
  totalCurrentAssets: 1000000,
  totalCurrentLiabilities: 400000,
  industry: 'tech'
};

describe('Working Capital Routes', () => {
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

  describe('POST /api/valuations/:id/working-capital/calculate', () => {
    test('should calculate working capital analysis successfully', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/working-capital/calculate')
        .send(validInputData);

      expect(response.status).toBe(200);
      expect(response.body.metrics).toBeDefined();
      expect(response.body.metrics.dso).toBe(45);
      expect(response.body.benchmarks).toBeDefined();
      expect(response.body.recommendations).toBeDefined();
      expect(response.body.riskAssessment).toBeDefined();
    });

    test('should return 404 for non-existent valuation', async () => {
      db.get.mockResolvedValue(null);
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/nonexistent/working-capital/calculate')
        .send(validInputData);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    test('should reject missing required fields', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/working-capital/calculate')
        .send({ accountsReceivable: 500000 }); // Missing most fields

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required field');
    });

    test('should reject negative numeric values', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/working-capital/calculate')
        .send({ ...validInputData, accountsReceivable: -100 });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('non-negative number');
    });

    test('should reject non-numeric values', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/working-capital/calculate')
        .send({ ...validInputData, inventory: 'not a number' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('non-negative number');
    });

    test('should save analysis to database', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      await request(app)
        .post('/api/valuations/val-123/working-capital/calculate')
        .send(validInputData);

      expect(db.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO working_capital_analysis'),
        expect.any(Array)
      );
    });

    test('should handle database error', async () => {
      db.get.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/working-capital/calculate')
        .send(validInputData);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to calculate working capital analysis');
    });

    test('should validate all required fields', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      const app = createTestApp();

      const requiredFields = [
        'accountsReceivable', 'inventory', 'accountsPayable',
        'costOfGoodsSold', 'annualRevenue', 'totalCurrentAssets',
        'totalCurrentLiabilities', 'industry'
      ];

      for (const field of requiredFields) {
        const data = { ...validInputData };
        delete data[field];

        const response = await request(app)
          .post('/api/valuations/val-123/working-capital/calculate')
          .send(data);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain(field);
      }
    });
  });

  describe('POST /api/valuations/:id/working-capital/optimize', () => {
    test('should generate optimization scenarios', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/working-capital/optimize')
        .send(validInputData);

      expect(response.status).toBe(200);
      expect(response.body.baseAnalysis).toBeDefined();
      expect(response.body.scenarios).toBeDefined();
      expect(response.body.scenarios.conservative).toBeDefined();
      expect(response.body.scenarios.moderate).toBeDefined();
      expect(response.body.scenarios.aggressive).toBeDefined();
      expect(response.body.benchmarks).toBeDefined();
    });

    test('should return 404 for non-existent valuation', async () => {
      db.get.mockResolvedValue(null);
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/nonexistent/working-capital/optimize')
        .send(validInputData);

      expect(response.status).toBe(404);
    });

    test('should include projected impact in scenarios', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/working-capital/optimize')
        .send(validInputData);

      expect(response.body.scenarios.moderate.projectedImpact).toBeDefined();
      expect(response.body.scenarios.moderate.projectedImpact.totalReleasedCash).toBeDefined();
    });

    test('should handle database error', async () => {
      db.get.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/working-capital/optimize')
        .send(validInputData);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to generate optimization scenarios');
    });
  });

  describe('POST /api/valuations/:id/working-capital/recommendations', () => {
    test('should return prioritized recommendations', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/working-capital/recommendations')
        .send(validInputData);

      expect(response.status).toBe(200);
      expect(response.body.recommendations).toBeDefined();
      expect(Array.isArray(response.body.recommendations)).toBe(true);
      expect(response.body.summary).toBeDefined();
      expect(response.body.metrics).toBeDefined();
      expect(response.body.riskAssessment).toBeDefined();
    });

    test('should return summary with priority counts', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/working-capital/recommendations')
        .send(validInputData);

      expect(response.body.summary.critical).toBeDefined();
      expect(response.body.summary.medium).toBeDefined();
      expect(response.body.summary.strengths).toBeDefined();
    });

    test('should return 404 for non-existent valuation', async () => {
      db.get.mockResolvedValue(null);
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/nonexistent/working-capital/recommendations')
        .send(validInputData);

      expect(response.status).toBe(404);
    });

    test('should handle database error', async () => {
      db.get.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/working-capital/recommendations')
        .send(validInputData);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to generate recommendations');
    });
  });

  describe('GET /api/valuations/:id/working-capital/benchmarks', () => {
    test('should return all benchmarks when no industry specified', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      const app = createTestApp();

      const response = await request(app)
        .get('/api/valuations/val-123/working-capital/benchmarks');

      expect(response.status).toBe(200);
      expect(response.body.allBenchmarks).toBeDefined();
      expect(response.body.availableIndustries).toBeDefined();
      expect(response.body.availableIndustries).toContain('tech');
      expect(response.body.availableIndustries).toContain('manufacturing');
    });

    test('should return specific industry benchmarks', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      const app = createTestApp();

      const response = await request(app)
        .get('/api/valuations/val-123/working-capital/benchmarks?industry=tech');

      expect(response.status).toBe(200);
      expect(response.body.industry).toBe('tech');
      expect(response.body.benchmarks).toBeDefined();
      expect(response.body.description).toBeDefined();
    });

    test('should return all benchmarks for unknown industry', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      const app = createTestApp();

      const response = await request(app)
        .get('/api/valuations/val-123/working-capital/benchmarks?industry=unknown');

      expect(response.status).toBe(200);
      expect(response.body.allBenchmarks).toBeDefined();
    });

    test('should return 404 for non-existent valuation', async () => {
      db.get.mockResolvedValue(null);
      const app = createTestApp();

      const response = await request(app)
        .get('/api/valuations/nonexistent/working-capital/benchmarks');

      expect(response.status).toBe(404);
    });

    test('should handle database error', async () => {
      db.get.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .get('/api/valuations/val-123/working-capital/benchmarks');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to retrieve benchmarks');
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero values', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/working-capital/calculate')
        .send({ ...validInputData, inventory: 0 });

      expect(response.status).toBe(200);
    });

    test('should handle very large values', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/valuations/val-123/working-capital/calculate')
        .send({ ...validInputData, annualRevenue: 1000000000000 });

      expect(response.status).toBe(200);
    });

    test('should handle case-insensitive industry', async () => {
      db.get.mockResolvedValue({ id: 'val-123', user_id: 'user-123' });
      const app = createTestApp();

      const response = await request(app)
        .get('/api/valuations/val-123/working-capital/benchmarks?industry=TECH');

      expect(response.status).toBe(200);
      expect(response.body.industry).toBe('TECH');
    });
  });
});
