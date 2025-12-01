const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');
const { initializeDatabase, runMigrations, run, get, all } = require('./db');
const { calculateValuation } = require('./valuationEngine');
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const workingCapitalRoutes = require('./routes/workingCapitalRoutes');
const dealAnalysisRoutes = require('./routes/dealAnalysisRoutes');
const businessRoutes = require('./routes/businessRoutes');
const engagementRoutes = require('./routes/engagementRoutes');
const teamRoutes = require('./routes/teamRoutes');
const vacRoutes = require('./routes/vacRoutes');
const documentRoutes = require('./routes/documentRoutes');
const businessPortalRoutes = require('./routes/businessPortalRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { requireAuth, notFound, errorHandler } = require('./middleware/authMiddleware');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - Security
app.use(helmet());
app.use(cors());
app.use(express.json());

// Middleware - Inject database functions into all requests
app.use((req, res, next) => {
  req.db = { run, get, all };
  next();
});

// Initialize database and run migrations
async function startServer() {
  try {
    await initializeDatabase();
    console.log('✓ Database initialized');

    await runMigrations();
    console.log('✓ Migrations completed');

    // Start server
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Startup error:', err);
    process.exit(1);
  }
}

startServer();

// Health check (public - must be before other /api routes)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication Routes (public - no auth required)
app.use('/api/auth', authRoutes);

// Business Routes (protected - requires authentication)
app.use('/api/businesses', businessRoutes);

// Engagement Routes (protected - requires authentication)
app.use('/api/engagements', engagementRoutes);
// Also mount at /api for the POST /businesses/:id/engagements route
app.use('/api', engagementRoutes);

// Team Management Routes (protected - requires authentication)
app.use('/api/team', teamRoutes);

// Report Routes (protected - requires authentication)
app.use('/api/valuations', reportRoutes);

// Working Capital Routes (protected - requires authentication)
app.use('/api/valuations', workingCapitalRoutes);

// Deal Analysis Routes (protected - requires authentication)
app.use('/api/valuations', dealAnalysisRoutes);

// VAC Routes (Value Acceleration Calculator)
app.use('/api/vac', vacRoutes);

// Document Routes (file upload and management)
app.use('/api', documentRoutes);

// Business Portal Routes (public - uses access token for auth)
app.use('/api/business-portal', businessPortalRoutes);

// Admin Dashboard Routes (protected - requires admin role)
app.use('/api/admin', adminRoutes);

// Protected Routes (require authentication)
// To make a route protected, add the requireAuth middleware

// Legacy Routes (for backward compatibility)
// Create or get user session
app.post('/api/users', async (req, res) => {
  try {
    const userId = uuidv4();
    await run('INSERT INTO users (id) VALUES (?)', [userId]);
    res.json({ userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user session' });
  }
});

// Submit valuation form (wizard completion)
app.post('/api/valuate', async (req, res) => {
  try {
    const { userId, inputData } = req.body;

    // Validate required fields
    const requiredFields = [
      'companyName', 'industry', 'annualRevenue', 'ebitda',
      'yearsInBusiness', 'employees', 'growthRate', 'profitMargin',
      'customerRetention', 'topCustomerConcentration', 'debtLevel'
    ];

    for (const field of requiredFields) {
      if (inputData[field] === undefined || inputData[field] === null) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Convert percentage strings to decimals if needed
    const normalizedData = {
      ...inputData,
      growthRate: typeof inputData.growthRate === 'string'
        ? parseFloat(inputData.growthRate) / 100
        : inputData.growthRate,
      profitMargin: typeof inputData.profitMargin === 'string'
        ? parseFloat(inputData.profitMargin) / 100
        : inputData.profitMargin,
      customerRetention: typeof inputData.customerRetention === 'string'
        ? parseFloat(inputData.customerRetention) / 100
        : inputData.customerRetention,
      topCustomerConcentration: typeof inputData.topCustomerConcentration === 'string'
        ? parseFloat(inputData.topCustomerConcentration) / 100
        : inputData.topCustomerConcentration,
      debtLevel: typeof inputData.debtLevel === 'string'
        ? parseFloat(inputData.debtLevel) / 100
        : inputData.debtLevel
    };

    // Calculate valuation
    const valuationResult = calculateValuation(normalizedData);

    // Save to database
    const valuationId = uuidv4();
    await run(
      `INSERT INTO valuations (id, user_id, input_data, valuation_result)
       VALUES (?, ?, ?, ?)`,
      [valuationId, userId, JSON.stringify(normalizedData), JSON.stringify(valuationResult)]
    );

    res.json({ valuationId, ...valuationResult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to calculate valuation', details: err.message });
  }
});

// Get valuation result for dashboard
app.get('/api/valuations/:valuationId', async (req, res) => {
  try {
    const { valuationId } = req.params;

    const valuation = await get(
      'SELECT * FROM valuations WHERE id = ?',
      [valuationId]
    );

    if (!valuation) {
      return res.status(404).json({ error: 'Valuation not found' });
    }

    // Get completed improvements
    const completedImprovements = await all(
      'SELECT improvement_key FROM completed_improvements WHERE valuation_id = ?',
      [valuationId]
    );

    const result = JSON.parse(valuation.valuation_result);
    result.completedImprovements = completedImprovements.map(i => i.improvement_key);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve valuation' });
  }
});

// Mark improvement as completed and recalculate valuation
app.post('/api/valuations/:valuationId/improvements/:improvementKey', async (req, res) => {
  try {
    const { valuationId, improvementKey } = req.params;

    // Check if valuation exists
    const valuation = await get(
      'SELECT * FROM valuations WHERE id = ?',
      [valuationId]
    );

    if (!valuation) {
      return res.status(404).json({ error: 'Valuation not found' });
    }

    // Insert completed improvement
    await run(
      `INSERT OR IGNORE INTO completed_improvements (valuation_id, improvement_key)
       VALUES (?, ?)`,
      [valuationId, improvementKey]
    );

    // Get all completed improvements for recalculation
    const completedImprovements = await all(
      'SELECT improvement_key FROM completed_improvements WHERE valuation_id = ?',
      [valuationId]
    );

    // Recalculate valuation
    const inputData = JSON.parse(valuation.input_data);
    const completedKeys = completedImprovements.map(i => i.improvement_key);
    const updatedResult = calculateValuation(inputData, completedKeys);

    // Update valuation result in database
    await run(
      `UPDATE valuations SET valuation_result = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [JSON.stringify(updatedResult), valuationId]
    );

    updatedResult.completedImprovements = completedKeys;
    res.json(updatedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update improvement', details: err.message });
  }
});

// Update input data and recalculate valuation
app.put('/api/valuations/:valuationId', async (req, res) => {
  try {
    const { valuationId } = req.params;
    const { inputData } = req.body;

    // Check if valuation exists
    const valuation = await get(
      'SELECT * FROM valuations WHERE id = ?',
      [valuationId]
    );

    if (!valuation) {
      return res.status(404).json({ error: 'Valuation not found' });
    }

    // Normalize input data
    const normalizedData = {
      ...inputData,
      growthRate: typeof inputData.growthRate === 'string'
        ? parseFloat(inputData.growthRate) / 100
        : inputData.growthRate,
      profitMargin: typeof inputData.profitMargin === 'string'
        ? parseFloat(inputData.profitMargin) / 100
        : inputData.profitMargin,
      customerRetention: typeof inputData.customerRetention === 'string'
        ? parseFloat(inputData.customerRetention) / 100
        : inputData.customerRetention,
      topCustomerConcentration: typeof inputData.topCustomerConcentration === 'string'
        ? parseFloat(inputData.topCustomerConcentration) / 100
        : inputData.topCustomerConcentration,
      debtLevel: typeof inputData.debtLevel === 'string'
        ? parseFloat(inputData.debtLevel) / 100
        : inputData.debtLevel
    };

    // Get completed improvements
    const completedImprovements = await all(
      'SELECT improvement_key FROM completed_improvements WHERE valuation_id = ?',
      [valuationId]
    );

    // Recalculate valuation
    const completedKeys = completedImprovements.map(i => i.improvement_key);
    const updatedResult = calculateValuation(normalizedData, completedKeys);

    // Update database
    await run(
      `UPDATE valuations SET input_data = ?, valuation_result = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [JSON.stringify(normalizedData), JSON.stringify(updatedResult), valuationId]
    );

    updatedResult.completedImprovements = completedKeys;
    res.json(updatedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update valuation', details: err.message });
  }
});

// Get user's valuation history
app.get('/api/users/:userId/valuations', async (req, res) => {
  try {
    const { userId } = req.params;

    const valuations = await all(
      `SELECT id, created_at, updated_at, valuation_result
       FROM valuations WHERE user_id = ?
       ORDER BY updated_at DESC`,
      [userId]
    );

    const results = valuations.map(v => ({
      id: v.id,
      createdAt: v.created_at,
      updatedAt: v.updated_at,
      ...JSON.parse(v.valuation_result)
    }));

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve valuations' });
  }
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);
