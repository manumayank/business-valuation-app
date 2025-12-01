/**
 * Document Routes
 *
 * API endpoints for document upload, retrieval, and management.
 *
 * Routes:
 * - POST   /api/engagements/:engagementId/documents       Upload document(s)
 * - GET    /api/engagements/:engagementId/documents       List documents for engagement
 * - GET    /api/engagements/:engagementId/documents/checklist  Get document checklist
 * - GET    /api/documents/:documentId                     Get document details
 * - GET    /api/documents/:documentId/download            Download document file
 * - GET    /api/documents/share/:accessToken              Download by access token (public)
 * - PUT    /api/documents/:documentId/status              Update document status (advisor)
 * - DELETE /api/documents/:documentId                     Delete document
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const { requireAuth, requireEngagementAccess, requireRole } = require('../middleware/authMiddleware');
const documentService = require('../services/documentService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '..', 'uploads', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Temporary filename - will be renamed when saved
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Basic mime type check (more detailed validation in service)
  const allowedTypes = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: documentService.MAX_FILE_SIZE,
    files: 10 // Max 10 files per request
  }
});

/**
 * POST /api/engagements/:engagementId/documents
 * Upload document(s) for an engagement
 */
router.post(
  '/engagements/:engagementId/documents',
  requireAuth,
  requireEngagementAccess,
  upload.array('files', 10),
  async (req, res) => {
    try {
      const { engagementId } = req.params;
      const { documentType } = req.body;

      if (!documentType) {
        // Clean up uploaded files
        if (req.files) {
          req.files.forEach(file => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
        }
        return res.status(400).json({
          success: false,
          error: 'Document type is required'
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files uploaded'
        });
      }

      const uploadedDocuments = [];
      const errors = [];

      // Process each file
      for (const file of req.files) {
        try {
          const document = await documentService.saveDocument(
            req.db,
            engagementId,
            req.user.userId,
            documentType,
            file
          );
          uploadedDocuments.push(document);
        } catch (err) {
          errors.push({
            fileName: file.originalname,
            error: err.message
          });
          // Clean up failed file
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
      }

      res.status(201).json({
        success: true,
        data: {
          uploaded: uploadedDocuments,
          errors: errors.length > 0 ? errors : undefined,
          summary: {
            total: req.files.length,
            successful: uploadedDocuments.length,
            failed: errors.length
          }
        }
      });
    } catch (err) {
      console.error('Document upload error:', err);
      // Clean up any uploaded files on error
      if (req.files) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      res.status(500).json({
        success: false,
        error: 'Failed to upload document',
        message: err.message
      });
    }
  }
);

/**
 * GET /api/engagements/:engagementId/documents
 * List all documents for an engagement
 */
router.get(
  '/engagements/:engagementId/documents',
  requireAuth,
  requireEngagementAccess,
  async (req, res) => {
    try {
      const { engagementId } = req.params;

      const documents = await documentService.getDocumentsByEngagement(req.db, engagementId);

      // Group by document type
      const grouped = {};
      documents.forEach(doc => {
        if (!grouped[doc.document_type]) {
          grouped[doc.document_type] = {
            type: doc.document_type,
            name: doc.documentTypeName,
            required: doc.documentTypeRequired,
            documents: []
          };
        }
        grouped[doc.document_type].documents.push(doc);
      });

      res.json({
        success: true,
        data: {
          documents,
          grouped: Object.values(grouped),
          total: documents.length
        }
      });
    } catch (err) {
      console.error('Get documents error:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve documents',
        message: err.message
      });
    }
  }
);

/**
 * GET /api/engagements/:engagementId/documents/checklist
 * Get document upload checklist with completion status
 */
router.get(
  '/engagements/:engagementId/documents/checklist',
  requireAuth,
  requireEngagementAccess,
  async (req, res) => {
    try {
      const { engagementId } = req.params;

      const checklist = await documentService.getDocumentChecklist(req.db, engagementId);

      res.json({
        success: true,
        data: checklist
      });
    } catch (err) {
      console.error('Get checklist error:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve checklist',
        message: err.message
      });
    }
  }
);

/**
 * GET /api/documents/types
 * Get available document types
 */
router.get('/documents/types', requireAuth, (req, res) => {
  const types = Object.entries(documentService.DOCUMENT_TYPES).map(([key, value]) => ({
    type: key,
    name: value.name,
    description: value.description,
    required: value.required,
    maxFiles: value.maxFiles
  }));

  res.json({
    success: true,
    data: types
  });
});

