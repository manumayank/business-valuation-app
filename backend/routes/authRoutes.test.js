/**
 * Integration Tests for Authentication Routes
 * Tests the auth API endpoints: register, login, refresh, logout, reset-password
 */

const express = require('express');
const request = require('supertest');
const authRoutes = require('./authRoutes');

// Mock the database
jest.mock('../db', () => ({
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn()
}));

// Mock auth service
jest.mock('../services/authService', () => ({
  hashPassword: jest.fn(() => Promise.resolve('hashed_password_123')),
  comparePassword: jest.fn(() => Promise.resolve(true)),
  validateEmail: jest.fn((email) => email && email.includes('@') && email.includes('.')),
  validatePasswordStrength: jest.fn((password) => {
    if (!password || password.length < 8) {
      return { valid: false, errors: ['Password must be at least 8 characters'] };
    }
    return { valid: true, errors: [] };
  }),
  generateAuthTokens: jest.fn((userId, email, orgId) => ({
    token: 'mock_access_token_' + userId,
    refreshToken: 'mock_refresh_token_' + userId,
    expiresIn: 86400
  })),
  generateToken: jest.fn(() => 'mock_new_access_token'),
  verifyToken: jest.fn((token) => {
    if (token === 'valid_refresh_token') {
      return { userId: 'user-123', email: 'test@example.com', type: 'refresh' };
    }
    if (token === 'invalid_type_token') {
      return { userId: 'user-123', email: 'test@example.com', type: 'access' };
    }
    return null;
  }),
  generateSecureToken: jest.fn(() => 'secure_reset_token_abc123')
}));

// Mock auth middleware for logout (which requires auth)
jest.mock('../middleware/authMiddleware', () => ({
  requireAuth: (req, res, next) => {
    req.user = { userId: 'user-123', email: 'test@example.com' };
    next();
  }
}));

const db = require('../db');
const authService = require('../services/authService');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  // Inject mock db
  app.use((req, res, next) => {
    req.db = { run: db.run, get: db.get, all: db.all };
    next();
  });
  app.use('/api/auth', authRoutes);
  return app;
};

