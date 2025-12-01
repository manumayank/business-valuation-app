/**
 * Comprehensive Unit Tests for Authentication Service
 * Tests password hashing, token generation, validation, and security
 * Run with: npm test
 */

const {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  validateEmail,
  generateToken,
  verifyToken,
  decodeToken,
  generateAuthTokens,
  generateResetToken,
  extractTokenFromHeader,
  generateSecureToken,
  JWT_SECRET,
  JWT_EXPIRE,
  REFRESH_TOKEN_EXPIRE
} = require('./authService');

// ========== PASSWORD HASHING TESTS ==========

describe('Password Hashing', () => {
  test('hashes password successfully', async () => {
    const password = 'TestPass123!';
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash).not.toBe(password); // Should not be plain text
    expect(hash.length).toBeGreaterThan(0);
  });

  test('produces different hashes for same password', async () => {
    const password = 'TestPass123!';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2); // Should be different due to salt
  });

  test('compares correct password successfully', async () => {
    const password = 'TestPass123!';
    const hash = await hashPassword(password);
    const isMatch = await comparePassword(password, hash);

    expect(isMatch).toBe(true);
  });

  test('rejects incorrect password', async () => {
    const password = 'TestPass123!';
    const hash = await hashPassword(password);
    const isMatch = await comparePassword('WrongPass456!', hash);

    expect(isMatch).toBe(false);
  });

  test('handles edge case: empty password hash comparison', async () => {
    const hash = await hashPassword('');
    const isMatch = await comparePassword('', hash);

    expect(isMatch).toBe(true);
  });
});

// ========== PASSWORD STRENGTH VALIDATION TESTS ==========

describe('Password Strength Validation', () => {
  test('validates strong password', () => {
    const result = validatePasswordStrength('StrongPass123!');

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('rejects password that is too short', () => {
    const result = validatePasswordStrength('Short1!');

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters long');
  });

  test('rejects password without uppercase letter', () => {
    const result = validatePasswordStrength('lowercase123!');

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
  });

  test('rejects password without lowercase letter', () => {
    const result = validatePasswordStrength('UPPERCASE123!');

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one lowercase letter');
  });

  test('rejects password without number', () => {
    const result = validatePasswordStrength('NoNumbersHere!');

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one number');
  });

  test('rejects password without special character', () => {
    const result = validatePasswordStrength('NoSpecial123');

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Password must contain at least one special character'))).toBe(true);
  });

  test('rejects password with multiple missing requirements', () => {
    const result = validatePasswordStrength('weak');

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });

  test('accepts various special characters', () => {
    const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '-', '+', '=', '[', ']'];

    specialChars.forEach(char => {
      const password = `Strong123${char}`;
      const result = validatePasswordStrength(password);
      expect(result.valid).toBe(true);
    });
  });

  test('password validation returns structured response', () => {
    const result = validatePasswordStrength('TestPass123!');

    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('errors');
    expect(Array.isArray(result.errors)).toBe(true);
  });
});

// ========== EMAIL VALIDATION TESTS ==========

describe('Email Validation', () => {
  test('validates correct email format', () => {
    const validEmails = [
      'user@example.com',
      'test.user@company.co.uk',
      'john+work@domain.org',
      'name_123@test.io'
    ];

    validEmails.forEach(email => {
      expect(validateEmail(email)).toBe(true);
    });
  });

  test('rejects email without @ symbol', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });

  test('rejects email without domain', () => {
    expect(validateEmail('user@')).toBe(false);
  });

  test('rejects email without local part', () => {
    expect(validateEmail('@example.com')).toBe(false);
  });

  test('rejects email without extension', () => {
    expect(validateEmail('user@example')).toBe(false);
  });

  test('rejects email with spaces', () => {
    expect(validateEmail('user @example.com')).toBe(false);
    expect(validateEmail('user@ example.com')).toBe(false);
  });

  test('rejects empty email', () => {
    expect(validateEmail('')).toBe(false);
  });

  test('rejects email with multiple @ symbols', () => {
    expect(validateEmail('user@@example.com')).toBe(false);
  });
});

// ========== TOKEN GENERATION AND VERIFICATION TESTS ==========

describe('Token Generation and Verification', () => {
  test('generates JWT token', () => {
    const payload = { userId: '123', email: 'user@example.com' };
    const token = generateToken(payload);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // JWT format: header.payload.signature
  });

  test('verifies valid token', () => {
    const payload = { userId: '123', email: 'user@example.com' };
    const token = generateToken(payload);
    const decoded = verifyToken(token);

    expect(decoded).toBeDefined();
    expect(decoded.userId).toBe('123');
    expect(decoded.email).toBe('user@example.com');
  });

  test('rejects invalid token', () => {
    const decoded = verifyToken('invalid.token.here');
    expect(decoded).toBeNull();
  });

  test('rejects expired token', async () => {
    const payload = { userId: '123' };
    const expiredToken = generateToken(payload, '0s'); // Expire immediately

    // Wait a moment for token to expire
    await new Promise(resolve => setTimeout(resolve, 100));

    const decoded = verifyToken(expiredToken);
    expect(decoded).toBeNull();
  });

  test('decodes token without verification', () => {
    const payload = { userId: '456', email: 'test@example.com' };
    const token = generateToken(payload);
    const decoded = decodeToken(token);

    expect(decoded).toBeDefined();
    expect(decoded.userId).toBe('456');
    expect(decoded.email).toBe('test@example.com');
  });

  test('generates token with custom expiration', () => {
    const payload = { userId: '789' };
    const token = generateToken(payload, '1h');

    const decoded = verifyToken(token);
    expect(decoded).toBeDefined();
    expect(decoded.userId).toBe('789');
  });
});