/**
 * GET /api/documents/:documentId
 * Get document details
 */
router.get('/documents/:documentId', requireAuth, async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await documentService.getDocumentById(req.db, documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Check access - user must have access to the engagement
    const { get } = req.db;
    const hasAccess = await get(
      `SELECT 1 FROM engagements e
       JOIN businesses b ON e.business_id = b.id
       WHERE e.id = ? AND (
         b.owner_id = ?
         OR e.assigned_advisor_id = ?
         OR ? IN (SELECT user_id FROM user_roles WHERE role = 'admin')
       )`,
      [document.engagement_id, req.user.userId, req.user.userId, req.user.userId]
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: document
    });
  } catch (err) {
    console.error('Get document error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve document',
      message: err.message
    });
  }
});

/**
 * GET /api/documents/:documentId/download
 * Download document file
 */
router.get('/documents/:documentId/download', requireAuth, async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await documentService.getDocumentById(req.db, documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Check access
    const { get } = req.db;
    const hasAccess = await get(
      `SELECT 1 FROM engagements e
       JOIN businesses b ON e.business_id = b.id
       WHERE e.id = ? AND (
         b.owner_id = ?
         OR e.assigned_advisor_id = ?
         OR ? IN (SELECT user_id FROM user_roles WHERE role = 'admin')
       )`,
      [document.engagement_id, req.user.userId, req.user.userId, req.user.userId]
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const filePath = documentService.getFilePath(document);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on server'
      });
    }

    res.setHeader('Content-Type', document.file_type);
    res.setHeader('Content-Disposition', `attachment; filename="${document.file_name}"`);
    res.setHeader('Content-Length', document.file_size);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error('Download document error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to download document',
      message: err.message
    });
  }
});

/**
 * GET /api/documents/share/:accessToken
 * Download document by access token (for secure sharing without auth)
 */
router.get('/documents/share/:accessToken', async (req, res) => {
  try {
    const { accessToken } = req.params;

    const document = await documentService.getDocumentByAccessToken(req.db, accessToken);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found or link expired'
      });
    }

    const filePath = documentService.getFilePath(document);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on server'
      });
    }

    res.setHeader('Content-Type', document.file_type);
    res.setHeader('Content-Disposition', `attachment; filename="${document.file_name}"`);
    res.setHeader('Content-Length', document.file_size);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error('Share download error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to download document'
    });
  }
});

/**
 * PUT /api/documents/:documentId/status
 * Update document status (for advisor review)
 */
router.put('/documents/:documentId/status', requireAuth, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { status, advisorNotes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    // Get document to check access
    const document = await documentService.getDocumentById(req.db, documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Check if user is advisor or admin for this engagement
    const { get } = req.db;
    const hasAccess = await get(
      `SELECT 1 FROM engagements e
       WHERE e.id = ? AND (
         e.assigned_advisor_id = ?
         OR ? IN (SELECT user_id FROM user_roles WHERE role = 'admin')
       )`,
      [document.engagement_id, req.user.userId, req.user.userId]
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Only advisors or admins can update document status'
      });
    }

    const updated = await documentService.updateDocumentStatus(
      req.db,
      documentId,
      status,
      advisorNotes || null,
      req.user.userId
    );

    res.json({
      success: true,
      data: updated
    });
  } catch (err) {
    console.error('Update document status error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update document status',
      message: err.message
    });
  }
});

/**
 * DELETE /api/documents/:documentId
 * Delete a document
 */
router.delete('/documents/:documentId', requireAuth, async (req, res) => {
  try {
    const { documentId } = req.params;

    // Get document to check access
    const document = await documentService.getDocumentById(req.db, documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Check if user is uploader, business owner, or admin
    const { get } = req.db;
    const canDelete = await get(
      `SELECT 1 FROM documents d
       JOIN engagements e ON d.engagement_id = e.id
       JOIN businesses b ON e.business_id = b.id
       WHERE d.id = ? AND (
         d.uploaded_by = ?
         OR b.owner_id = ?
         OR ? IN (SELECT user_id FROM user_roles WHERE role = 'admin')
       )`,
      [documentId, req.user.userId, req.user.userId, req.user.userId]
    );

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this document'
      });
    }

    await documentService.deleteDocument(req.db, documentId, req.user.userId);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (err) {
    console.error('Delete document error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete document',
      message: err.message
    });
  }
});

// Error handler for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: `File too large. Maximum size is ${documentService.MAX_FILE_SIZE / 1024 / 1024}MB`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum 10 files per upload'
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  next();
});

module.exports = router;
