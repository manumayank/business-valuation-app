/**
 * Engagement Management Routes
 *
 * GET    /api/engagements - List user's engagements
 * POST   /api/businesses/:businessId/engagements - Create engagement for a business
 * GET    /api/engagements/:engagementId - Get engagement details
 * PUT    /api/engagements/:engagementId - Update engagement
 * DELETE /api/engagements/:engagementId - Delete engagement
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const {
  requireAuth,
  requireBusinessOwnership,
  requireEngagementAccess
} = require('../middleware/authMiddleware');

const router = express.Router();

const ENGAGEMENT_STATES = ['created', 'intake', 'review', 'under_review', 'drafted', 'reports'];

/**
 * POST /api/businesses/:businessId/engagements
 * Create a new engagement for a business
 */
router.post('/businesses/:businessId/engagements', requireAuth, requireBusinessOwnership, async (req, res) => {
  try {
    const { businessId } = req.params;
    const { questionnaireTemplateId, advisorId, engagementType, notes } = req.body;

    const { run, get } = req.db;

    // Validate engagement type if provided
    const validTypes = ['vac', 'valuation', 'exit_planning', 'mna'];
    const type = engagementType || 'vac';
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid engagement type',
        validTypes
      });
    }

    // If questionnaireTemplateId provided, verify it exists
    let templateId = questionnaireTemplateId;
    if (templateId) {
      const template = await get(
        `SELECT id FROM questionnaire_templates WHERE id = ? AND is_active = 1`,
        [templateId]
      );

      if (!template) {
        return res.status(400).json({
          error: 'Invalid questionnaire template'
        });
      }
    }

    // Get business name for response
    const business = await get(`SELECT name FROM businesses WHERE id = ?`, [businessId]);

    // If no template ID, get or create a default template
    if (!templateId) {
      let defaultTemplate = await get(
        `SELECT id FROM questionnaire_templates WHERE name = 'Default VAC Template' AND is_active = 1`
      );

      if (!defaultTemplate) {
        // Create a default template
        await run(
          `INSERT OR IGNORE INTO questionnaire_templates (name, description, is_active) VALUES ('Default VAC Template', 'Default template for VAC engagements', 1)`
        );
        defaultTemplate = await get(
          `SELECT id FROM questionnaire_templates WHERE name = 'Default VAC Template'`
        );
      }

      templateId = defaultTemplate?.id || 1;
    }

    // Create engagement with access token
    const engagementId = uuidv4();
    const accessToken = crypto.randomBytes(32).toString('hex');

    await run(
      `INSERT INTO engagements (id, business_id, questionnaire_template_id, assigned_advisor_id, advisor_id, engagement_type, access_token, status, completion_percentage)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'created', 0)`,
      [engagementId, businessId, templateId, advisorId || req.user.userId, advisorId || req.user.userId, type, accessToken]
    );

    // Log action
    await run(
      `INSERT INTO audit_log (table_name, operation, record_id, user_id, new_values)
       VALUES ('engagements', 'INSERT', ?, ?, ?)`,
      [engagementId, req.user.userId, JSON.stringify({ businessId, engagementType: type, notes })]
    ).catch(() => {});

    // Generate shareable URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareableUrl = `${baseUrl}/business-portal/${accessToken}`;

    return res.status(201).json({
      message: 'Engagement created successfully',
      engagement: {
        id: engagementId,
        businessId,
        businessName: business?.name,
        questionnaireTemplateId: templateId || null,
        assignedAdvisorId: advisorId || req.user.userId,
        engagementType: type,
        notes: notes || null,
        status: 'created',
        completionPercentage: 0,
        accessToken,
        shareableUrl
      }
    });
  } catch (err) {
    console.error('Create engagement error:', err);
    return res.status(500).json({
      error: 'Failed to create engagement',
      details: err.message
    });
  }
});

/**
 * GET /api/engagements
 * Get all engagements the user has access to
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { all } = req.db;

    // Get engagements where user is owner, assigned advisor, or admin
    const engagements = await all(
      `SELECT e.*, b.name as business_name FROM engagements e
       JOIN businesses b ON e.business_id = b.id
       WHERE b.owner_id = ?
       OR e.assigned_advisor_id = ?
       OR ? IN (SELECT user_id FROM user_roles WHERE role = 'admin')
       ORDER BY e.updated_at DESC`,
      [req.user.userId, req.user.userId, req.user.userId]
    );

    return res.json({
      count: engagements.length,
      engagements: engagements.map(e => ({
        id: e.id,
        businessId: e.business_id,
        businessName: e.business_name,
        questionnaireTemplateId: e.questionnaire_template_id,
        assignedAdvisorId: e.assigned_advisor_id,
        status: e.status,
        completionPercentage: e.completion_percentage,
        createdAt: e.created_at,
        updatedAt: e.updated_at
      }))
    });
  } catch (err) {
    console.error('List engagements error:', err);
    return res.status(500).json({
      error: 'Failed to retrieve engagements',
      details: err.message
    });
  }
});

/**
 * GET /api/engagements/:engagementId
 * Get a specific engagement with full details
 */
