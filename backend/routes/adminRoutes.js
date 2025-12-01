/**
 * Admin Dashboard Routes
 * Protected routes for admin users to manage advisors and view all businesses
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { get, all, run } = require('../db');
const { requireAuth } = require('../middleware/authMiddleware');

// Apply auth middleware to all admin routes
router.use(requireAuth);

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const user = await get('SELECT role FROM users WHERE id = ?', [req.user.userId]);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Error checking admin status:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Apply admin check to all routes
router.use(requireAdmin);

// ==================== STATISTICS ====================

// GET /api/admin/stats - Get admin dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      advisorCount,
      businessCount,
      engagementCount,
      activeEngagements,
      pendingReview,
      completedEngagements
    ] = await Promise.all([
      get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['advisor']),
      get('SELECT COUNT(*) as count FROM businesses'),
      get('SELECT COUNT(*) as count FROM engagements'),
      get('SELECT COUNT(*) as count FROM engagements WHERE status IN (?, ?)', ['intake', 'review']),
      get('SELECT COUNT(*) as count FROM engagements WHERE status = ?', ['review']),
      get('SELECT COUNT(*) as count FROM engagements WHERE status = ?', ['completed'])
    ]);

    res.json({
      stats: {
        totalAdvisors: advisorCount?.count || 0,
        totalBusinesses: businessCount?.count || 0,
        totalEngagements: engagementCount?.count || 0,
        activeEngagements: activeEngagements?.count || 0,
        pendingReview: pendingReview?.count || 0,
        completedEngagements: completedEngagements?.count || 0
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to load statistics' });
  }
});

// ==================== ADVISORS ====================

// GET /api/admin/advisors - Get all advisors
router.get('/advisors', async (req, res) => {
  try {
    const { search, status } = req.query;

    let query = `
      SELECT u.id, u.full_name as fullName, u.email, u.role, u.created_at, u.is_active,
             COUNT(DISTINCT b.id) as businessCount,
             COUNT(DISTINCT e.id) as engagementCount
      FROM users u
      LEFT JOIN businesses b ON b.advisor_id = u.id
      LEFT JOIN engagements e ON e.advisor_id = u.id
      WHERE u.role = 'advisor'
    `;
    const params = [];

    if (search) {
      query += ` AND (u.full_name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status === 'active') {
      query += ` AND u.is_active = 1`;
    } else if (status === 'inactive') {
      query += ` AND u.is_active = 0`;
    }

    query += ` GROUP BY u.id ORDER BY u.created_at DESC`;

    const advisorsRaw = await all(query, params);
    // Transform is_active to status for frontend compatibility
    const advisors = advisorsRaw.map(a => ({
      ...a,
      status: a.is_active ? 'active' : 'inactive'
    }));
    res.json({ advisors });
  } catch (error) {
    console.error('Error fetching advisors:', error);
    res.status(500).json({ error: 'Failed to load advisors' });
  }
});

// POST /api/admin/advisors - Create new advisor
router.post('/advisors', async (req, res) => {
  try {
    // Accept both fullName and name for backwards compatibility
    const { fullName, name, email, password } = req.body;
    const advisorName = fullName || name;

    if (!advisorName || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if email already exists
    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create advisor
    const result = await run(`
      INSERT INTO users (full_name, email, password, role, is_active, created_at)
      VALUES (?, ?, ?, 'advisor', 1, CURRENT_TIMESTAMP)
    `, [advisorName, email, hashedPassword]);

    // Log activity
    await run(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
      VALUES (?, 'advisor_created', 'user', ?, ?, CURRENT_TIMESTAMP)
    `, [req.user.userId, result.lastID, JSON.stringify({ name: advisorName, email })]);

    res.status(201).json({
      success: true,
      advisor: {
        id: result.lastID,
        fullName: advisorName,
        email,
        role: 'advisor',
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Error creating advisor:', error);
    res.status(500).json({ error: 'Failed to create advisor' });
  }
});

// PUT /api/admin/advisors/:id - Update advisor
router.put('/advisors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Accept both fullName and name for backwards compatibility
    const { fullName, name, email, is_active, status } = req.body;
    const advisorName = fullName || name;

    const advisor = await get('SELECT * FROM users WHERE id = ? AND role = ?', [id, 'advisor']);
    if (!advisor) {
      return res.status(404).json({ error: 'Advisor not found' });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (advisorName !== undefined) {
      updates.push('full_name = ?');
      params.push(advisorName);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }
    // Handle both is_active (boolean) and status (string) for backwards compatibility
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    } else if (status !== undefined) {
      updates.push('is_active = ?');
      params.push(status === 'active' ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    params.push(id);
    await run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    // Log activity
    await run(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
      VALUES (?, 'advisor_updated', 'user', ?, ?, CURRENT_TIMESTAMP)
    `, [req.user.userId, id, JSON.stringify({ updates: req.body })]);

    res.json({ success: true, message: 'Advisor updated successfully' });
  } catch (error) {
    console.error('Error updating advisor:', error);
    res.status(500).json({ error: 'Failed to update advisor' });
  }
});

// PUT /api/admin/advisors/:id/status - Toggle advisor status
router.put('/advisors/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const advisor = await get('SELECT * FROM users WHERE id = ? AND role = ?', [id, 'advisor']);
    if (!advisor) {
      return res.status(404).json({ error: 'Advisor not found' });
    }

    // Convert status string to is_active boolean
    const is_active = status === 'active' ? 1 : 0;

    await run('UPDATE users SET is_active = ? WHERE id = ?', [is_active, id]);

    // Log activity
    await run(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
      VALUES (?, 'advisor_status_changed', 'user', ?, ?, CURRENT_TIMESTAMP)
    `, [req.user.userId, id, JSON.stringify({ status, advisorName: advisor.full_name })]);

    res.json({ success: true, message: `Advisor ${status === 'active' ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    console.error('Error updating advisor status:', error);
    res.status(500).json({ error: 'Failed to update advisor status' });
  }
});

// DELETE /api/admin/advisors/:id - Deactivate advisor
router.delete('/advisors/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const advisor = await get('SELECT * FROM users WHERE id = ? AND role = ?', [id, 'advisor']);
    if (!advisor) {
      return res.status(404).json({ error: 'Advisor not found' });
    }

    // Soft delete - just deactivate
    await run('UPDATE users SET is_active = 0 WHERE id = ?', [id]);

    // Log activity
    await run(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
      VALUES (?, 'advisor_deactivated', 'user', ?, ?, CURRENT_TIMESTAMP)
    `, [req.user.id, id, JSON.stringify({ advisorName: advisor.name })]);

    res.json({ success: true, message: 'Advisor deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating advisor:', error);
    res.status(500).json({ error: 'Failed to deactivate advisor' });
  }
});

// ==================== BUSINESSES ====================

// GET /api/admin/businesses - Get all businesses
router.get('/businesses', async (req, res) => {
  try {
    const { search, advisorId } = req.query;

    let query = `
      SELECT b.*, u.full_name as advisorName, u.email as advisorEmail,
             COUNT(DISTINCT e.id) as engagementCount
      FROM businesses b
      LEFT JOIN users u ON b.advisor_id = u.id
      LEFT JOIN engagements e ON e.business_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (b.name LIKE ? OR b.industry LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (advisorId) {
      query += ` AND b.advisor_id = ?`;
      params.push(advisorId);
    }

    query += ` GROUP BY b.id ORDER BY b.created_at DESC`;

    const businesses = await all(query, params);
    res.json({ businesses });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({ error: 'Failed to load businesses' });
  }
});

// GET /api/admin/businesses/:id - Get business details
router.get('/businesses/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const business = await get(`
      SELECT b.*, u.full_name as advisorName, u.email as advisorEmail
      FROM businesses b
      LEFT JOIN users u ON b.advisor_id = u.id
      WHERE b.id = ?
    `, [id]);

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const engagements = await all(`
      SELECT e.*,
             (SELECT COUNT(*) FROM documents WHERE engagement_id = e.id) as documentCount
      FROM engagements e
      WHERE e.business_id = ?
      ORDER BY e.created_at DESC
    `, [id]);

    res.json({ business, engagements });
  } catch (error) {
    console.error('Error fetching business:', error);
    res.status(500).json({ error: 'Failed to load business' });
  }
});

// ==================== ENGAGEMENTS ====================

// GET /api/admin/engagements - Get all engagements
router.get('/engagements', async (req, res) => {
  try {
    const { search, status, engagementType } = req.query;

    let query = `
      SELECT e.*, b.name as businessName, b.industry,
             u.full_name as advisorName, u.email as advisorEmail
      FROM engagements e
      JOIN businesses b ON e.business_id = b.id
      JOIN users u ON e.advisor_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (b.name LIKE ? OR u.full_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ` AND e.status = ?`;
      params.push(status);
    }

    if (engagementType) {
      query += ` AND e.engagement_type = ?`;
      params.push(engagementType);
    }

    query += ` ORDER BY e.created_at DESC`;

    const engagements = await all(query, params);
    res.json({ engagements });
  } catch (error) {
    console.error('Error fetching engagements:', error);
    res.status(500).json({ error: 'Failed to load engagements' });
  }
});

// ==================== ACTIVITY LOG ====================

// GET /api/admin/activity - Get activity log
router.get('/activity', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const activities = await all(`
      SELECT a.*, u.full_name as userName, u.email as userEmail
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), parseInt(offset)]);

    // Format activities for display
    const formattedActivities = activities.map(a => ({
      id: a.id,
      action: a.action,
      description: formatActivityDescription(a),
      userName: a.userName,
      timestamp: a.created_at,
      details: a.details ? JSON.parse(a.details) : null
    }));

    res.json({ activities: formattedActivities });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Failed to load activity log' });
  }
});

// Helper function to format activity descriptions
function formatActivityDescription(activity) {
  const details = activity.details ? JSON.parse(activity.details) : {};

  switch (activity.action) {
    case 'advisor_created':
      return `New advisor created: ${details.name}`;
    case 'advisor_updated':
      return `Advisor updated`;
    case 'advisor_deactivated':
      return `Advisor deactivated: ${details.advisorName}`;
    case 'business_created':
      return `New business added: ${details.businessName}`;
    case 'engagement_created':
      return `New engagement started: ${details.engagementType}`;
    case 'questionnaire_submitted':
      return `Questionnaire submitted for ${details.businessName}`;
    case 'document_uploaded':
      return `Document uploaded: ${details.fileName}`;
    case 'report_generated':
      return `Report generated: ${details.reportType}`;
    default:
      return activity.action.replace(/_/g, ' ');
  }
}

// ==================== OVERVIEW DATA ====================

// GET /api/admin/overview - Get overview data for dashboard
router.get('/overview', async (req, res) => {
  try {
    // Top advisors by engagement count
    const topAdvisors = await all(`
      SELECT u.id, u.full_name as fullName, COUNT(e.id) as engagementCount
      FROM users u
      LEFT JOIN engagements e ON e.advisor_id = u.id
      WHERE u.role = 'advisor' AND u.is_active = 1
      GROUP BY u.id
      ORDER BY engagementCount DESC
      LIMIT 5
    `);

    // Recent businesses
    const recentBusinesses = await all(`
      SELECT b.id, b.name, b.industry, b.created_at,
             u.full_name as advisorName
      FROM businesses b
      LEFT JOIN users u ON b.advisor_id = u.id
      ORDER BY b.created_at DESC
      LIMIT 5
    `);

    // Recent activity
    const recentActivity = await all(`
      SELECT a.*, u.full_name as userName
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 10
    `);

    const formattedActivity = recentActivity.map(a => ({
      id: a.id,
      description: formatActivityDescription(a),
      timestamp: a.created_at,
      userName: a.userName
    }));

    res.json({
      topAdvisors,
      recentBusinesses,
      recentActivity: formattedActivity
    });
  } catch (error) {
    console.error('Error fetching overview:', error);
    res.status(500).json({ error: 'Failed to load overview data' });
  }
});

// ==================== INDUSTRY MULTIPLES ====================

// GET /api/admin/industry-multiples - Get all industry multiples
router.get('/industry-multiples', async (req, res) => {
  try {
    const { search } = req.query;

    let query = `
      SELECT id, naics_code as naicsCode, industry_name as industryName,
             multiple, updated_at as updatedAt, source
      FROM industry_multiples
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (naics_code LIKE ? OR industry_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY naics_code ASC`;

    const multiples = await all(query, params);
    res.json({ multiples });
  } catch (error) {
    console.error('Error fetching industry multiples:', error);
    res.status(500).json({ error: 'Failed to load industry multiples' });
  }
});

// GET /api/admin/industry-multiples/:id - Get single industry multiple
router.get('/industry-multiples/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const multiple = await get(`
      SELECT id, naics_code as naicsCode, industry_name as industryName,
             multiple, updated_at as updatedAt, source
      FROM industry_multiples
      WHERE id = ?
    `, [id]);

    if (!multiple) {
      return res.status(404).json({ error: 'Industry multiple not found' });
    }

    res.json({ multiple });
  } catch (error) {
    console.error('Error fetching industry multiple:', error);
    res.status(500).json({ error: 'Failed to load industry multiple' });
  }
});

// POST /api/admin/industry-multiples - Create new industry multiple
router.post('/industry-multiples', async (req, res) => {
  try {
    const { naicsCode, industryName, multiple, source } = req.body;

    if (!naicsCode || !industryName || multiple === undefined) {
      return res.status(400).json({
        error: 'NAICS code, industry name, and multiple are required'
      });
    }

    // Check for duplicate NAICS code
    const existing = await get(
      'SELECT id FROM industry_multiples WHERE naics_code = ?',
      [naicsCode]
    );

    if (existing) {
      return res.status(409).json({ error: 'NAICS code already exists' });
    }

    const result = await run(`
      INSERT INTO industry_multiples (naics_code, industry_name, multiple, source, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [naicsCode, industryName, multiple, source || 'admin']);

    // Log activity
    await run(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
      VALUES (?, 'industry_multiple_created', 'industry_multiple', ?, ?, CURRENT_TIMESTAMP)
    `, [req.user.userId, result.lastID, JSON.stringify({ naicsCode, industryName, multiple })]);

    res.status(201).json({
      success: true,
      multiple: {
        id: result.lastID,
        naicsCode,
        industryName,
        multiple,
        source: source || 'admin'
      }
    });
  } catch (error) {
    console.error('Error creating industry multiple:', error);
    res.status(500).json({ error: 'Failed to create industry multiple' });
  }
});

// PUT /api/admin/industry-multiples/:id - Update industry multiple
router.put('/industry-multiples/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { naicsCode, industryName, multiple, source } = req.body;

    const existing = await get(
      'SELECT * FROM industry_multiples WHERE id = ?',
      [id]
    );

    if (!existing) {
      return res.status(404).json({ error: 'Industry multiple not found' });
    }

    // Check for duplicate NAICS code if changing
    if (naicsCode && naicsCode !== existing.naics_code) {
      const duplicate = await get(
        'SELECT id FROM industry_multiples WHERE naics_code = ? AND id != ?',
        [naicsCode, id]
      );
      if (duplicate) {
        return res.status(409).json({ error: 'NAICS code already exists' });
      }
    }

    // Build update query
    const updates = [];
    const params = [];

    if (naicsCode !== undefined) {
      updates.push('naics_code = ?');
      params.push(naicsCode);
    }
    if (industryName !== undefined) {
      updates.push('industry_name = ?');
      params.push(industryName);
    }
    if (multiple !== undefined) {
      updates.push('multiple = ?');
      params.push(multiple);
    }
    if (source !== undefined) {
      updates.push('source = ?');
      params.push(source);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await run(
      `UPDATE industry_multiples SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Log activity
    await run(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
      VALUES (?, 'industry_multiple_updated', 'industry_multiple', ?, ?, CURRENT_TIMESTAMP)
    `, [req.user.userId, id, JSON.stringify({ updates: req.body })]);

    res.json({ success: true, message: 'Industry multiple updated successfully' });
  } catch (error) {
    console.error('Error updating industry multiple:', error);
    res.status(500).json({ error: 'Failed to update industry multiple' });
  }
});

// DELETE /api/admin/industry-multiples/:id - Delete industry multiple
router.delete('/industry-multiples/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await get(
      'SELECT * FROM industry_multiples WHERE id = ?',
      [id]
    );

    if (!existing) {
      return res.status(404).json({ error: 'Industry multiple not found' });
    }

    await run('DELETE FROM industry_multiples WHERE id = ?', [id]);

    // Log activity
    await run(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
      VALUES (?, 'industry_multiple_deleted', 'industry_multiple', ?, ?, CURRENT_TIMESTAMP)
    `, [req.user.userId, id, JSON.stringify({
      naicsCode: existing.naics_code,
      industryName: existing.industry_name
    })]);

    res.json({ success: true, message: 'Industry multiple deleted successfully' });
  } catch (error) {
    console.error('Error deleting industry multiple:', error);
    res.status(500).json({ error: 'Failed to delete industry multiple' });
  }
});

// POST /api/admin/industry-multiples/bulk - Bulk import industry multiples
router.post('/industry-multiples/bulk', async (req, res) => {
  try {
    const { multiples } = req.body;

    if (!Array.isArray(multiples) || multiples.length === 0) {
      return res.status(400).json({ error: 'Array of multiples is required' });
    }

    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (const item of multiples) {
      const { naicsCode, industryName, multiple, source } = item;

      if (!naicsCode || !industryName || multiple === undefined) {
        errors.push({ item, error: 'Missing required fields' });
        skipped++;
        continue;
      }

      try {
        // Use INSERT OR REPLACE to handle duplicates
        await run(`
          INSERT OR REPLACE INTO industry_multiples
          (naics_code, industry_name, multiple, source, updated_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [naicsCode, industryName, multiple, source || 'bulk_import']);
        imported++;
      } catch (err) {
        errors.push({ item, error: err.message });
        skipped++;
      }
    }

    // Log activity
    await run(`
      INSERT INTO audit_logs (user_id, action, entity_type, details, created_at)
      VALUES (?, 'industry_multiples_bulk_import', 'industry_multiple', ?, CURRENT_TIMESTAMP)
    `, [req.user.userId, JSON.stringify({ imported, skipped, total: multiples.length })]);

    res.json({
      success: true,
      message: `Imported ${imported} multiples, skipped ${skipped}`,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error bulk importing industry multiples:', error);
    res.status(500).json({ error: 'Failed to bulk import industry multiples' });
  }
});

module.exports = router;
