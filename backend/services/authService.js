/**
 * Authentication Service
 *
 * Handles all authentication logic:
 * - Password hashing with bcrypt
 * - JWT token generation and validation
 * - Password strength validation
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Get JWT secret from environment or use default (for dev only!)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_EXPIRE = '24h';
const REFRESH_TOKEN_EXPIRE = '7d';

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Password hash
 * @returns {Promise<boolean>} - True if match
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 *
 * @param {string} password - Password to validate
 * @returns {object} - { valid: boolean, errors: string[] }
 */
function validatePasswordStrength(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*...)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate JWT token
 * @param {object} payload - Token payload
 * @param {string} expiresIn - Expiration time (default: 24h)
 * @returns {string} - JWT token
 */
function generateToken(payload, expiresIn = JWT_EXPIRE) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload or null if invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Decode token without verification (use with caution)
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload or null if invalid
 */
function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (err) {
    return null;
  }
}

/**
 * Generate authentication tokens (access + refresh)
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {string} organizationId - Organization ID
 * @returns {object} - { token, refreshToken }
 */
function generateAuthTokens(userId, email, organizationId = null) {
  const accessToken = generateToken({
    userId,
    email,
    organizationId,
    type: 'access'
  }, JWT_EXPIRE);

  const refreshToken = generateToken({
    userId,
    type: 'refresh'
  }, REFRESH_TOKEN_EXPIRE);

  return {
    token: accessToken,
    refreshToken,
    expiresIn: 86400 // 24 hours in seconds
  };
}

/**
 * Generate password reset token
 * Valid for 15 minutes only
 * @param {string} userId - User ID
 * @returns {string} - Reset token
 */
function generateResetToken(userId) {
  return generateToken({
    userId,
    type: 'reset',
    nonce: uuidv4()
  }, '15m');
}

/**
 * Extract token from Authorization header
 * Expected format: "Bearer <token>"
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} - Token or null
 */
function extractTokenFromHeader(authHeader) {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate secure random token (for sharing, password reset, etc.)
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} - Hex-encoded random token
 */
function generateSecureToken(length = 32) {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
}

module.exports = {
  // Password management
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  validateEmail,

  // Token management
  generateToken,
  verifyToken,
  decodeToken,
  generateAuthTokens,
  generateResetToken,
  generateSecureToken,

  // Utilities
  extractTokenFromHeader,

  // Constants
  JWT_SECRET,
  JWT_EXPIRE,
  REFRESH_TOKEN_EXPIRE
};