router.get('/:engagementId', requireAuth, requireEngagementAccess, async (req, res) => {
  try {
    const { engagementId } = req.params;
    const { get, all } = req.db;

    // Get engagement details
    const engagement = req.engagement;

    // Get risk score if calculated
    const riskScore = await get(
      `SELECT * FROM risk_scores WHERE engagement_id = ?`,
      [engagementId]
    );

    // Get completed responses count
    const responseCount = await get(
      `SELECT COUNT(*) as count FROM questionnaire_responses WHERE engagement_id = ?`,
      [engagementId]
    );

    // Generate shareable URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareableUrl = engagement.access_token ? `${baseUrl}/business-portal/${engagement.access_token}` : null;

    return res.json({
      id: engagement.id,
      businessId: engagement.business_id,
      ownerBusinessId: engagement.owner_id,
      questionnaireTemplateId: engagement.questionnaire_template_id,
      assignedAdvisorId: engagement.assigned_advisor_id,
      engagementType: engagement.engagement_type || 'vac',
      status: engagement.status,
      completionPercentage: engagement.completion_percentage,
      accessToken: engagement.access_token,
      shareableUrl,
      riskScore: riskScore ? {
        score: riskScore.risk_score,
        category: riskScore.risk_category,
        breakdown: riskScore.score_breakdown ? JSON.parse(riskScore.score_breakdown) : null,
        calculatedAt: riskScore.calculated_at
      } : null,
      responseCount: responseCount?.count || 0,
      createdAt: engagement.created_at,
      updatedAt: engagement.updated_at
    });
  } catch (err) {
    console.error('Get engagement error:', err);
    return res.status(500).json({
      error: 'Failed to retrieve engagement',
      details: err.message
    });
  }
});

/**
 * PUT /api/engagements/:engagementId
 * Update engagement status and assignment
 */
router.put('/:engagementId', requireAuth, requireEngagementAccess, async (req, res) => {
  try {
    const { engagementId } = req.params;
    const { status, assignedAdvisorId, completionPercentage } = req.body;

    const { run } = req.db;

    // Validate status
    if (status && !ENGAGEMENT_STATES.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        validStatuses: ENGAGEMENT_STATES
      });
    }

    // Validate completion percentage
    if (completionPercentage !== undefined) {
      if (completionPercentage < 0 || completionPercentage > 100) {
        return res.status(400).json({
          error: 'Completion percentage must be between 0 and 100'
        });
      }
    }

    // Build update query
    const updates = [];
    const params = [];

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (assignedAdvisorId !== undefined) {
      updates.push('assigned_advisor_id = ?');
      params.push(assignedAdvisorId);
    }
    if (completionPercentage !== undefined) {
      updates.push('completion_percentage = ?');
      params.push(completionPercentage);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No fields to update'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(engagementId);

    await run(
      `UPDATE engagements SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Log action
    const oldValues = req.engagement;
    const newValues = { ...oldValues, status, assigned_advisor_id: assignedAdvisorId, completion_percentage: completionPercentage };
    await run(
      `INSERT INTO audit_log (table_name, operation, record_id, user_id, old_values, new_values)
       VALUES ('engagements', 'UPDATE', ?, ?, ?, ?)`,
      [engagementId, req.user.userId, JSON.stringify(oldValues), JSON.stringify(newValues)]
    ).catch(() => {});

    return res.json({
      message: 'Engagement updated successfully',
      engagement: {
        id: engagementId,
        status: status !== undefined ? status : req.engagement.status,
        assignedAdvisorId: assignedAdvisorId !== undefined ? assignedAdvisorId : req.engagement.assigned_advisor_id,
        completionPercentage: completionPercentage !== undefined ? completionPercentage : req.engagement.completion_percentage
      }
    });
  } catch (err) {
    console.error('Update engagement error:', err);
    return res.status(500).json({
      error: 'Failed to update engagement',
      details: err.message
    });
  }
});

/**
 * DELETE /api/engagements/:engagementId
 * Delete an engagement (owner or admin only)
 */
router.delete('/:engagementId', requireAuth, requireEngagementAccess, async (req, res) => {
  try {
    const { engagementId } = req.params;
    const { run, get } = req.db;

    // Only allow owner or admin to delete
    const engagement = req.engagement;
    if (engagement.owner_id !== req.user.userId) {
      const userRole = await get(
        `SELECT role FROM user_roles WHERE user_id = ? AND role = 'admin'`,
        [req.user.userId]
      );
      if (!userRole) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only business owner or admin can delete engagements'
        });
      }
    }

    // Log deletion
    await run(
      `INSERT INTO audit_log (table_name, operation, record_id, user_id, old_values)
       VALUES ('engagements', 'DELETE', ?, ?, ?)`,
      [engagementId, req.user.userId, JSON.stringify(engagement)]
    ).catch(() => {});

    // Delete related data
    await run(`DELETE FROM questionnaire_responses WHERE engagement_id = ?`, [engagementId]).catch(() => {});
    await run(`DELETE FROM risk_scores WHERE engagement_id = ?`, [engagementId]).catch(() => {});
    await run(`DELETE FROM documents WHERE engagement_id = ?`, [engagementId]).catch(() => {});
    await run(`DELETE FROM team_assignments WHERE engagement_id = ?`, [engagementId]).catch(() => {});

    // Delete engagement
    await run(`DELETE FROM engagements WHERE id = ?`, [engagementId]);

    return res.json({
      message: 'Engagement deleted successfully'
    });
  } catch (err) {
    console.error('Delete engagement error:', err);
    return res.status(500).json({
      error: 'Failed to delete engagement',
      details: err.message
    });
  }
});

module.exports = router;
