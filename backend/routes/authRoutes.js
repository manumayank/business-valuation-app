/**
 * Authentication Routes
 *
 * POST   /api/auth/register - Create new account
 * POST   /api/auth/login - Login with credentials
 * POST   /api/auth/refresh - Refresh JWT token
 * POST   /api/auth/logout - Logout
 * POST   /api/auth/reset-password - Request password reset
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authService = require('../services/authService');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * POST /api/auth/register
 * Create a new user account and return JWT tokens
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, company } = req.body;

    // Validation
    if (!email || !password || !fullName) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['email', 'password', 'fullName']
      });
    }

    // Validate email format
    if (!authService.validateEmail(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Validate password strength
    const passwordValidation = authService.validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Password does not meet security requirements',
        details: passwordValidation.errors
      });
    }

    // Get database functions from req.db (injected by server)
    const { run, get } = req.db;

    // Check if email already exists
    const existingUser = await get(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser) {
      return res.status(409).json({
        error: 'Email already registered',
        message: 'This email address is already in use'
      });
    }

    // Hash password
    const passwordHash = await authService.hashPassword(password);

    // Create user
    const userId = uuidv4();
    await run(
      `INSERT INTO users (id, email, password_hash, full_name, company, verified, status)
       VALUES (?, ?, ?, ?, ?, 1, 'active')`,
      [userId, email, passwordHash, fullName, company || null]
    );

    // Create organization for user
    const organizationId = uuidv4();
    await run(
      `INSERT INTO organizations (id, name, owner_id, status)
       VALUES (?, ?, ?, 'active')`,
      [organizationId, `${fullName}'s Organization`, userId]
    );

    // Add user as organization owner
    await run(
      `INSERT INTO organization_members (organization_id, user_id, role, status)
       VALUES (?, ?, 'owner', 'active')`,
      [organizationId, userId]
    );

    // Create user preferences
    await run(
      `INSERT INTO user_preferences (user_id, theme, currency, notifications_enabled)
       VALUES (?, 'light', 'USD', 1)`,
      [userId]
    );

    // Generate tokens
    const tokens = authService.generateAuthTokens(userId, email, organizationId);

    // Log action
    await run(
      `INSERT INTO audit_logs (user_id, organization_id, action, entity_type, status)
       VALUES (?, ?, 'user_registered', 'user', 'success')`,
      [userId, organizationId]
    ).catch(() => {}); // Ignore errors in audit logging

    // Return success
    return res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: userId,
        email,
        fullName,
        company,
        organizationId
      },
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({
      error: 'Registration failed',
      message: err.message
    });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password, return JWT tokens
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        required: ['email', 'password']
      });
    }

    const { get } = req.db;

    // Find user by email
    const user = await get(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(403).json({
        error: 'Account inactive',
        message: 'This account is not active'
      });
    }

    // Compare password
    const passwordMatch = await authService.comparePassword(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Get user's primary organization
    const org = await get(
      'SELECT id FROM organizations WHERE owner_id = ? LIMIT 1',
      [user.id]
    );

    const organizationId = org ? org.id : null;

    // Generate tokens
    const tokens = authService.generateAuthTokens(
      user.id,
      user.email,
      organizationId
    );

    // Log action
    const { run } = req.db;
    await run(
      `INSERT INTO audit_logs (user_id, organization_id, action, entity_type, status)
       VALUES (?, ?, 'user_login', 'user', 'success')`,
      [user.id, organizationId]
    ).catch(() => {}); // Ignore errors in audit logging

    // Return success
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        organizationId
      },
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      error: 'Login failed',
      message: err.message
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = authService.verifyToken(refreshToken);
    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({
        error: 'Invalid refresh token'
      });
    }

    const { get } = req.db;

    // Get user from database
    const user = await get(
      'SELECT id, email FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({
        error: 'User not found'
      });
    }

    // Get user's organization
    const org = await get(
      'SELECT id FROM organizations WHERE owner_id = ? LIMIT 1',
      [user.id]
    );

    // Generate new access token
    const newToken = authService.generateToken({
      userId: user.id,
      email: user.email,
      organizationId: org ? org.id : null,
      type: 'access'
    });

    return res.status(200).json({
      message: 'Token refreshed',
      token: newToken,
      expiresIn: 86400
    });
  } catch (err) {
    console.error('Refresh error:', err);
    return res.status(500).json({
      error: 'Token refresh failed'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token deletion on frontend, server just confirms)
 */
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const { run } = req.db;

    // Log logout action
    await run(
      `INSERT INTO audit_logs (user_id, action, entity_type, status)
       VALUES (?, 'user_logout', 'user', 'success')`,
      [req.user.userId]
    ).catch(() => {});

    return res.status(200).json({
      message: 'Logout successful'
    });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({
      error: 'Logout failed'
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Request password reset (sends email in production)
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email required'
      });
    }

    const { get, run } = req.db;

    // Find user
    const user = await get(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      // Don't reveal if email exists (security best practice)
      return res.status(200).json({
        message: 'If email exists, reset link will be sent'
      });
    }

    // Generate reset token
    const resetToken = authService.generateSecureToken();

    // In production, send email with reset link
    // For now, just log it
    console.log(`Reset token for ${email}: ${resetToken}`);

    return res.status(200).json({
      message: 'Password reset instructions sent',
      // In development only, return token for testing:
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });
  } catch (err) {
    console.error('Password reset error:', err);
    return res.status(500).json({
      error: 'Password reset failed'
    });
  }
});

module.exports = router;
