/**
 * Tests for Authentication Middleware
 * Tests requireAuth, optionalAuth, requireRole, requireBusinessOwnership, etc.
 */

const express = require('express');
const request = require('supertest');

// Mock auth service
jest.mock('../services/authService', () => ({
  extractTokenFromHeader: jest.fn((header) => {
    if (!header) return null;
    if (!header.startsWith('Bearer ')) return null;
    return header.substring(7);
  }),
  verifyToken: jest.fn((token) => {
    if (token === 'valid_access_token') {
      return { userId: 'user-123', email: 'test@example.com', type: 'access' };
    }
    if (token === 'valid_refresh_token') {
      return { userId: 'user-123', email: 'test@example.com', type: 'refresh' };
    }
    if (token === 'expired_token') {
      return null;
    }
    return null;
  })
}));

// Mock database
jest.mock('../db', () => ({
  get: jest.fn(),
  all: jest.fn(),
  run: jest.fn()
}));

const {
  requireAuth,
  optionalAuth,
  requireRole,
  requireBusinessOwnership,
  requireEngagementAccess,
  notFound,
  errorHandler
} = require('./authMiddleware');

const authService = require('../services/authService');
const db = require('../db');

// Create test app with middleware
const createTestApp = (middleware) => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.db = { get: db.get, all: db.all, run: db.run };
    next();
  });
  app.get('/test', middleware, (req, res) => {
    res.json({ success: true, user: req.user, userRole: req.userRole });
  });
  app.get('/test/:businessId', middleware, (req, res) => {
    res.json({ success: true, business: req.business });
  });
  app.get('/test/engagement/:engagementId', middleware, (req, res) => {
    res.json({ success: true, engagement: req.engagement });
  });
  return app;
};

