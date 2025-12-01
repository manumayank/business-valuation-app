/**
 * Integration Tests for VAC (Value Acceleration Calculator) Routes
 * Tests calculation endpoints for business valuation
 */

const express = require('express');
const request = require('supertest');
const vacRoutes = require('./vacRoutes');

// Mock VAC engine
jest.mock('../services/vacEngine', () => ({
  calculateVAC: jest.fn((data) => ({
    isValid: true,
    riskScore: { score: 65, grade: 'B' },
    ebitda: { value: 500000, adjustments: [] },
    currentValue: 2500000,
    potentialValue: 4000000
  })),
  calculateRiskScore: jest.fn(() => ({
    score: 65,
    grade: 'B',
    factors: []
  })),
  calculateEBITDA: jest.fn((data) => ({
    isValid: true,
    value: data.revenue * 0.15,
    adjustments: []
  })),
  selectMultiple: jest.fn(() => ({
    isValid: true,
    multipleUsed: 5,
    source: 'common'
  })),
  calculateCurrentValue: jest.fn((ebitda, multiple) => ({
    isValid: true,
    ebitda,
    multiple,
    currentValue: ebitda * multiple
  })),
  calculateValueAcceleration: jest.fn(() => ({
    sizeLever: { impact: 200000 },
    efficiencyLever: { impact: 150000 },
    multipleLever: { impact: 300000 }
  })),
  calculateProbabilityDistribution: jest.fn(() => ({
    low: 2000000,
    medium: 3000000,
    high: 4000000
  })),
  calculateWealthGap: jest.fn(() => ({
    currentWealth: 2500000,
    targetWealth: 5000000,
    gap: 2500000
  })),
  COMMON_MULTIPLES: {
    small: 3,
    medium: 5,
    large: 7
  },
  RISK_CATEGORIES: {
    A: 'Low Risk',
    B: 'Moderate Risk',
    C: 'High Risk'
  }
}));

// Mock NAICS service
jest.mock('../services/naicsService', () => ({
  searchByTitle: jest.fn((query) => [
    { code: '541511', title: 'Custom Computer Programming Services' },
    { code: '541512', title: 'Computer Systems Design Services' }
  ]),
  getStats: jest.fn(() => ({
    totalIndustries: 1000,
    sectors: 20
  })),
  getByCode: jest.fn((code) => ({
    code,
    title: 'Custom Computer Programming Services',
    sector: '54'
  })),
  getMultipleForCode: jest.fn((code) => ({
    multiple: 5.5,
    range: { low: 4, high: 7 },
    name: 'Technology'
  })),
  getSectorMultiples: jest.fn(() => ({
    '54': { multiple: 5.5, name: 'Professional Services' },
    '44': { multiple: 3.5, name: 'Retail' }
  })),
  getBySector: jest.fn(() => [
    { code: '541511', title: 'Programming' },
    { code: '541512', title: 'Systems Design' }
  ])
}));

const {
  calculateVAC,
  calculateEBITDA,
  selectMultiple,
  calculateCurrentValue
} = require('../services/vacEngine');
const naicsService = require('../services/naicsService');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/vac', vacRoutes);
  return app;
};