// ========== AUTHENTICATION TOKENS GENERATION TESTS ==========

describe('Authentication Tokens Generation', () => {
  test('generates both access and refresh tokens', () => {
    const tokens = generateAuthTokens('user-123', 'user@example.com', 'org-456');

    expect(tokens).toHaveProperty('token');
    expect(tokens).toHaveProperty('refreshToken');
    expect(tokens).toHaveProperty('expiresIn');
    expect(tokens.token).not.toBe(tokens.refreshToken);
  });

  test('access token contains correct payload', () => {
    const userId = 'user-123';
    const email = 'user@example.com';
    const orgId = 'org-456';
    const tokens = generateAuthTokens(userId, email, orgId);

    const decoded = verifyToken(tokens.token);
    expect(decoded.userId).toBe(userId);
    expect(decoded.email).toBe(email);
    expect(decoded.organizationId).toBe(orgId);
    expect(decoded.type).toBe('access');
  });

  test('refresh token contains correct payload', () => {
    const userId = 'user-123';
    const tokens = generateAuthTokens(userId, 'user@example.com', 'org-456');

    const decoded = verifyToken(tokens.refreshToken);
    expect(decoded.userId).toBe(userId);
    expect(decoded.type).toBe('refresh');
  });

  test('expiresIn is returned in seconds', () => {
    const tokens = generateAuthTokens('user-123', 'user@example.com');
    expect(tokens.expiresIn).toBe(86400); // 24 hours in seconds
  });

  test('generates tokens without organization ID', () => {
    const tokens = generateAuthTokens('user-123', 'user@example.com');

    expect(tokens.token).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();

    const decoded = verifyToken(tokens.token);
    expect(decoded.organizationId).toBeNull();
  });
});

// ========== PASSWORD RESET TOKEN TESTS ==========

describe('Password Reset Token', () => {
  test('generates reset token', () => {
    const token = generateResetToken('user-123');

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // JWT format
  });

  test('reset token contains user ID', () => {
    const userId = 'user-123';
    const token = generateResetToken(userId);
    const decoded = verifyToken(token);

    expect(decoded).toBeDefined();
    expect(decoded.userId).toBe(userId);
    expect(decoded.type).toBe('reset');
  });

  test('reset token includes nonce', () => {
    const token = generateResetToken('user-123');
    const decoded = verifyToken(token);

    expect(decoded.nonce).toBeDefined();
    expect(typeof decoded.nonce).toBe('string');
  });

  test('different reset tokens have different nonces', () => {
    const token1 = generateResetToken('user-123');
    const token2 = generateResetToken('user-123');

    const decoded1 = verifyToken(token1);
    const decoded2 = verifyToken(token2);

    expect(decoded1.nonce).not.toBe(decoded2.nonce);
  });
});

// ========== TOKEN EXTRACTION TESTS ==========

describe('Authorization Header Token Extraction', () => {
  test('extracts token from valid Bearer header', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    const header = `Bearer ${token}`;

    const extracted = extractTokenFromHeader(header);
    expect(extracted).toBe(token);
  });

  test('returns null for header without Bearer prefix', () => {
    const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    const extracted = extractTokenFromHeader(header);

    expect(extracted).toBeNull();
  });

  test('returns null for empty header', () => {
    const extracted = extractTokenFromHeader('');
    expect(extracted).toBeNull();
  });

  test('returns null for null header', () => {
    const extracted = extractTokenFromHeader(null);
    expect(extracted).toBeNull();
  });

  test('returns null for malformed Bearer header', () => {
    const header = 'Bearer'; // No token
    const extracted = extractTokenFromHeader(header);

    expect(extracted).toBeNull();
  });

  test('returns null for wrong prefix', () => {
    const header = 'Basic token123';
    const extracted = extractTokenFromHeader(header);

    expect(extracted).toBeNull();
  });

  test('handles header with multiple spaces', () => {
    const token = 'token123';
    const header = `Bearer  ${token}`; // Double space

    const extracted = extractTokenFromHeader(header);
    expect(extracted).toBeNull(); // Should fail due to extra space
  });
});

// ========== SECURE TOKEN GENERATION TESTS ==========