describe('Auth Routes - Authentication API', () => {
  let consoleErrorSpy;
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('POST /api/auth/register', () => {
    const validRegistration = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      fullName: 'John Doe',
      company: 'Acme Corp'
    };

    test('should register a new user successfully', async () => {
      db.get.mockResolvedValue(null); // No existing user
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistration);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Account created successfully');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('newuser@example.com');
      expect(response.body.user.fullName).toBe('John Doe');
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.expiresIn).toBe(86400);
    });

    test('should reject registration with missing email', async () => {
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/register')
        .send({ password: 'SecurePass123!', fullName: 'John Doe' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
    });

    test('should reject registration with missing password', async () => {
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', fullName: 'John Doe' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
    });

    test('should reject registration with missing fullName', async () => {
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'SecurePass123!' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
    });

    test('should reject registration with invalid email format', async () => {
      authService.validateEmail.mockReturnValueOnce(false);
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegistration, email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid email format');
    });

    test('should reject registration with weak password', async () => {
      authService.validatePasswordStrength.mockReturnValueOnce({
        valid: false,
        errors: ['Password must be at least 8 characters', 'Password must contain uppercase']
      });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegistration, password: 'weak' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Password does not meet security requirements');
      expect(response.body.details).toBeDefined();
    });

    test('should reject registration with existing email', async () => {
      db.get.mockResolvedValue({ id: 'existing-user-id' }); // Existing user found
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistration);

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Email already registered');
    });

    test('should create organization for new user', async () => {
      db.get.mockResolvedValue(null);
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      await request(app)
        .post('/api/auth/register')
        .send(validRegistration);

      // Check that organization was created (second db.run call)
      expect(db.run).toHaveBeenCalledTimes(5); // user, org, member, prefs, audit log
      expect(db.run.mock.calls[1][0]).toContain('INSERT INTO organizations');
    });

    test('should handle registration without company field', async () => {
      db.get.mockResolvedValue(null);
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'SecurePass123!', fullName: 'John Doe' });

      expect(response.status).toBe(201);
      expect(response.body.user.company).toBeUndefined();
    });

    test('should handle database error during registration', async () => {
      db.get.mockResolvedValue(null);
      db.run.mockRejectedValue(new Error('Database connection failed'));
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistration);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Registration failed');
    });
  });

  describe('POST /api/auth/login', () => {
    const validCredentials = {
      email: 'user@example.com',
      password: 'SecurePass123!'
    };

    const existingUser = {
      id: 'user-123',
      email: 'user@example.com',
      password_hash: 'hashed_password',
      full_name: 'John Doe',
      status: 'active'
    };

    test('should login user successfully', async () => {
      db.get
        .mockResolvedValueOnce(existingUser) // Find user
        .mockResolvedValueOnce({ id: 'org-123' }); // Find organization
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/login')
        .send(validCredentials);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe('user-123');
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    test('should reject login with missing email', async () => {
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'SecurePass123!' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing credentials');
    });

    test('should reject login with missing password', async () => {
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing credentials');
    });

    test('should reject login with non-existent user', async () => {
      db.get.mockResolvedValue(null); // User not found
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/login')
        .send(validCredentials);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should reject login with inactive account', async () => {
      db.get.mockResolvedValue({ ...existingUser, status: 'inactive' });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/login')
        .send(validCredentials);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Account inactive');
    });

    test('should reject login with suspended account', async () => {
      db.get.mockResolvedValue({ ...existingUser, status: 'suspended' });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/login')
        .send(validCredentials);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Account inactive');
    });

    test('should reject login with wrong password', async () => {
      db.get.mockResolvedValue(existingUser);
      authService.comparePassword.mockResolvedValueOnce(false);
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/login')
        .send(validCredentials);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should handle user without organization', async () => {
      db.get
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(null); // No organization
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/login')
        .send(validCredentials);

      expect(response.status).toBe(200);
      expect(response.body.user.organizationId).toBeNull();
    });

    test('should handle database error during login', async () => {
      db.get.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/login')
        .send(validCredentials);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Login failed');
    });
  });

  describe('POST /api/auth/refresh', () => {
    test('should refresh access token with valid refresh token', async () => {
      db.get
        .mockResolvedValueOnce({ id: 'user-123', email: 'test@example.com' })
        .mockResolvedValueOnce({ id: 'org-123' });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'valid_refresh_token' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Token refreshed');
      expect(response.body.token).toBeDefined();
      expect(response.body.expiresIn).toBe(86400);
    });

    test('should reject refresh without token', async () => {
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Refresh token required');
    });

    test('should reject refresh with invalid token', async () => {
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid_token' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid refresh token');
    });

    test('should reject refresh with access token (wrong type)', async () => {
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid_type_token' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid refresh token');
    });

    test('should reject refresh if user not found', async () => {
      db.get.mockResolvedValue(null); // User not found
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'valid_refresh_token' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('User not found');
    });

    test('should handle user without organization during refresh', async () => {
      db.get
        .mockResolvedValueOnce({ id: 'user-123', email: 'test@example.com' })
        .mockResolvedValueOnce(null); // No organization
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'valid_refresh_token' });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });

    test('should handle database error during refresh', async () => {
      db.get.mockRejectedValue(new Error('Database error'));
      authService.verifyToken.mockReturnValueOnce({ userId: 'user-123', type: 'refresh' });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'valid_refresh_token' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Token refresh failed');
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should logout successfully', async () => {
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logout successful');
    });

    test('should log logout action', async () => {
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid_token');

      expect(db.run).toHaveBeenCalled();
      expect(db.run.mock.calls[0][0]).toContain('INSERT INTO audit_logs');
      expect(db.run.mock.calls[0][0]).toContain('user_logout');
    });

    test('should handle database error during logout gracefully', async () => {
      db.run.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid_token');

      // Logout should still succeed even if audit log fails
      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    test('should request password reset for existing user', async () => {
      db.get.mockResolvedValue({ id: 'user-123' });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'user@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password reset instructions sent');
    });

    test('should return success for non-existent email (security)', async () => {
      db.get.mockResolvedValue(null); // User not found
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'nonexistent@example.com' });

      // Should not reveal if email exists
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('If email exists');
    });

    test('should reject request without email', async () => {
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email required');
    });

    test('should generate reset token for existing user', async () => {
      db.get.mockResolvedValue({ id: 'user-123' });
      const app = createTestApp();

      await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'user@example.com' });

      expect(authService.generateSecureToken).toHaveBeenCalled();
    });

    test('should handle database error during password reset', async () => {
      db.get.mockRejectedValue(new Error('Database error'));
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'user@example.com' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Password reset failed');
    });
  });

  describe('Security Tests', () => {
    test('should not return password hash in registration response', async () => {
      db.get.mockResolvedValue(null);
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!',
          fullName: 'Test User'
        });

      expect(response.body.user.password).toBeUndefined();
      expect(response.body.user.password_hash).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toContain('password_hash');
    });

    test('should not return password hash in login response', async () => {
      db.get
        .mockResolvedValueOnce({
          id: 'user-123',
          email: 'test@example.com',
          password_hash: 'hashed_password',
          full_name: 'Test User',
          status: 'active'
        })
        .mockResolvedValueOnce({ id: 'org-123' });
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'SecurePass123!' });

      expect(response.body.user.password).toBeUndefined();
      expect(response.body.user.password_hash).toBeUndefined();
    });

    test('should use same error message for wrong email and wrong password', async () => {
      const app = createTestApp();

      // Non-existent user
      db.get.mockResolvedValue(null);
      const response1 = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@example.com', password: 'password' });

      // Wrong password
      db.get.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hash',
        status: 'active'
      });
      authService.comparePassword.mockResolvedValueOnce(false);
      const response2 = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' });

      // Both should have same error message (prevent enumeration)
      expect(response1.body.error).toBe(response2.body.error);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty request body', async () => {
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(400);
    });

    test('should handle null values in request', async () => {
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: null, password: null, fullName: null });

      expect(response.status).toBe(400);
    });

    test('should handle very long email', async () => {
      authService.validateEmail.mockReturnValueOnce(false);
      const app = createTestApp();

      const longEmail = 'a'.repeat(500) + '@example.com';
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: longEmail, password: 'SecurePass123!', fullName: 'Test' });

      expect(response.status).toBe(400);
    });

    test('should handle special characters in fullName', async () => {
      db.get.mockResolvedValue(null);
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!',
          fullName: "O'Brien-Smith, Jr."
        });

      expect(response.status).toBe(201);
      expect(response.body.user.fullName).toBe("O'Brien-Smith, Jr.");
    });

    test('should handle unicode characters in company name', async () => {
      db.get.mockResolvedValue(null);
      db.run.mockResolvedValue({ lastID: 1 });
      const app = createTestApp();

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!',
          fullName: 'Test User',
          company: '株式会社テスト'
        });

      expect(response.status).toBe(201);
    });
  });
});
