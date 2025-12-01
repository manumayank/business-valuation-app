/**
 * Team Management Routes
 *
 * POST   /api/team/assign-advisor - Assign advisor to engagement
 * GET    /api/team/advisors - List all advisors
 * GET    /api/team/users/:userId - Get user profile
 * PUT    /api/team/users/:userId/role - Update user role
 * DELETE /api/team/assignments/:assignmentId - Remove team assignment
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * POST /api/team/assign-advisor
 * Assign an advisor to an engagement
 * Requires admin or business owner
 */
router.post('/assign-advisor', requireAuth, async (req, res) => {
  try {
    const { engagementId, advisorId } = req.body;
    const { get, run } = req.db;

    // Validation
    if (!engagementId || !advisorId) {
      return res.status(400).json({
        error: 'Engagement ID and Advisor ID are required'
      });
    }

    // Verify engagement exists and user has access
    const engagement = await get(
      `SELECT e.*, b.owner_id FROM engagements e
       JOIN businesses b ON e.business_id = b.id
       WHERE e.id = ? AND (b.owner_id = ? OR ? IN (SELECT user_id FROM user_roles WHERE role = 'admin'))`,
      [engagementId, req.user.userId, req.user.userId]
    );

    if (!engagement) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to assign advisors to this engagement'
      });
    }

    // Verify advisor exists and has advisor role
    const advisor = await get(
      `SELECT u.id FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.id = ? AND ur.role IN ('advisor', 'admin')`,
      [advisorId]
    );

    if (!advisor) {
      return res.status(400).json({
        error: 'Invalid advisor',
        message: 'User is not registered as an advisor'
      });
    }

    // Create assignment record
    const assignmentId = uuidv4();
    await run(
      `INSERT INTO team_assignments (id, advisor_id, engagement_id, assigned_by)
       VALUES (?, ?, ?, ?)`,
      [assignmentId, advisorId, engagementId, req.user.userId]
    );

    // Update engagement with assigned advisor
    await run(
      `UPDATE engagements SET assigned_advisor_id = ? WHERE id = ?`,
      [advisorId, engagementId]
    );

    // Log action
    await run(
      `INSERT INTO audit_log (table_name, operation, record_id, user_id, new_values)
       VALUES ('team_assignments', 'INSERT', ?, ?, ?)`,
      [assignmentId, req.user.userId, JSON.stringify({ advisorId, engagementId })]
    ).catch(() => {});

    return res.status(201).json({
      message: 'Advisor assigned successfully',
      assignment: {
        id: assignmentId,
        advisorId,
        engagementId,
        assignedBy: req.user.userId,
        assignedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Assign advisor error:', err);
    return res.status(500).json({
      error: 'Failed to assign advisor',
      details: err.message
    });
  }
});

/**
 * GET /api/team/advisors
 * Get list of all advisors (for selection dropdowns)
 */
router.get('/advisors', requireAuth, async (req, res) => {
  try {
    const { all } = req.db;

    const advisors = await all(
      `SELECT u.id, u.email, u.full_name, u.company, ur.role
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       WHERE ur.role IN ('advisor', 'admin')
       AND u.status = 'active'
       ORDER BY u.full_name ASC`
    );

    return res.json({
      count: advisors.length,
      advisors: advisors.map(a => ({
        id: a.id,
        email: a.email,
        fullName: a.full_name,
        company: a.company,
        role: a.role
      }))
    });
  } catch (err) {
    console.error('List advisors error:', err);
    return res.status(500).json({
      error: 'Failed to retrieve advisors',
      details: err.message
    });
  }
});

/**
 * GET /api/team/users/:userId
 * Get user profile and roles
 */
router.get('/users/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { get, all } = req.db;

    // Get user info
    const user = await get(
      `SELECT id, email, full_name, company, phone, verified, status, created_at FROM users WHERE id = ?`,
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Get user roles
    const roles = await all(
      `SELECT role, assigned_at FROM user_roles WHERE user_id = ? ORDER BY assigned_at DESC`,
      [userId]
    );

    return res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      company: user.company,
      phone: user.phone,
      verified: user.verified,
      status: user.status,
      roles: roles.map(r => ({
        role: r.role,
        assignedAt: r.assigned_at
      })),
      createdAt: user.created_at
    });
  } catch (err) {
    console.error('Get user error:', err);
    return res.status(500).json({
      error: 'Failed to retrieve user',
      details: err.message
    });
  }
});

/**
 * PUT /api/team/users/:userId/role
 * Assign or update user role (admin only)
 */
router.put('/users/:userId/role', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['owner', 'advisor', 'admin'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        validRoles
      });
    }

    const { get, run } = req.db;

    // Verify user exists
    const user = await get(
      `SELECT id FROM users WHERE id = ?`,
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Check if role already assigned
    const existingRole = await get(
      `SELECT id FROM user_roles WHERE user_id = ? AND role = ?`,
      [userId, role]
    );

    if (existingRole) {
      return res.status(409).json({
        error: 'Role already assigned',
        message: `User already has the ${role} role`
      });
    }

    // Assign role
    await run(
      `INSERT INTO user_roles (user_id, role, assigned_by)
       VALUES (?, ?, ?)`,
      [userId, role, req.user.userId]
    );

    // Log action
    await run(
      `INSERT INTO audit_log (table_name, operation, record_id, user_id, new_values)
       VALUES ('user_roles', 'INSERT', ?, ?, ?)`,
      [userId, req.user.userId, JSON.stringify({ role })]
    ).catch(() => {});

    return res.status(201).json({
      message: `Role '${role}' assigned successfully`,
      userId,
      role,
      assignedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Assign role error:', err);
    return res.status(500).json({
      error: 'Failed to assign role',
      details: err.message
    });
  }
});

/**
 * DELETE /api/team/assignments/:assignmentId
 * Remove team assignment
 */
router.delete('/assignments/:assignmentId', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { get, run } = req.db;

    // Get assignment info
    const assignment = await get(
      `SELECT * FROM team_assignments WHERE id = ?`,
      [assignmentId]
    );

    if (!assignment) {
      return res.status(404).json({
        error: 'Assignment not found'
      });
    }

    // Log deletion
    await run(
      `INSERT INTO audit_log (table_name, operation, record_id, user_id, old_values)
       VALUES ('team_assignments', 'DELETE', ?, ?, ?)`,
      [assignmentId, req.user.userId, JSON.stringify(assignment)]
    ).catch(() => {});

    // Remove assignment
    await run(
      `DELETE FROM team_assignments WHERE id = ?`,
      [assignmentId]
    );

    // Clear engagement assignment if this was the last one
    await run(
      `UPDATE engagements SET assigned_advisor_id = NULL WHERE id = ? AND id NOT IN (SELECT engagement_id FROM team_assignments WHERE advisor_id = ?)`,
      [assignment.engagement_id, assignment.advisor_id]
    );

    return res.json({
      message: 'Assignment removed successfully'
    });
  } catch (err) {
    console.error('Delete assignment error:', err);
    return res.status(500).json({
      error: 'Failed to remove assignment',
      details: err.message
    });
  }
});

module.exports = router;
