import React, { useState } from 'react';
import '../styles/ExportReport.css';

function ExportReport({ valuationId }) {
  const [selectedTemplate, setSelectedTemplate] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated. Please log in again.');
      }

      const response = await fetch(
        `/api/valuations/${valuationId}/export-pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            template: selectedTemplate
          })
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `HTTP ${response.status}: Failed to export PDF`);
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `valuation-${selectedTemplate}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      setError(err.message);
      console.error('Export error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="export-report">
      <div className="export-header">
        <h3>📄 Export Report as PDF</h3>
        <p className="export-subtitle">Download your valuation report in different formats</p>
      </div>

      <div className="template-selector">
        <label htmlFor="template-select">Choose Report Type:</label>
        <div className="template-options">
          <div className="option">
            <input
              type="radio"
              id="lite"
              name="template"
              value="lite"
              checked={selectedTemplate === 'lite'}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              disabled={loading}
            />
            <label htmlFor="lite">
              <div className="option-content">
                <strong>Lite</strong>
                <small>3 pages</small>
                <div className="option-description">Basic metrics & recommendations</div>
              </div>
            </label>
          </div>

          <div className="option">
            <input
              type="radio"
              id="standard"
              name="template"
              value="standard"
              checked={selectedTemplate === 'standard'}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              disabled={loading}
            />
            <label htmlFor="standard">
              <div className="option-content">
                <strong>Standard ⭐</strong>
                <small>5 pages</small>
                <div className="option-description">Complete analysis (Recommended)</div>
              </div>
            </label>
          </div>

          <div className="option">
            <input
              type="radio"
              id="premium"
              name="template"
              value="premium"
              checked={selectedTemplate === 'premium'}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              disabled={loading}
            />
            <label htmlFor="premium">
              <div className="option-content">
                <strong>Premium</strong>
                <small>10+ pages</small>
                <div className="option-description">Executive summary & deep analysis</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button className="error-close" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {success && (
        <div className="success-message">
          <span className="success-icon">✓</span>
          <span>Report downloaded successfully!</span>
        </div>
      )}

      <button
        onClick={handleExport}
        disabled={loading}
        className={`export-button ${loading ? 'loading' : ''}`}
      >
        {loading ? (
          <>
            <span className="spinner"></span>
            <span>Generating PDF...</span>
          </>
        ) : (
          <>
            <span className="button-icon">📥</span>
            <span>Download {selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)} Report</span>
          </>
        )}
      </button>

      <div className="export-info">
        <small>PDF files will be generated and downloaded to your computer.</small>
      </div>
    </div>
  );
}

export default ExportReport;
