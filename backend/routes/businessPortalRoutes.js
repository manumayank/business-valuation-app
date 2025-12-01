/**
 * Business Portal Routes
 * Public routes for businesses to access their engagement via access token
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { get, all, run } = require('../db');

// Middleware to validate access token
const validateAccessToken = async (req, res, next) => {
  const { accessToken } = req.params;

  if (!accessToken) {
    return res.status(400).json({ error: 'Access token is required' });
  }

  try {
    // Find engagement by access token
    const engagement = await get(`
      SELECT e.*, b.name as businessName, b.industry, b.contact_email,
             u.full_name as advisorName, u.email as advisorEmail
      FROM engagements e
      JOIN businesses b ON e.business_id = b.id
      JOIN users u ON e.advisor_id = u.id
      WHERE e.access_token = ?
    `, [accessToken]);

    if (!engagement) {
      return res.status(404).json({ error: 'Invalid or expired access token' });
    }

    // Check if engagement is still accessible (not archived/cancelled)
    if (engagement.status === 'archived' || engagement.status === 'cancelled') {
      return res.status(403).json({ error: 'This engagement is no longer accessible' });
    }

    req.engagement = engagement;
    next();
  } catch (error) {
    console.error('Error validating access token:', error);
    res.status(500).json({ error: 'Failed to validate access' });
  }
};

// GET /api/business-portal/:accessToken - Get engagement data
router.get('/:accessToken', validateAccessToken, async (req, res) => {
  try {
    const engagement = req.engagement;

    // Get questionnaire responses
    const responses = await all(`
      SELECT * FROM questionnaire_responses
      WHERE engagement_id = ?
      ORDER BY id DESC
    `, [engagement.id]);

    // Get uploaded documents
    const documents = await all(`
      SELECT id, file_name, file_type, file_size, document_type as category, upload_date as uploaded_at
      FROM documents
      WHERE engagement_id = ?
      ORDER BY upload_date DESC
    `, [engagement.id]);

    // Get engagement progress
    const progress = calculateProgress(engagement, responses, documents);

    res.json({
      engagement: {
        id: engagement.id,
        type: engagement.engagement_type,
        status: engagement.status,
        businessName: engagement.businessName,
        industry: engagement.industry,
        advisorName: engagement.advisorName,
        advisorEmail: engagement.advisorEmail,
        createdAt: engagement.created_at,
        updatedAt: engagement.updated_at
      },
      responses: responses.length > 0 ? JSON.parse(responses[0].responses || '{}') : {},
      documents: documents,
      progress: progress
    });
  } catch (error) {
    console.error('Error fetching business portal data:', error);
    res.status(500).json({ error: 'Failed to load engagement data' });
  }
});

// POST /api/business-portal/:accessToken/responses - Save questionnaire responses
router.post('/:accessToken/responses', validateAccessToken, async (req, res) => {
  try {
    const engagement = req.engagement;
    const { responses, sectionId } = req.body;

    if (!responses || typeof responses !== 'object') {
      return res.status(400).json({ error: 'Invalid responses format' });
    }

    // Check for existing response record
    const existingResponse = await get(`
      SELECT id, responses FROM questionnaire_responses
      WHERE engagement_id = ?
      ORDER BY id DESC
      LIMIT 1
    `, [engagement.id]);

    if (existingResponse) {
      // Merge with existing responses
      const existingData = JSON.parse(existingResponse.responses || '{}');
      const mergedResponses = { ...existingData, ...responses };

      await run(`
        UPDATE questionnaire_responses
        SET responses = ?
        WHERE id = ?
      `, [JSON.stringify(mergedResponses), existingResponse.id]);
    } else {
      // Create new response record
      await run(`
        INSERT INTO questionnaire_responses (engagement_id, question_id, responses)
        VALUES (?, 0, ?)
      `, [engagement.id, JSON.stringify(responses)]);
    }

    // Update engagement status if needed
    if (engagement.status === 'created') {
      await run(`
        UPDATE engagements SET status = 'intake', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [engagement.id]);
    }

    res.json({ success: true, message: 'Responses saved successfully' });
  } catch (error) {
    console.error('Error saving responses:', error);
    res.status(500).json({ error: 'Failed to save responses' });
  }
});

// POST /api/business-portal/:accessToken/submit - Submit completed questionnaire
router.post('/:accessToken/submit', validateAccessToken, async (req, res) => {
  try {
    const engagement = req.engagement;

    // Update engagement status to review
    await run(`
      UPDATE engagements
      SET status = 'review',
          questionnaire_completed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [engagement.id]);

    // Log activity
    await run(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
      VALUES (?, 'questionnaire_submitted', 'engagement', ?, ?, CURRENT_TIMESTAMP)
    `, [engagement.advisor_id, engagement.id, JSON.stringify({
      businessName: engagement.businessName,
      engagementType: engagement.engagement_type
    })]);

    res.json({
      success: true,
      message: 'Questionnaire submitted successfully. Your advisor will review your responses.'
    });
  } catch (error) {
    console.error('Error submitting questionnaire:', error);
    res.status(500).json({ error: 'Failed to submit questionnaire' });
  }
});

// GET /api/business-portal/:accessToken/reports - Get available reports
router.get('/:accessToken/reports', validateAccessToken, async (req, res) => {
  try {
    const engagement = req.engagement;

    // Get generated reports for this engagement
    const reports = await all(`
      SELECT id, report_type, title, generated_at, file_path
      FROM engagement_reports
      WHERE engagement_id = ? AND is_shared_with_business = 1
      ORDER BY generated_at DESC
    `, [engagement.id]);

    res.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to load reports' });
  }
});

// Helper function to calculate progress
function calculateProgress(engagement, responses, documents) {
  let questionnaireProgress = 0;
  let documentsProgress = 0;

  // Calculate questionnaire progress based on responses
  if (responses.length > 0) {
    const responseData = JSON.parse(responses[0].responses || '{}');
    const totalFields = getExpectedFieldCount(engagement.engagement_type);
    const filledFields = Object.keys(responseData).filter(k => responseData[k] !== '' && responseData[k] !== null).length;
    questionnaireProgress = Math.min(100, Math.round((filledFields / totalFields) * 100));
  }

  // Calculate documents progress
  const requiredDocs = getRequiredDocuments(engagement.engagement_type);
  const uploadedCategories = [...new Set(documents.map(d => d.category))];
  documentsProgress = Math.min(100, Math.round((uploadedCategories.length / requiredDocs.length) * 100));

  // Overall progress
  const overallProgress = Math.round((questionnaireProgress + documentsProgress) / 2);

  return {
    overall: overallProgress,
    questionnaire: questionnaireProgress,
    documents: documentsProgress,
    status: engagement.status
  };
}

// Get expected field count for engagement type
function getExpectedFieldCount(engagementType) {
  const fieldCounts = {
    'vac': 25,
    'valuation': 20,
    'exit_planning': 22,
    'mna': 28
  };
  return fieldCounts[engagementType] || 20;
}

// Get required documents for engagement type
function getRequiredDocuments(engagementType) {
  const requiredDocs = {
    'vac': ['financial_statements', 'tax_returns', 'organization_chart'],
    'valuation': ['financial_statements', 'tax_returns', 'asset_list'],
    'exit_planning': ['financial_statements', 'tax_returns', 'organization_chart', 'contracts'],
    'mna': ['financial_statements', 'tax_returns', 'legal_documents', 'contracts', 'customer_list']
  };
  return requiredDocs[engagementType] || ['financial_statements'];
}

module.exports = router;
