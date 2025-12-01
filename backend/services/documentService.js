/**
 * Document Service
 *
 * Handles file uploads, storage, validation, and retrieval for engagement documents.
 * Supported document types: P&L, Balance Sheet, Tax Returns, AR/AP Aging, Fixed Assets, Bank Statements, Forecasts
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Define document types and their configurations
const DOCUMENT_TYPES = {
  'pnl': {
    name: 'Profit & Loss Statement',
    description: 'Income statement showing revenue and expenses',
    required: true,
    maxFiles: 5, // Up to 5 years
    allowedMimeTypes: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/png', 'image/jpeg']
  },
  'balance_sheet': {
    name: 'Balance Sheet',
    description: 'Statement of assets, liabilities, and equity',
    required: true,
    maxFiles: 5,
    allowedMimeTypes: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/png', 'image/jpeg']
  },
  'tax_return_business': {
    name: 'Business Tax Return',
    description: 'Corporate or business tax returns',
    required: true,
    maxFiles: 5,
    allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg']
  },
  'tax_return_personal': {
    name: 'Personal Tax Return',
    description: 'Owner personal tax returns (Schedule C, K-1, etc.)',
    required: false,
    maxFiles: 3,
    allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg']
  },
  'ar_aging': {
    name: 'Accounts Receivable Aging',
    description: 'AR aging report showing outstanding customer invoices',
    required: false,
    maxFiles: 2,
    allowedMimeTypes: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/png', 'image/jpeg']
  },
  'ap_aging': {
    name: 'Accounts Payable Aging',
    description: 'AP aging report showing outstanding vendor bills',
    required: false,
    maxFiles: 2,
    allowedMimeTypes: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/png', 'image/jpeg']
  },
  'fixed_assets': {
    name: 'Fixed Assets / FF&E List',
    description: 'List of furniture, fixtures, and equipment',
    required: false,
    maxFiles: 2,
    allowedMimeTypes: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/png', 'image/jpeg']
  },
  'bank_statements': {
    name: 'Bank Statements',
    description: 'Recent bank account statements',
    required: false,
    maxFiles: 12, // Up to 12 months
    allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg']
  },
  'forecasts': {
    name: 'Forecasts / Budgets',
    description: 'Financial projections and budgets',
    required: false,
    maxFiles: 3,
    allowedMimeTypes: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/png', 'image/jpeg']
  },
  'other': {
    name: 'Other Documents',
    description: 'Additional supporting documents',
    required: false,
    maxFiles: 10,
    allowedMimeTypes: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/png', 'image/jpeg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  }
};

// File size limits (in bytes)
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB per file
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB per engagement

// Document status values
const DOCUMENT_STATUS = {
  UPLOADED: 'uploaded',
  PENDING_REVIEW: 'pending_review',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  NEEDS_CLARIFICATION: 'needs_clarification'
};

/**
 * Get the uploads directory path
 */
const getUploadsDir = () => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
};

/**
 * Get engagement-specific uploads directory
 */
const getEngagementDir = (engagementId) => {
  const engagementDir = path.join(getUploadsDir(), engagementId);
  if (!fs.existsSync(engagementDir)) {
    fs.mkdirSync(engagementDir, { recursive: true });
  }
  return engagementDir;
};

/**
 * Generate a secure access token for document sharing
 */
const generateAccessToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Validate document type
 */
const validateDocumentType = (documentType) => {
  if (!DOCUMENT_TYPES[documentType]) {
    return {
      valid: false,
      error: `Invalid document type: ${documentType}. Valid types are: ${Object.keys(DOCUMENT_TYPES).join(', ')}`
    };
  }
  return { valid: true };
};

/**
 * Validate file type (MIME type)
 */
const validateFileType = (documentType, mimeType) => {
  const config = DOCUMENT_TYPES[documentType];
  if (!config) {
    return { valid: false, error: 'Invalid document type' };
  }

  if (!config.allowedMimeTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `File type ${mimeType} not allowed for ${config.name}. Allowed types: ${config.allowedMimeTypes.join(', ')}`
    };
  }

  return { valid: true };
};

/**
 * Validate file size
 */