describe('Auth Middleware', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('requireAuth', () => {
    test('should pass with valid access token', async () => {
      const app = createTestApp(requireAuth);

      const response = await request(app)
        .get('/test')
        .set('Authorization', 'Bearer valid_access_token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.userId).toBe('user-123');
    });

    test('should reject request without token', async () => {
      const app = createTestApp(requireAuth);

      const response = await request(app)
        .get('/test');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    test('should reject request with invalid token', async () => {
      const app = createTestApp(requireAuth);

      const response = await request(app)
        .get('/test')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });

    test('should reject request with expired token', async () => {
      const app = createTestApp(requireAuth);

      const response = await request(app)
        .get('/test')
        .set('Authorization', 'Bearer expired_token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });

    test('should reject refresh token used as access token', async () => {
      const app = createTestApp(requireAuth);

      const response = await request(app)
        .get('/test')
        .set('Authorization', 'Bearer valid_refresh_token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token type');
    });

    test('should reject malformed authorization header', async () => {
      const app = createTestApp(requireAuth);

      const response = await request(app)
        .get('/test')
        .set('Authorization', 'Basic sometoken');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    test('should handle internal errors gracefully', async () => {
      authService.extractTokenFromHeader.mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });
      const app = createTestApp(requireAuth);

      const response = await request(app)
        .get('/test')
        .set('Authorization', 'Bearer valid_access_token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Authentication error');
    });
  });

  describe('optionalAuth', () => {
    test('should pass without token', async () => {
      const app = createTestApp(optionalAuth);

      const response = await request(app)
        .get('/test');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeUndefined();
    });

    test('should attach user with valid token', async () => {
      const app = createTestApp(optionalAuth);

      const response = await request(app)
        .get('/test')
        .set('Authorization', 'Bearer valid_access_token');

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.userId).toBe('user-123');
    });

    test('should pass with invalid token (optional)', async () => {
      const app = createTestApp(optionalAuth);

      const response = await request(app)
        .get('/test')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(200);
      expect(response.body.user).toBeUndefined();
    });

    test('should not attach user for refresh token', async () => {
      const app = createTestApp(optionalAuth);

      const response = await request(app)
        .get('/test')
        .set('Authorization', 'Bearer valid_refresh_token');

      expect(response.status).toBe(200);
      expect(response.body.user).toBeUndefined();
    });

    test('should handle errors gracefully', async () => {
      authService.extractTokenFromHeader.mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });
      const app = createTestApp(optionalAuth);

      const response = await request(app)
        .get('/test')
        .set('Authorization', 'Bearer valid_access_token');

      expect(response.status).toBe(200);
      expect(response.body.user).toBeUndefined();
    });
  });

  describe('requireRole', () => {
    test('should pass when user has required role', async () => {
      db.get.mockResolvedValue({ role: 'admin' });
      const app = express();
      app.use(express.json());
      app.use((req, res, next) => {
        req.db = { get: db.get };
        req.user = { userId: 'user-123' };
        next();
      });
      app.get('/test', requireRole('admin'), (req, res) => {
        res.json({ success: true, userRole: req.userRole });
      });

      const response = await request(app)
        .get('/test');

      expect(response.status).toBe(200);
      expect(response.body.userRole).toBe('admin');
    });

    test('should reject when user lacks required role', async () => {
      db.get.mockResolvedValue(null);
      const app = express();
      app.use(express.json());
      app.use((req, res, next) => {
        req.db = { get: db.get };
        req.user = { userId: 'user-123' };
        next();
      });
      app.get('/test', requireRole('admin'), (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    test('should reject when user is not authenticated', async () => {
      const app = express();
      app.use(express.json());
      app.use((req, res, next) => {
        req.db = { get: db.get };
        // No req.user
        next();
      });
      app.get('/test', requireRole('admin'), (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    test('should accept array of roles', async () => {
      db.get.mockResolvedValue({ role: 'editor' });
      const app = express();
      app.use(express.json());
      app.use((req, res, next) => {
        req.db = { get: db.get };
        req.user = { userId: 'user-123' };
        next();
      });
      app.get('/test', requireRole(['admin', 'editor']), (req, res) => {
        res.json({ success: true, userRole: req.userRole });
      });

      const response = await request(app)
        .get('/test');

      expect(response.status).toBe(200);
    });

    test('should handle database error', async () => {
      db.get.mockRejectedValue(new Error('Database error'));
      const app = express();
      app.use(express.json());
      app.use((req, res, next) => {
        req.db = { get: db.get };
        req.user = { userId: 'user-123' };
        next();
      });
      app.get('/test', requireRole('admin'), (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Authorization error');
    });
  });

  describe('requireBusinessOwnership', () => {
    test('should pass when user owns business', async () => {
      db.get.mockResolvedValue({
        id: 'biz-123',
        name: 'Test Business',
        owner_id: 'user-123'
      });
      const app = express();
      app.use(express.json());
      app.use((req, res, next) => {
        req.db = { get: db.get };
        req.user = { userId: 'user-123' };
        next();
      });
      app.get('/test/:businessId', requireBusinessOwnership, (req, res) => {
        res.json({ success: true, business: req.business });
      });

      const response = await request(app)
        .get('/test/biz-123');

      expect(response.status).toBe(200);
      expect(response.body.business).toBeDefined();
      expect(response.body.business.id).toBe('biz-123');
    });

    test('should reject when user does not own business', async () => {
      db.get.mockResolvedValue(null);
      const app = express();
      app.use(express.json());
      app.use((req, res, next) => {
        req.db = { get: db.get };
        req.user = { userId: 'user-123' };
        next();
      });
      app.get('/test/:businessId', requireBusinessOwnership, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test/biz-999');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
    });

    test('should reject when user is not authenticated', async () => {
      const app = express();
      app.use(express.json());
      app.use((req, res, next) => {
        req.db = { get: db.get };
        next();
      });
      app.get('/test/:businessId', requireBusinessOwnership, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test/biz-123');

      expect(response.status).toBe(401);
    });

    test('should reject when businessId is missing', async () => {
      const app = express();
      app.use(express.json());
      app.use((req, res, next) => {
        req.db = { get: db.get };
        req.user = { userId: 'user-123' };
        req.params = {};
        next();
      });
      app.get('/test', requireBusinessOwnership, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Business ID required');
    });

    test('should handle database error', async () => {
      db.get.mockRejectedValue(new Error('Database error'));
      const app = express();
      app.use(express.json());
      app.use((req, res, next) => {
        req.db = { get: db.get };
        req.user = { userId: 'user-123' };
        next();
      });
      app.get('/test/:businessId', requireBusinessOwnership, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test/biz-123');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Authorization error');
    });
  });

  describe('requireEngagementAccess', () => {
    test('should pass when user has access to engagement', async () => {
      db.get.mockResolvedValue({
        id: 'eng-123',
        business_id: 'biz-123',
        assigned_advisor_id: 'user-123'
      });
      const app = express();
      app.use(express.json());
      app.use((req, res, next) => {
        req.db = { get: db.get };
        req.user = { userId: 'user-123' };
        next();
      });
      app.get('/test/:engagementId', requireEngagementAccess, (req, res) => {
        res.json({ success: true, engagement: req.engagement });
      });

      const response = await request(app)
        .get('/test/eng-123');

      expect(response.status).toBe(200);
      expect(response.body.engagement).toBeDefined();
    });

    test('should reject when user lacks access', async () => {
      db.get.mockResolvedValue(null);
      const app = express();
      app.use(express.json());
      app.use((req, res, next) => {
        req.db = { get: db.get };
        req.user = { userId: 'user-123' };
        next();
      });
      app.get('/test/:engagementId', requireEngagementAccess, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test/eng-999');

      expect(response.status).toBe(403);
    });

    test('should reject when engagementId is missing', async () => {
      const app = express();
      app.use(express.json());
      app.use((req, res, next) => {
        req.db = { get: db.get };
        req.user = { userId: 'user-123' };
        req.params = {};
        next();
      });
      app.get('/test', requireEngagementAccess, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Engagement ID required');
    });
  });

  describe('notFound', () => {
    test('should return 404 with endpoint info', async () => {
      const app = express();
      app.use(notFound);

      const response = await request(app)
        .get('/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not found');
      expect(response.body.message).toContain('GET');
      expect(response.body.message).toContain('/nonexistent');
    });
  });

  describe('errorHandler', () => {
    test('should handle error with status', async () => {
      const app = express();
      app.get('/test', (req, res, next) => {
        const err = new Error('Custom error');
        err.status = 400;
        next(err);
      });
      app.use(errorHandler);

      const response = await request(app)
        .get('/test');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Custom error');
    });

    test('should default to 500 for errors without status', async () => {
      const app = express();
      app.get('/test', (req, res, next) => {
        next(new Error('Unexpected error'));
      });
      app.use(errorHandler);

      const response = await request(app)
        .get('/test');

      expect(response.status).toBe(500);
    });
  });
});
