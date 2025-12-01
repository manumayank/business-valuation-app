/**
 * Document Service Tests
 */

const documentService = require('./documentService');
const path = require('path');
const fs = require('fs');

describe('Document Service', () => {
  describe('DOCUMENT_TYPES', () => {
    it('has all required document types defined', () => {
      const expectedTypes = [
        'pnl', 'balance_sheet', 'tax_return_business', 'tax_return_personal',
        'ar_aging', 'ap_aging', 'fixed_assets', 'bank_statements', 'forecasts', 'other'
      ];

      expectedTypes.forEach(type => {
        expect(documentService.DOCUMENT_TYPES[type]).toBeDefined();
      });
    });

    it('each document type has required properties', () => {
      Object.entries(documentService.DOCUMENT_TYPES).forEach(([type, config]) => {
        expect(config.name).toBeDefined();
        expect(config.description).toBeDefined();
        expect(typeof config.required).toBe('boolean');
        expect(typeof config.maxFiles).toBe('number');
        expect(Array.isArray(config.allowedMimeTypes)).toBe(true);
      });
    });

    it('required document types are marked correctly', () => {
      expect(documentService.DOCUMENT_TYPES.pnl.required).toBe(true);
      expect(documentService.DOCUMENT_TYPES.balance_sheet.required).toBe(true);
      expect(documentService.DOCUMENT_TYPES.tax_return_business.required).toBe(true);
      expect(documentService.DOCUMENT_TYPES.other.required).toBe(false);
    });
  });

  describe('DOCUMENT_STATUS', () => {
    it('has all status values defined', () => {
      expect(documentService.DOCUMENT_STATUS.UPLOADED).toBe('uploaded');
      expect(documentService.DOCUMENT_STATUS.PENDING_REVIEW).toBe('pending_review');
      expect(documentService.DOCUMENT_STATUS.ACCEPTED).toBe('accepted');
      expect(documentService.DOCUMENT_STATUS.REJECTED).toBe('rejected');
      expect(documentService.DOCUMENT_STATUS.NEEDS_CLARIFICATION).toBe('needs_clarification');
    });
  });

  describe('validateDocumentType', () => {
    it('returns valid for known document types', () => {
      const result = documentService.validateDocumentType('pnl');
      expect(result.valid).toBe(true);
    });

    it('returns invalid for unknown document types', () => {
      const result = documentService.validateDocumentType('invalid_type');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid document type');
    });
  });

  describe('validateFileType', () => {
    it('returns valid for allowed mime types', () => {
      const result = documentService.validateFileType('pnl', 'application/pdf');
      expect(result.valid).toBe(true);
    });

    it('returns valid for Excel files on financial documents', () => {
      const result = documentService.validateFileType('pnl', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(result.valid).toBe(true);
    });

    it('returns invalid for disallowed mime types', () => {
      const result = documentService.validateFileType('pnl', 'application/zip');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('returns invalid for unknown document type', () => {
      const result = documentService.validateFileType('invalid_type', 'application/pdf');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    it('returns valid for files under the limit', () => {
      const result = documentService.validateFileSize(1024 * 1024); // 1MB
      expect(result.valid).toBe(true);
    });

    it('returns valid for files at the limit', () => {
      const result = documentService.validateFileSize(documentService.MAX_FILE_SIZE);
      expect(result.valid).toBe(true);
    });

    it('returns invalid for files over the limit', () => {
      const result = documentService.validateFileSize(documentService.MAX_FILE_SIZE + 1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });
  });

  describe('generateAccessToken', () => {
    it('generates a 64-character hex string', () => {
      const token = documentService.generateAccessToken();
      expect(token).toHaveLength(64);
      expect(/^[a-f0-9]+$/.test(token)).toBe(true);
    });

    it('generates unique tokens', () => {
      const token1 = documentService.generateAccessToken();
      const token2 = documentService.generateAccessToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('getUploadsDir', () => {
    it('returns the uploads directory path', () => {
      const uploadsDir = documentService.getUploadsDir();
      expect(uploadsDir).toContain('uploads');
    });

    it('creates the directory if it does not exist', () => {
      const uploadsDir = documentService.getUploadsDir();
      expect(fs.existsSync(uploadsDir)).toBe(true);
    });
  });

  describe('getEngagementDir', () => {
    it('returns engagement-specific directory path', () => {
      const engagementId = 'test-engagement-123';
      const engagementDir = documentService.getEngagementDir(engagementId);
      expect(engagementDir).toContain(engagementId);
    });

    it('creates the engagement directory if needed', () => {
      const engagementId = 'test-engagement-' + Date.now();
      const engagementDir = documentService.getEngagementDir(engagementId);
      expect(fs.existsSync(engagementDir)).toBe(true);

      // Cleanup
      fs.rmdirSync(engagementDir);
    });
  });

  describe('Database Integration', () => {
    let mockDb;

    beforeEach(() => {
      mockDb = {
        run: jest.fn().mockResolvedValue({ lastID: 1 }),
        get: jest.fn().mockResolvedValue(null),
        all: jest.fn().mockResolvedValue([])
      };
    });

    describe('checkTotalSize', () => {
      it('returns valid when under total limit', async () => {
        mockDb.get.mockResolvedValue({ total_size: 50 * 1024 * 1024 }); // 50MB

        const result = await documentService.checkTotalSize(mockDb, 'eng-123', 10 * 1024 * 1024);
        expect(result.valid).toBe(true);
      });

      it('returns invalid when exceeding total limit', async () => {
        mockDb.get.mockResolvedValue({ total_size: 95 * 1024 * 1024 }); // 95MB

        const result = await documentService.checkTotalSize(mockDb, 'eng-123', 10 * 1024 * 1024);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('exceed the total storage limit');
      });

      it('handles null total size', async () => {
        mockDb.get.mockResolvedValue(null);

        const result = await documentService.checkTotalSize(mockDb, 'eng-123', 10 * 1024 * 1024);
        expect(result.valid).toBe(true);
      });
    });

    describe('checkDocumentCountLimit', () => {
      it('returns valid when under document count limit', async () => {
        mockDb.get.mockResolvedValue({ count: 2 });

        const result = await documentService.checkDocumentCountLimit(mockDb, 'eng-123', 'pnl');
        expect(result.valid).toBe(true);
      });

      it('returns invalid when at document count limit', async () => {
        mockDb.get.mockResolvedValue({ count: 5 }); // Max for P&L is 5

        const result = await documentService.checkDocumentCountLimit(mockDb, 'eng-123', 'pnl');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Maximum number');
      });
    });

    describe('getDocumentsByEngagement', () => {
      it('returns empty array when no documents', async () => {
        mockDb.all.mockResolvedValue([]);

        const result = await documentService.getDocumentsByEngagement(mockDb, 'eng-123');
        expect(result).toEqual([]);
      });

      it('returns documents with type info added', async () => {
        mockDb.all.mockResolvedValue([
          { id: 'doc-1', document_type: 'pnl', file_name: 'test.pdf' }
        ]);

        const result = await documentService.getDocumentsByEngagement(mockDb, 'eng-123');
        expect(result[0].documentTypeName).toBe('Profit & Loss Statement');
        expect(result[0].documentTypeRequired).toBe(true);
      });
    });

    describe('getDocumentById', () => {
      it('returns null when document not found', async () => {
        mockDb.get.mockResolvedValue(null);

        const result = await documentService.getDocumentById(mockDb, 'doc-123');
        expect(result).toBeNull();
      });

      it('returns document with type info', async () => {
        mockDb.get.mockResolvedValue({
          id: 'doc-1',
          document_type: 'balance_sheet',
          file_name: 'balance.pdf'
        });

        const result = await documentService.getDocumentById(mockDb, 'doc-1');
        expect(result.documentTypeName).toBe('Balance Sheet');
      });
    });

    describe('getDocumentChecklist', () => {
      it('returns checklist with all document types', async () => {
        mockDb.all.mockResolvedValue([]);

        const result = await documentService.getDocumentChecklist(mockDb, 'eng-123');

        expect(result.checklist).toHaveLength(Object.keys(documentService.DOCUMENT_TYPES).length);
        expect(result.summary).toBeDefined();
        expect(result.summary.completionPercentage).toBeDefined();
      });

      it('calculates completion percentage correctly', async () => {
        mockDb.all.mockResolvedValue([
          { document_type: 'pnl', count: 1, statuses: 'accepted' },
          { document_type: 'balance_sheet', count: 1, statuses: 'accepted' },
          { document_type: 'tax_return_business', count: 1, statuses: 'accepted' }
        ]);

        const result = await documentService.getDocumentChecklist(mockDb, 'eng-123');

        expect(result.summary.completedRequired).toBe(3);
        expect(result.summary.completionPercentage).toBe(100);
      });

      it('marks documents as missing when not uploaded', async () => {
        mockDb.all.mockResolvedValue([]);

        const result = await documentService.getDocumentChecklist(mockDb, 'eng-123');

        const pnlItem = result.checklist.find(item => item.documentType === 'pnl');
        expect(pnlItem.status).toBe('missing');
        expect(pnlItem.uploadedCount).toBe(0);
      });

      it('marks documents as pending_review when uploaded but not accepted', async () => {
        mockDb.all.mockResolvedValue([
          { document_type: 'pnl', count: 1, statuses: 'uploaded' }
        ]);

        const result = await documentService.getDocumentChecklist(mockDb, 'eng-123');

        const pnlItem = result.checklist.find(item => item.documentType === 'pnl');
        expect(pnlItem.status).toBe('pending_review');
      });
    });

    describe('updateDocumentStatus', () => {
      it('throws error for invalid status', async () => {
        await expect(
          documentService.updateDocumentStatus(mockDb, 'doc-123', 'invalid_status', null, 'user-1')
        ).rejects.toThrow('Invalid status');
      });

      it('updates status and creates audit log', async () => {
        mockDb.get.mockResolvedValue({
          id: 'doc-123',
          document_type: 'pnl',
          status: 'accepted'
        });

        await documentService.updateDocumentStatus(mockDb, 'doc-123', 'accepted', 'Looks good', 'user-1');

        expect(mockDb.run).toHaveBeenCalledTimes(2); // Update + audit log
      });
    });
  });

  describe('Constants', () => {
    it('MAX_FILE_SIZE is 25MB', () => {
      expect(documentService.MAX_FILE_SIZE).toBe(25 * 1024 * 1024);
    });

    it('MAX_TOTAL_SIZE is 100MB', () => {
      expect(documentService.MAX_TOTAL_SIZE).toBe(100 * 1024 * 1024);
    });
  });
});
