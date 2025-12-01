/**
 * Authentication Middleware
 *
 * Validates JWT tokens on protected routes.
 * Attaches user info to request object for use in route handlers.
 */

const authService = require('../services/authService');

/**
 * Middleware: Require authentication
 * Validates JWT token from Authorization header
 */
const requireAuth = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = authService.extractTokenFromHeader(
      req.headers.authorization
    );

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No authorization token provided'
      });
    }

    // Verify token
    const decoded = authService.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token is invalid or expired'
      });
    }

    // Check token type
    if (decoded.type !== 'access') {
      return res.status(401).json({
        error: 'Invalid token type',
        message: 'This token cannot be used for authentication'
      });
    }

    // Attach user to request
    req.user = decoded;

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
};

/**
 * Middleware: Optional authentication
 * Doesn't require token, but validates if present
 */
const optionalAuth = (req, res, next) => {
  try {
    const token = authService.extractTokenFromHeader(
      req.headers.authorization
    );

    if (token) {
      const decoded = authService.verifyToken(token);
      if (decoded && decoded.type === 'access') {
        req.user = decoded;
      }
    }

    next();
  } catch (err) {
    // Don't fail if auth is optional and invalid
    next();
  }
};

/**
 * Middleware: Require specific role (checks user_roles table)
 * Should be used after requireAuth middleware
 *
 * @param {string|string[]} requiredRoles - Role(s) required (owner, advisor, admin)
 */
const requireRole = (requiredRoles) => {
  if (typeof requiredRoles === 'string') {
    requiredRoles = [requiredRoles];
  }

  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      const { get } = req.db;

      // Check user roles in database
      const userRoles = await get(
        `SELECT role FROM user_roles WHERE user_id = ? AND role IN (${requiredRoles.map(() => '?').join(',')})`,
        [req.user.userId, ...requiredRoles]
      );

      if (!userRoles) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `This action requires one of these roles: ${requiredRoles.join(', ')}`
        });
      }

      // Attach user role to request for later use
      req.userRole = userRoles.role;

      next();
    } catch (err) {
      console.error('Role check error:', err);
      return res.status(500).json({
        error: 'Authorization error'
      });
    }
  };
};

/**
 * Middleware: Require business ownership
 * Checks if user owns the business (used in route parameters like /api/businesses/:businessId)
 */
const requireBusinessOwnership = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const { businessId } = req.params;
    if (!businessId) {
      return res.status(400).json({
        error: 'Business ID required'
      });
    }

    const { get } = req.db;

    // Check if user owns or is admin for this business
    const business = await get(
      `SELECT b.* FROM businesses b
       WHERE b.id = ? AND (b.owner_id = ? OR ? IN (SELECT user_id FROM user_roles WHERE role = 'admin'))`,
      [businessId, req.user.userId, req.user.userId]
    );

    if (!business) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to access this business'
      });
    }

    // Attach business to request
    req.business = business;

    next();
  } catch (err) {
    console.error('Business ownership check error:', err);
    return res.status(500).json({
      error: 'Authorization error'
    });
  }
};

/**
 * Middleware: Require engagement access
 * Checks if user is assigned to the engagement or is admin
 */
const requireEngagementAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const { engagementId } = req.params;
    if (!engagementId) {
      return res.status(400).json({
        error: 'Engagement ID required'
      });
    }

    const { get } = req.db;

    // Check if user is admin, business owner, or assigned advisor
    const engagement = await get(
      `SELECT e.*, b.owner_id
       FROM engagements e
       JOIN businesses b ON e.business_id = b.id
       WHERE e.id = ? AND (
         b.owner_id = ?
         OR e.assigned_advisor_id = ?
         OR ? IN (SELECT user_id FROM user_roles WHERE role = 'admin')
       )`,
      [engagementId, req.user.userId, req.user.userId, req.user.userId]
    );

    if (!engagement) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to access this engagement'
      });
    }

    // Attach engagement to request
    req.engagement = engagement;

    next();
  } catch (err) {
    console.error('Engagement access check error:', err);
    return res.status(500).json({
      error: 'Authorization error'
    });
  }
};

/**
 * Middleware: Error handler for 404 Not Found
 */
const notFound = (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Endpoint not found: ${req.method} ${req.path}`
  });
};

/**
 * Middleware: Global error handler
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireRole,
  requireBusinessOwnership,
  requireEngagementAccess,
  notFound,
  errorHandler
};
