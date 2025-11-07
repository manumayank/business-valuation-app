const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { initializeDatabase, run, get, all } = require('./db');
const { calculateValuation } = require('./valuationEngine');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase().then(() => {
  console.log('Database initialized');
}).catch(err => {
  console.error('Database initialization error:', err);
});

// Routes

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