const validateFileSize = (fileSize) => {
  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size ${(fileSize / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }
  return { valid: true };
};

/**
 * Check if engagement has exceeded total file size limit
 */
const checkTotalSize = async (db, engagementId, newFileSize) => {
  const { get } = db;

  const result = await get(
    'SELECT SUM(file_size) as total_size FROM documents WHERE engagement_id = ?',
    [engagementId]
  );

  const currentTotal = result?.total_size || 0;
  const newTotal = currentTotal + newFileSize;

  if (newTotal > MAX_TOTAL_SIZE) {
    return {
      valid: false,
      error: `Adding this file would exceed the total storage limit of ${MAX_TOTAL_SIZE / 1024 / 1024}MB for this engagement`
    };
  }

  return { valid: true };
};

/**
 * Check document count limit for a type
 */
const checkDocumentCountLimit = async (db, engagementId, documentType) => {
  const { get } = db;
  const config = DOCUMENT_TYPES[documentType];

  if (!config) {
    return { valid: false, error: 'Invalid document type' };
  }

  const result = await get(
    'SELECT COUNT(*) as count FROM documents WHERE engagement_id = ? AND document_type = ?',
    [engagementId, documentType]
  );

  if (result.count >= config.maxFiles) {
    return {
      valid: false,
      error: `Maximum number of ${config.name} documents (${config.maxFiles}) reached`
    };
  }

  return { valid: true };
};

/**
 * Save uploaded file and create database record
 */
const saveDocument = async (db, engagementId, uploadedBy, documentType, file) => {
  const { run, get } = db;

  // Validate document type
  const typeValidation = validateDocumentType(documentType);
  if (!typeValidation.valid) {
    throw new Error(typeValidation.error);
  }

  // Validate file type
  const fileTypeValidation = validateFileType(documentType, file.mimetype);
  if (!fileTypeValidation.valid) {
    throw new Error(fileTypeValidation.error);
  }

  // Validate file size
  const sizeValidation = validateFileSize(file.size);
  if (!sizeValidation.valid) {
    throw new Error(sizeValidation.error);
  }

  // Check total size limit
  const totalSizeCheck = await checkTotalSize(db, engagementId, file.size);
  if (!totalSizeCheck.valid) {
    throw new Error(totalSizeCheck.error);
  }

  // Check document count limit
  const countCheck = await checkDocumentCountLimit(db, engagementId, documentType);
  if (!countCheck.valid) {
    throw new Error(countCheck.error);
  }

  // Generate document ID and access token
  const documentId = uuidv4();
  const accessToken = generateAccessToken();

  // Create engagement directory if needed
  const engagementDir = getEngagementDir(engagementId);

  // Generate safe filename
  const fileExt = path.extname(file.originalname);
  const safeFilename = `${documentType}_${Date.now()}${fileExt}`;
  const filePath = path.join(engagementDir, safeFilename);

  // Move file from temp to permanent location
  fs.renameSync(file.path, filePath);

  // Store relative path in database
  const relativePath = path.join(engagementId, safeFilename);

  // Create database record
  await run(
    `INSERT INTO documents (
      id, engagement_id, document_type, file_name, file_path, file_size, file_type,
      upload_date, uploaded_by, status, access_token
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?)`,
    [
      documentId,
      engagementId,
      documentType,
      file.originalname,
      relativePath,
      file.size,
      file.mimetype,
      uploadedBy,
      DOCUMENT_STATUS.UPLOADED,
      accessToken
    ]
  );

  // Return the created document
  const document = await get('SELECT * FROM documents WHERE id = ?', [documentId]);

  return {
    ...document,
    documentTypeName: DOCUMENT_TYPES[documentType].name
  };
};

/**
 * Get documents for an engagement
 */
const getDocumentsByEngagement = async (db, engagementId) => {
  const { all } = db;

  const documents = await all(
    `SELECT d.*, u.full_name as uploader_name
     FROM documents d
     LEFT JOIN users u ON d.uploaded_by = u.id
     WHERE d.engagement_id = ?
     ORDER BY d.document_type, d.upload_date DESC`,
    [engagementId]
  );

  // Add document type info
  return documents.map(doc => ({
    ...doc,
    documentTypeName: DOCUMENT_TYPES[doc.document_type]?.name || doc.document_type,
    documentTypeRequired: DOCUMENT_TYPES[doc.document_type]?.required || false
  }));
};

/**
 * Get document by ID
 */
const getDocumentById = async (db, documentId) => {
  const { get } = db;

  const document = await get(
    `SELECT d.*, u.full_name as uploader_name
     FROM documents d
     LEFT JOIN users u ON d.uploaded_by = u.id
     WHERE d.id = ?`,
    [documentId]
  );

  if (!document) {
    return null;
  }

  return {
    ...document,
    documentTypeName: DOCUMENT_TYPES[document.document_type]?.name || document.document_type
  };
};

/**
 * Get document by access token (for secure sharing)
 */
const getDocumentByAccessToken = async (db, accessToken) => {
  const { get } = db;

  const document = await get(
    'SELECT * FROM documents WHERE access_token = ?',
    [accessToken]
  );

  return document;
};

/**
 * Update document status (advisor review)
 */
const updateDocumentStatus = async (db, documentId, status, advisorNotes, updatedBy) => {
  const { run, get } = db;

  // Validate status
  if (!Object.values(DOCUMENT_STATUS).includes(status)) {
    throw new Error(`Invalid status: ${status}. Valid statuses are: ${Object.values(DOCUMENT_STATUS).join(', ')}`);
  }

  await run(
    `UPDATE documents SET status = ?, advisor_notes = ? WHERE id = ?`,
    [status, advisorNotes, documentId]
  );

  // Log to audit trail
  await run(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [
      updatedBy,
      'document_status_updated',
      'document',
      documentId,
      JSON.stringify({ status, advisorNotes })
    ]
  );

  return await getDocumentById(db, documentId);
};

/**
 * Delete document
 */
const deleteDocument = async (db, documentId, deletedBy) => {
  const { run, get } = db;

  // Get document to find file path
  const document = await get('SELECT * FROM documents WHERE id = ?', [documentId]);

  if (!document) {
    throw new Error('Document not found');
  }

  // Delete file from disk
  const fullPath = path.join(getUploadsDir(), document.file_path);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }

  // Delete database record
  await run('DELETE FROM documents WHERE id = ?', [documentId]);

  // Log to audit trail
  await run(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [
      deletedBy,
      'document_deleted',
      'document',
      documentId,
      JSON.stringify({ fileName: document.file_name, documentType: document.document_type })
    ]
  );

  return { success: true };
};

