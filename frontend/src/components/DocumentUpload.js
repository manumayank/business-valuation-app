import React, { useState, useCallback, useEffect } from 'react';
import {
  getDocumentTypes,
  uploadDocuments,
  getEngagementDocuments,
  getDocumentChecklist,
  deleteDocument,
  downloadDocument
} from '../services/api';
import './DocumentUpload.css';

const DocumentUpload = ({ engagementId, onUploadComplete }) => {
  const [documentTypes, setDocumentTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [checklist, setChecklist] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Load document types and existing documents on mount
  useEffect(() => {
    loadDocumentTypes();
    if (engagementId) {
      loadDocuments();
      loadChecklist();
    }
  }, [engagementId]);

  const loadDocumentTypes = async () => {
    try {
      const response = await getDocumentTypes();
      if (response.success) {
        setDocumentTypes(response.data);
        if (response.data.length > 0) {
          setSelectedType(response.data[0].type);
        }
      }
    } catch (err) {
      console.error('Failed to load document types:', err);
    }
  };

  const loadDocuments = async () => {
    try {
      const response = await getEngagementDocuments(engagementId);
      if (response.success) {
        setUploadedDocuments(response.data.documents);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const loadChecklist = async () => {
    try {
      const response = await getDocumentChecklist(engagementId);
      if (response.success) {
        setChecklist(response.data);
      }
    } catch (err) {
      console.error('Failed to load checklist:', err);
    }
  };

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  // Handle file input change
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  // Remove file from list
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload files
  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    if (!selectedType) {
      setError('Please select a document type');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);

    try {
      const response = await uploadDocuments(
        engagementId,
        selectedType,
        files,
        (progress) => setUploadProgress(progress)
      );

      if (response.success) {
        const { summary, errors } = response.data;

        if (summary.successful > 0) {
          setSuccess(`Successfully uploaded ${summary.successful} file(s)`);
          setFiles([]);
          loadDocuments();
          loadChecklist();

          if (onUploadComplete) {
            onUploadComplete(response.data);
          }
        }

        if (errors && errors.length > 0) {
          setError(`Some files failed to upload: ${errors.map(e => e.fileName).join(', ')}`);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload files');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Delete document
  const handleDelete = async (documentId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      await deleteDocument(documentId);
      loadDocuments();
      loadChecklist();
      setSuccess('Document deleted successfully');
    } catch (err) {
      setError('Failed to delete document');
    }
  };

  // Download document
  const handleDownload = async (documentId, fileName) => {
    try {
      const blob = await downloadDocument(documentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download document');
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'accepted': return 'badge-success';
      case 'rejected': return 'badge-danger';
      case 'needs_clarification': return 'badge-warning';
      case 'pending_review': return 'badge-info';
      default: return 'badge-secondary';
    }
  };

  return (
    <div className="document-upload-container">
      {/* Checklist Summary */}
      {checklist && (
        <div className="checklist-summary">
          <h4>Document Checklist</h4>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${checklist.summary.completionPercentage}%` }}
            />
          </div>
          <p className="progress-text">
            {checklist.summary.completedRequired} of {checklist.summary.totalRequired} required documents completed
            ({checklist.summary.completionPercentage}%)
          </p>

          <div className="checklist-items">
            {checklist.checklist.map((item) => (
              <div key={item.documentType} className={`checklist-item ${item.status}`}>
                <span className={`status-icon ${item.status}`}>
                  {item.status === 'complete' ? '\u2713' : item.status === 'pending_review' ? '\u2022' : '\u2717'}
                </span>
                <span className="item-name">
                  {item.name}
                  {item.required && <span className="required-badge">Required</span>}
                </span>
                <span className="item-count">
                  {item.uploadedCount} / {item.maxFiles}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Section */}
      <div className="upload-section">
        <h4>Upload Documents</h4>

        {/* Document Type Selector */}
        <div className="form-group">
          <label>Document Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            disabled={uploading}
          >
            {documentTypes.map((type) => (
              <option key={type.type} value={type.type}>
                {type.name} {type.required ? '(Required)' : '(Optional)'}
              </option>
            ))}
          </select>
          {selectedType && documentTypes.find(t => t.type === selectedType) && (
            <small className="type-description">
              {documentTypes.find(t => t.type === selectedType).description}
            </small>
          )}
        </div>

        {/* Drag and Drop Zone */}
        <div
          className={`drop-zone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            accept=".pdf,.xls,.xlsx,.png,.jpg,.jpeg,.doc,.docx"
            id="file-input"
            className="file-input"
            disabled={uploading}
          />
          <label htmlFor="file-input" className="drop-zone-label">
            <span className="upload-icon">\u2191</span>
            <span className="drop-text">
              {dragActive ? 'Drop files here' : 'Drag & drop files here or click to browse'}
            </span>
            <span className="file-types">
              Supported: PDF, Excel, Word, Images (max 25MB each)
            </span>
          </label>
        </div>

        {/* Selected Files List */}
        {files.length > 0 && (
          <div className="selected-files">
            <h5>Selected Files ({files.length})</h5>
            <ul className="file-list">
              {files.map((file, index) => (
                <li key={index} className="file-item">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                  <button
                    className="btn-remove"
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="upload-progress">
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="progress-text">Uploading... {uploadProgress}%</span>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Upload Button */}
        <button
          className="btn-upload"
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
        >
          {uploading ? 'Uploading...' : `Upload ${files.length} File(s)`}
        </button>
      </div>

      {/* Uploaded Documents List */}
      {uploadedDocuments.length > 0 && (
        <div className="uploaded-documents">
          <h4>Uploaded Documents ({uploadedDocuments.length})</h4>
          <table className="documents-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>File Name</th>
                <th>Size</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {uploadedDocuments.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.documentTypeName}</td>
                  <td className="file-name-cell">{doc.file_name}</td>
                  <td>{formatFileSize(doc.file_size)}</td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(doc.status)}`}>
                      {doc.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{new Date(doc.upload_date).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <button
                      className="btn-action btn-download"
                      onClick={() => handleDownload(doc.id, doc.file_name)}
                      title="Download"
                    >
                      \u21E9
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => handleDelete(doc.id, doc.file_name)}
                      title="Delete"
                    >
                      \u2717
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