describe('Secure Token Generation', () => {
  test('generates secure token with default length', () => {
    const token = generateSecureToken();

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  test('generates secure token with custom length', () => {
    const token16 = generateSecureToken(16);
    const token32 = generateSecureToken(32);
    const token64 = generateSecureToken(64);

    expect(token16.length).toBeLessThan(token32.length);
    expect(token32.length).toBeLessThan(token64.length);
  });

  test('secure tokens are different each time', () => {
    const token1 = generateSecureToken();
    const token2 = generateSecureToken();

    expect(token1).not.toBe(token2);
  });

  test('secure token is hex encoded', () => {
    const token = generateSecureToken();
    const hexRegex = /^[0-9a-f]+$/i;

    expect(hexRegex.test(token)).toBe(true);
  });

  test('token length matches input parameter', () => {
    const lengths = [16, 32, 64, 128];

    lengths.forEach(length => {
      const token = generateSecureToken(length);
      // Hex encoding doubles the length (2 hex chars per byte)
      expect(token.length).toBe(length * 2);
    });
  });
});

// ========== INTEGRATION TESTS ==========

describe('Authentication Flow Integration', () => {
  test('complete password reset flow', async () => {
    const password = 'NewPass123!';
    const userId = 'user-123';

    // Validate new password
    const validation = validatePasswordStrength(password);
    expect(validation.valid).toBe(true);

    // Hash the password
    const hash = await hashPassword(password);
    expect(hash).toBeDefined();

    // Generate reset token
    const resetToken = generateResetToken(userId);
    const decoded = verifyToken(resetToken);
    expect(decoded.userId).toBe(userId);
  });

  test('complete login flow', async () => {
    const email = 'user@example.com';
    const password = 'TestPass123!';
    const userId = 'user-123';
    const orgId = 'org-456';

    // Validate email
    expect(validateEmail(email)).toBe(true);

    // Validate password strength
    const validation = validatePasswordStrength(password);
    expect(validation.valid).toBe(true);

    // Hash password for storage
    const hash = await hashPassword(password);

    // During login, compare passwords
    const isMatch = await comparePassword(password, hash);
    expect(isMatch).toBe(true);

    // Generate tokens
    const tokens = generateAuthTokens(userId, email, orgId);
    expect(tokens.token).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();

    // Verify access token
    const decoded = verifyToken(tokens.token);
    expect(decoded.userId).toBe(userId);
    expect(decoded.email).toBe(email);
  });

  test('token refresh flow', () => {
    const userId = 'user-123';
    const email = 'user@example.com';

    // Initial tokens
    const initialTokens = generateAuthTokens(userId, email);

    // Verify refresh token is valid
    const refreshDecoded = verifyToken(initialTokens.refreshToken);
    expect(refreshDecoded.type).toBe('refresh');

    // Generate new access token using refresh token
    const newAccessToken = generateToken({
      userId: refreshDecoded.userId,
      email,
      type: 'access'
    });

    const newDecoded = verifyToken(newAccessToken);
    expect(newDecoded.userId).toBe(userId);
  });
});

// ========== SECURITY TESTS ==========

describe('Security Features', () => {
  test('tokens are tamper-proof', () => {
    const payload = { userId: '123' };
    const token = generateToken(payload);

    // Attempt to modify token
    const parts = token.split('.');
    const tamperedToken = `${parts[0]}.modified.${parts[2]}`;

    const decoded = verifyToken(tamperedToken);
    expect(decoded).toBeNull();
  });

  test('password hashes cannot be reversed', async () => {
    const password = 'SecurePass123!';
    const hash = await hashPassword(password);

    // Hash should not contain the original password
    expect(hash).not.toContain(password);
  });

  test('different users get different salts', async () => {
    const password = 'SamePass123!';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    // Hashes should be different even for same password
    expect(hash1).not.toBe(hash2);

    // Both should match the same password
    expect(await comparePassword(password, hash1)).toBe(true);
    expect(await comparePassword(password, hash2)).toBe(true);
  });

  test('secure token has sufficient entropy', () => {
    const tokens = new Set();

    // Generate 100 tokens
    for (let i = 0; i < 100; i++) {
      tokens.add(generateSecureToken());
    }

    // All should be unique
    expect(tokens.size).toBe(100);
  });
});

// ========== EDGE CASES ==========

describe('Edge Cases and Error Handling', () => {
  test('handles undefined payload gracefully', () => {
    expect(() => generateToken(undefined)).toThrow();
  });

  test('handles null payload gracefully', () => {
    expect(() => generateToken(null)).toThrow();
  });

  test('password comparison handles invalid hash gracefully', async () => {
    // bcrypt will return false for invalid hash format
    const result = await comparePassword('password', 'invalid-hash');
    expect(typeof result).toBe('boolean');
  });

  test('handles very long password', async () => {
    const longPassword = 'A1!' + 'a'.repeat(1000);
    const hash = await hashPassword(longPassword);

    const isMatch = await comparePassword(longPassword, hash);
    expect(isMatch).toBe(true);
  });

  test('handles special characters in email validation', () => {
    const specialEmails = [
      'user+tag@example.com',
      'first.last@company.co.uk',
      'name_123@test.io'
    ];

    specialEmails.forEach(email => {
      expect(validateEmail(email)).toBe(true);
    });
  });
});

// Run tests: npm test
