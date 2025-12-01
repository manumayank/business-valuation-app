/**
 * Business Management Routes
 *
 * GET    /api/businesses - List user's businesses
 * POST   /api/businesses - Create new business
 * GET    /api/businesses/:businessId - Get business details
 * PUT    /api/businesses/:businessId - Update business
 * DELETE /api/businesses/:businessId - Delete business
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const {
  requireAuth,
  requireBusinessOwnership
} = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * POST /api/businesses
 * Create a new business
 * Only authenticated users (owners) can create businesses
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, naicsCode, location, foundedYear } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        error: 'Business name is required'
      });
    }

    const { run } = req.db;

    // Create business
    const businessId = uuidv4();
    await run(
      `INSERT INTO businesses (id, owner_id, name, naics_code, location, founded_year, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [businessId, req.user.userId, name, naicsCode || null, location || null, foundedYear || null]
    );

    // Assign owner role to user if not already assigned
    try {
      await run(
        `INSERT OR IGNORE INTO user_roles (user_id, role, assigned_by)
         VALUES (?, 'owner', ?)`,
        [req.user.userId, req.user.userId]
      );
    } catch (err) {
      // Role may already exist, ignore error
    }

    // Log action
    await run(
      `INSERT INTO audit_log (table_name, operation, record_id, user_id, new_values)
       VALUES ('businesses', 'INSERT', ?, ?, ?)`,
      [businessId, req.user.userId, JSON.stringify({ name, naicsCode, location, foundedYear })]
    ).catch(() => {}); // Ignore audit errors

    return res.status(201).json({
      message: 'Business created successfully',
      business: {
        id: businessId,
        name,
        naicsCode,
        location,
        foundedYear,
        ownerId: req.user.userId,
        status: 'active'
      }
    });
  } catch (err) {
    console.error('Create business error:', err);
    return res.status(500).json({
      error: 'Failed to create business',
      details: err.message
    });
  }
});

/**
 * GET /api/businesses
 * Get all businesses for the authenticated user
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { all } = req.db;

    // Get user's businesses
    const businesses = await all(
      `SELECT * FROM businesses
       WHERE owner_id = ? OR id IN (
         SELECT e.business_id FROM engagements e
         WHERE e.assigned_advisor_id = ?
       )
       ORDER BY updated_at DESC`,
      [req.user.userId, req.user.userId]
    );

    return res.json({
      count: businesses.length,
      businesses: businesses.map(b => ({
        id: b.id,
        name: b.name,
        naicsCode: b.naics_code,
        location: b.location,
        foundedYear: b.founded_year,
        ownerId: b.owner_id,
        status: b.status,
        createdAt: b.created_at,
        updatedAt: b.updated_at
      }))
    });
  } catch (err) {
    console.error('List businesses error:', err);
    return res.status(500).json({
      error: 'Failed to retrieve businesses',
      details: err.message
    });
  }
});

/**
 * GET /api/businesses/:businessId
 * Get a specific business (with access control)
 */
router.get('/:businessId', requireAuth, requireBusinessOwnership, async (req, res) => {
  try {
    const { businessId } = req.params;
    const { get } = req.db;

    // Get business engagements
    const engagements = await get(
      `SELECT COUNT(*) as count FROM engagements WHERE business_id = ?`,
      [businessId]
    );

    const business = req.business;

    return res.json({
      id: business.id,
      name: business.name,
      naicsCode: business.naics_code,
      location: business.location,
      foundedYear: business.founded_year,
      ownerId: business.owner_id,
      status: business.status,
      engagementCount: engagements?.count || 0,
      createdAt: business.created_at,
      updatedAt: business.updated_at
    });
  } catch (err) {
    console.error('Get business error:', err);
    return res.status(500).json({
      error: 'Failed to retrieve business',
      details: err.message
    });
  }
});

/**
 * PUT /api/businesses/:businessId
 * Update a business (owner only)
 */
router.put('/:businessId', requireAuth, requireBusinessOwnership, async (req, res) => {
  try {
    const { businessId } = req.params;
    const { name, naicsCode, location, foundedYear, status } = req.body;

    const { run } = req.db;

    // Build update query
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (naicsCode !== undefined) {
      updates.push('naics_code = ?');
      params.push(naicsCode);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      params.push(location);
    }
    if (foundedYear !== undefined) {
      updates.push('founded_year = ?');
      params.push(foundedYear);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No fields to update'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(businessId);

    await run(
      `UPDATE businesses SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Log action
    const oldValues = req.business;
    const newValues = { ...oldValues, name, naicsCode, location, foundedYear, status };
    await run(
      `INSERT INTO audit_log (table_name, operation, record_id, user_id, old_values, new_values)
       VALUES ('businesses', 'UPDATE', ?, ?, ?, ?)`,
      [businessId, req.user.userId, JSON.stringify(oldValues), JSON.stringify(newValues)]
    ).catch(() => {});

    return res.json({
      message: 'Business updated successfully',
      business: {
        id: businessId,
        name: name || req.business.name,
        naicsCode: naicsCode || req.business.naics_code,
        location: location || req.business.location,
        foundedYear: foundedYear || req.business.founded_year,
        status: status || req.business.status
      }
    });
  } catch (err) {
    console.error('Update business error:', err);
    return res.status(500).json({
      error: 'Failed to update business',
      details: err.message
    });
  }
});

/**
 * DELETE /api/businesses/:businessId
 * Delete a business (owner only)
 */
router.delete('/:businessId', requireAuth, requireBusinessOwnership, async (req, res) => {
  try {
    const { businessId } = req.params;
    const { run, get } = req.db;

    // Check if business has active engagements
    const engagementCount = await get(
      `SELECT COUNT(*) as count FROM engagements WHERE business_id = ? AND status != 'archived'`,
      [businessId]
    );

    if (engagementCount && engagementCount.count > 0) {
      return res.status(409).json({
        error: 'Cannot delete business',
        message: 'Business has active engagements. Please archive or delete engagements first.',
        engagementCount: engagementCount.count
      });
    }

    // Log deletion
    const business = req.business;
    await run(
      `INSERT INTO audit_log (table_name, operation, record_id, user_id, old_values)
       VALUES ('businesses', 'DELETE', ?, ?, ?)`,
      [businessId, req.user.userId, JSON.stringify(business)]
    ).catch(() => {});

    // Delete business
    await run(
      `DELETE FROM businesses WHERE id = ?`,
      [businessId]
    );

    return res.json({
      message: 'Business deleted successfully'
    });
  } catch (err) {
    console.error('Delete business error:', err);
    return res.status(500).json({
      error: 'Failed to delete business',
      details: err.message
    });
  }
});

module.exports = router;