/**
 * Get file path for download
 */
const getFilePath = (document) => {
  return path.join(getUploadsDir(), document.file_path);
};

/**
 * Get document checklist for engagement (which required docs are missing)
 */
const getDocumentChecklist = async (db, engagementId) => {
  const { all } = db;

  // Get existing documents grouped by type
  const existingDocs = await all(
    `SELECT document_type, COUNT(*) as count, GROUP_CONCAT(status) as statuses
     FROM documents
     WHERE engagement_id = ?
     GROUP BY document_type`,
    [engagementId]
  );

  const existingMap = {};
  existingDocs.forEach(doc => {
    existingMap[doc.document_type] = {
      count: doc.count,
      statuses: doc.statuses.split(',')
    };
  });

  // Build checklist
  const checklist = Object.entries(DOCUMENT_TYPES).map(([type, config]) => {
    const existing = existingMap[type] || { count: 0, statuses: [] };
    const hasAccepted = existing.statuses.includes(DOCUMENT_STATUS.ACCEPTED);

    return {
      documentType: type,
      name: config.name,
      description: config.description,
      required: config.required,
      maxFiles: config.maxFiles,
      uploadedCount: existing.count,
      hasAcceptedDocument: hasAccepted,
      status: existing.count === 0 ? 'missing' : (hasAccepted ? 'complete' : 'pending_review')
    };
  });

  // Calculate completion percentage
  const requiredTypes = checklist.filter(item => item.required);
  const completedRequired = requiredTypes.filter(item => item.hasAcceptedDocument);
  const completionPercentage = requiredTypes.length > 0
    ? Math.round((completedRequired.length / requiredTypes.length) * 100)
    : 100;

  return {
    checklist,
    summary: {
      totalRequired: requiredTypes.length,
      completedRequired: completedRequired.length,
      completionPercentage,
      totalUploaded: existingDocs.reduce((sum, doc) => sum + doc.count, 0)
    }
  };
};

module.exports = {
  DOCUMENT_TYPES,
  DOCUMENT_STATUS,
  MAX_FILE_SIZE,
  MAX_TOTAL_SIZE,
  validateDocumentType,
  validateFileType,
  validateFileSize,
  checkTotalSize,
  checkDocumentCountLimit,
  saveDocument,
  getDocumentsByEngagement,
  getDocumentById,
  getDocumentByAccessToken,
  updateDocumentStatus,
  deleteDocument,
  getFilePath,
  getDocumentChecklist,
  generateAccessToken,
  getUploadsDir,
  getEngagementDir
};
