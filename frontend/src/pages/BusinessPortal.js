/**
 * Business Portal
 *
 * A dedicated interface for business owners to:
 * - Complete questionnaires for their engagement
 * - Upload required documents
 * - View analysis results
 * - Download reports
 *
 * Business owners access this via a unique link sent by their advisor
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DocumentUpload from '../components/DocumentUpload';
import BusinessQuestionnaire from '../components/BusinessQuestionnaire';
import './BusinessPortal.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const BusinessPortal = () => {
  const { accessToken } = useParams();
  const navigate = useNavigate();

  const [engagement, setEngagement] = useState(null);
  const [business, setBusiness] = useState(null);
  const [activeTab, setActiveTab] = useState('questionnaire');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({
    questionnaire: 0,
    documents: 0,
    overall: 0
  });

  useEffect(() => {
    loadEngagementByToken();
  }, [accessToken]);

  const loadEngagementByToken = async () => {
    try {
      setLoading(true);
      // API call to validate token and get engagement details
      const response = await fetch(`${API_URL}/business-portal/${accessToken}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Invalid or expired access link. Please contact your advisor.');
        } else {
          setError('Failed to load engagement details.');
        }
        return;
      }

      const data = await response.json();
      setEngagement(data.engagement);
      setBusiness(data.business);
      setProgress(data.progress || { questionnaire: 0, documents: 0, overall: 0 });
    } catch (err) {
      console.error('Error loading engagement:', err);
      setError('Unable to connect to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionnaireProgress = (newProgress) => {
    setProgress(prev => ({
      ...prev,
      questionnaire: newProgress,
      overall: Math.round((newProgress + prev.documents) / 2)
    }));
  };

  const handleDocumentProgress = (newProgress) => {
    setProgress(prev => ({
      ...prev,
      documents: newProgress,
      overall: Math.round((prev.questionnaire + newProgress) / 2)
    }));
  };

  if (loading) {
    return (
      <div className="business-portal">
        <div className="portal-loading">
          <div className="loading-spinner"></div>
          <p>Loading your engagement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="business-portal">
        <div className="portal-error">
          <div className="error-icon">!</div>
          <h2>Access Error</h2>
          <p>{error}</p>
          <p className="error-help">
            If you believe this is a mistake, please contact your advisor for a new access link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="business-portal">
      {/* Header */}
      <header className="portal-header">
        <div className="portal-branding">
          <h1>Business Valuation Portal</h1>
          <span className="business-name">{business?.name}</span>
        </div>
        <div className="portal-progress">
          <div className="progress-circle">
            <svg viewBox="0 0 36 36">
              <path
                className="progress-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="progress-fill"
                strokeDasharray={`${progress.overall}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="progress-text">{progress.overall}%</span>
          </div>
          <span className="progress-label">Overall Progress</span>
        </div>
      </header>

      {/* Engagement Info Banner */}
      <div className="engagement-banner">
        <div className="engagement-type">
          <span className="type-label">Engagement Type:</span>
          <span className="type-value">{getEngagementTypeLabel(engagement?.engagementType)}</span>
        </div>
        <div className="engagement-status">
          <span className="status-label">Status:</span>
          <span className={`status-badge status-${engagement?.status}`}>
            {formatStatus(engagement?.status)}
          </span>
        </div>
        <div className="engagement-advisor">
          <span className="advisor-label">Your Advisor:</span>
          <span className="advisor-name">{engagement?.advisorName || 'Assigned Advisor'}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="portal-tabs">
        <button
          className={`tab ${activeTab === 'questionnaire' ? 'active' : ''}`}
          onClick={() => setActiveTab('questionnaire')}
        >
          <span className="tab-icon">1</span>
          <span className="tab-label">Questionnaire</span>
          <span className="tab-progress">{progress.questionnaire}%</span>
        </button>
        <button
          className={`tab ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <span className="tab-icon">2</span>
          <span className="tab-label">Documents</span>
          <span className="tab-progress">{progress.documents}%</span>
        </button>
        <button
          className={`tab ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
          disabled={progress.overall < 50}
        >
          <span className="tab-icon">3</span>
          <span className="tab-label">Results</span>
          {progress.overall < 50 && <span className="tab-locked">Locked</span>}
        </button>
        <button
          className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
          disabled={progress.overall < 80}
        >
          <span className="tab-icon">4</span>
          <span className="tab-label">Reports</span>
          {progress.overall < 80 && <span className="tab-locked">Locked</span>}
        </button>
      </nav>

      {/* Tab Content */}
      <main className="portal-content">
        {activeTab === 'questionnaire' && (
          <BusinessQuestionnaire
            engagementId={engagement?.id}
            engagementType={engagement?.engagementType}
            accessToken={accessToken}
            onProgressChange={handleQuestionnaireProgress}
          />
        )}

        {activeTab === 'documents' && (
          <div className="documents-section">
            <div className="section-header">
              <h2>Required Documents</h2>
              <p>Please upload the following documents to support your valuation analysis.</p>
            </div>
            <DocumentUpload
              engagementId={engagement?.id}
              accessToken={accessToken}
              onUploadComplete={handleDocumentProgress}
            />
          </div>
        )}

        {activeTab === 'results' && (
          <div className="results-section">
            <div className="section-header">
              <h2>Analysis Results</h2>
              <p>Based on your questionnaire responses and documents, here are your preliminary results.</p>
            </div>
            <ResultsPreview engagement={engagement} />
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-section">
            <div className="section-header">
              <h2>Download Reports</h2>
              <p>Your finalized reports are available for download.</p>
            </div>
            <ReportDownloads engagement={engagement} accessToken={accessToken} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="portal-footer">
        <p>Need help? Contact your advisor or email support@valuationapp.com</p>
        <p className="footer-security">Your data is encrypted and secure.</p>
      </footer>
    </div>
  );
};

// Helper Components
const ResultsPreview = ({ engagement }) => {
  if (!engagement?.results) {
    return (
      <div className="results-pending">
        <div className="pending-icon">...</div>
        <h3>Results Pending</h3>
        <p>Complete the questionnaire and upload required documents to view your results.</p>
      </div>
    );
  }

  return (
    <div className="results-grid">
      <div className="result-card primary">
        <h3>Estimated Valuation</h3>
        <div className="result-value">${formatNumber(engagement.results.valuation)}</div>
        <p className="result-note">Based on current inputs</p>
      </div>
      <div className="result-card">
        <h3>Value Drivers</h3>
        <ul className="drivers-list">
          {engagement.results.drivers?.map((driver, idx) => (
            <li key={idx} className="driver-positive">{driver}</li>
          ))}
        </ul>
      </div>
      <div className="result-card">
        <h3>Improvement Areas</h3>
        <ul className="improvements-list">
          {engagement.results.improvements?.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const ReportDownloads = ({ engagement, accessToken }) => {
  const [downloading, setDownloading] = useState(null);

  const handleDownload = async (reportType) => {
    setDownloading(reportType);
    try {
      const response = await fetch(
        `${API_URL}/business-portal/${accessToken}/reports/${reportType}`,
        { method: 'GET' }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="reports-grid">
      <div className="report-card">
        <div className="report-icon">PDF</div>
        <h3>Executive Summary</h3>
        <p>High-level overview of your business valuation and key findings.</p>
        <button
          className="btn-download"
          onClick={() => handleDownload('executive-summary')}
          disabled={downloading === 'executive-summary'}
        >
          {downloading === 'executive-summary' ? 'Downloading...' : 'Download PDF'}
        </button>
      </div>
      <div className="report-card">
        <div className="report-icon">PDF</div>
        <h3>Detailed Analysis</h3>
        <p>Comprehensive valuation report with methodology and assumptions.</p>
        <button
          className="btn-download"
          onClick={() => handleDownload('detailed-analysis')}
          disabled={downloading === 'detailed-analysis'}
        >
          {downloading === 'detailed-analysis' ? 'Downloading...' : 'Download PDF'}
        </button>
      </div>
      <div className="report-card">
        <div className="report-icon">PDF</div>
        <h3>Improvement Plan</h3>
        <p>Actionable recommendations to increase your business value.</p>
        <button
          className="btn-download"
          onClick={() => handleDownload('improvement-plan')}
          disabled={downloading === 'improvement-plan'}
        >
          {downloading === 'improvement-plan' ? 'Downloading...' : 'Download PDF'}
        </button>
      </div>
    </div>
  );
};

// Helper functions
const getEngagementTypeLabel = (type) => {
  const labels = {
    vac: 'Value Acceleration',
    valuation: 'Business Valuation',
    exit_planning: 'Exit Planning',
    mna: 'M&A Advisory'
  };
  return labels[type] || type || 'General';
};

const formatStatus = (status) => {
  const labels = {
    created: 'Getting Started',
    intake: 'In Progress',
    review: 'Under Review',
    drafted: 'Draft Ready',
    reports: 'Reports Available',
    completed: 'Completed'
  };
  return labels[status] || status || 'Active';
};

const formatNumber = (num) => {
  if (!num) return '0';
  return new Intl.NumberFormat('en-US').format(num);
};

export default BusinessPortal;