describe('VAC Routes', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('POST /api/vac/calculate', () => {
    test('should calculate full VAC successfully', async () => {
      const app = createTestApp();

      const response = await request(app)
        .post('/api/vac/calculate')
        .send({ revenue: 2000000, ebitdaMargin: 0.15 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.riskScore).toBeDefined();
      expect(response.body.data.currentValue).toBeDefined();
    });

    test('should return error for invalid data', async () => {
      calculateVAC.mockReturnValueOnce({
        isValid: false,
        error: 'Invalid data provided',
        riskScore: null,
        ebitda: null
      });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/vac/calculate')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('should handle calculation error', async () => {
      calculateVAC.mockImplementationOnce(() => {
        throw new Error('Calculation failed');
      });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/vac/calculate')
        .send({ revenue: 2000000 });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/vac/risk-score', () => {
    test('should calculate risk score', async () => {
      const app = createTestApp();

      const response = await request(app)
        .post('/api/vac/risk-score')
        .send({ customerConcentration: 0.3 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.score).toBeDefined();
      expect(response.body.data.grade).toBeDefined();
    });

    test('should handle error', async () => {
      const { calculateRiskScore } = require('../services/vacEngine');
      calculateRiskScore.mockImplementationOnce(() => {
        throw new Error('Risk calculation failed');
      });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/vac/risk-score')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/vac/ebitda', () => {
    test('should calculate EBITDA', async () => {
      const app = createTestApp();

      const response = await request(app)
        .post('/api/vac/ebitda')
        .send({ revenue: 2000000, expenses: 1700000 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test('should return error for invalid EBITDA', async () => {
      calculateEBITDA.mockReturnValueOnce({
        isValid: false,
        error: 'Invalid financial data'
      });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/vac/ebitda')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should handle error', async () => {
      calculateEBITDA.mockImplementationOnce(() => {
        throw new Error('EBITDA calculation failed');
      });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/vac/ebitda')
        .send({ revenue: 2000000 });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/vac/valuation', () => {
    test('should calculate quick valuation', async () => {
      const app = createTestApp();

      const response = await request(app)
        .post('/api/vac/valuation')
        .send({ ebitda: 500000, businessSize: 'medium' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.currentValue).toBeDefined();
    });

    test('should return error for invalid multiple', async () => {
      selectMultiple.mockReturnValueOnce({
        isValid: false,
        error: 'Invalid multiple type'
      });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/vac/valuation')
        .send({ ebitda: 500000 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should return error for invalid value calculation', async () => {
      calculateCurrentValue.mockReturnValueOnce({
        isValid: false,
        error: 'Invalid value'
      });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/vac/valuation')
        .send({ ebitda: 500000 });

      expect(response.status).toBe(400);
    });

    test('should handle error', async () => {
      selectMultiple.mockImplementationOnce(() => {
        throw new Error('Valuation failed');
      });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/vac/valuation')
        .send({ ebitda: 500000 });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/vac/value-acceleration', () => {
    test('should calculate value acceleration', async () => {
      const app = createTestApp();

      const response = await request(app)
        .post('/api/vac/value-acceleration')
        .send({ currentValue: 2500000 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sizeLever).toBeDefined();
    });

    test('should handle error', async () => {
      const { calculateValueAcceleration } = require('../services/vacEngine');
      calculateValueAcceleration.mockImplementationOnce(() => {
        throw new Error('Acceleration calc failed');
      });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/vac/value-acceleration')
        .send({});

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/vac/probability', () => {
    test('should calculate probability distribution', async () => {
      const app = createTestApp();

      const response = await request(app)
        .post('/api/vac/probability')
        .send({ currentValue: 2500000 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.low).toBeDefined();
      expect(response.body.data.medium).toBeDefined();
      expect(response.body.data.high).toBeDefined();
    });

    test('should handle error', async () => {
      const { calculateProbabilityDistribution } = require('../services/vacEngine');
      calculateProbabilityDistribution.mockImplementationOnce(() => {
        throw new Error('Probability calc failed');
      });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/vac/probability')
        .send({});

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/vac/wealth-gap', () => {
    test('should calculate wealth gap', async () => {
      const app = createTestApp();

      const response = await request(app)
        .post('/api/vac/wealth-gap')
        .send({ currentWealth: 2500000, targetWealth: 5000000 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.gap).toBeDefined();
    });

    test('should handle error', async () => {
      const { calculateWealthGap } = require('../services/vacEngine');
      calculateWealthGap.mockImplementationOnce(() => {
        throw new Error('Wealth gap calc failed');
      });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/vac/wealth-gap')
        .send({});

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/vac/multiples', () => {
    test('should return common multiples', async () => {
      const app = createTestApp();

      const response = await request(app)
        .get('/api/vac/multiples');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.small).toBe(3);
      expect(response.body.data.medium).toBe(5);
    });
  });

  describe('GET /api/vac/risk-categories', () => {
    test('should return risk categories', async () => {
      const app = createTestApp();

      const response = await request(app)
        .get('/api/vac/risk-categories');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/vac/industries', () => {
    test('should search industries with query', async () => {
      const app = createTestApp();

      const response = await request(app)
        .get('/api/vac/industries?q=computer');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBeDefined();
    });

    test('should return stats without query', async () => {
      const app = createTestApp();

      const response = await request(app)
        .get('/api/vac/industries');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
    });

    test('should handle search error', async () => {
      naicsService.searchByTitle.mockImplementationOnce(() => {
        throw new Error('Search failed');
      });
      const app = createTestApp();

      const response = await request(app)
        .get('/api/vac/industries?q=test');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/vac/industries/:code', () => {
    test('should get industry by code', async () => {
      const app = createTestApp();

      const response = await request(app)
        .get('/api/vac/industries/541511');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe('541511');
      expect(response.body.data.multiple).toBeDefined();
    });

    test('should return 404 for unknown code', async () => {
      naicsService.getByCode.mockReturnValueOnce(null);
      const app = createTestApp();

      const response = await request(app)
        .get('/api/vac/industries/999999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should handle error', async () => {
      naicsService.getByCode.mockImplementationOnce(() => {
        throw new Error('Lookup failed');
      });
      const app = createTestApp();

      const response = await request(app)
        .get('/api/vac/industries/541511');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/vac/industry-multiples', () => {
    test('should return all sector multiples', async () => {
      const app = createTestApp();

      const response = await request(app)
        .get('/api/vac/industry-multiples');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test('should handle error', async () => {
      naicsService.getSectorMultiples.mockImplementationOnce(() => {
        throw new Error('Failed');
      });
      const app = createTestApp();

      const response = await request(app)
        .get('/api/vac/industry-multiples');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/vac/sectors/:sector', () => {
    test('should get industries in sector', async () => {
      const app = createTestApp();

      const response = await request(app)
        .get('/api/vac/sectors/54');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sector).toBe('54');
      expect(response.body.data.industries).toBeDefined();
    });

    test('should handle error', async () => {
      naicsService.getBySector.mockImplementationOnce(() => {
        throw new Error('Failed');
      });
      const app = createTestApp();

      const response = await request(app)
        .get('/api/vac/sectors/54');

      expect(response.status).toBe(500);
    });
  });
});
