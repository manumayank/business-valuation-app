import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DocumentUpload from '../components/DocumentUpload';
import { useAuth } from '../contexts/AuthContext';
import { getEngagement as fetchEngagement } from '../services/api';
import './EngagementPage.css';

const EngagementPage = () => {
  const { engagementId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [engagement, setEngagement] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadEngagement();
  }, [engagementId]);

  const loadEngagement = async () => {
    try {
      setLoading(true);
      const response = await fetchEngagement(engagementId);
      // API returns engagement object directly
      if (response && response.id) {
        setEngagement(response);
      } else {
        setError('Failed to load engagement');
      }
    } catch (err) {
      console.error('Error loading engagement:', err);
      setError('Failed to load engagement: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (result) => {
    console.log('Upload complete:', result);
    // Could trigger a refresh or show notification
  };

  const copyShareableUrl = async () => {
    if (engagement?.shareableUrl) {
      try {
        await navigator.clipboard.writeText(engagement.shareableUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = engagement.shareableUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const getEngagementTypeLabel = (type) => {
    const labels = {
      'vac': 'Value Acceleration',
      'valuation': 'Business Valuation',
      'exit_planning': 'Exit Planning',
      'mna': 'M&A Advisory'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="engagement-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading engagement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="engagement-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="engagement-page">
      {/* Header */}
      <header className="engagement-header">
        <div className="header-left">
          <button onClick={() => navigate('/dashboard')} className="btn-back">
            &larr; Back to Dashboard
          </button>
          <div className="engagement-info">
            <h1>{engagement?.business_name || 'Engagement'}</h1>
            <span className={`status-badge status-${engagement?.status}`}>
              {engagement?.status || 'active'}
            </span>
          </div>
        </div>
        <div className="header-right">
          <span className="user-name">{user?.fullName}</span>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="engagement-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          Documents
        </button>
        <button
          className={`tab ${activeTab === 'valuation' ? 'active' : ''}`}
          onClick={() => setActiveTab('valuation')}
        >
          Valuation
        </button>
        <button
          className={`tab ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          Notes
        </button>
      </nav>

      {/* Tab Content */}
      <main className="engagement-content">
        {activeTab === 'overview' && (
          <div className="tab-panel">
            {/* Shareable URL Card */}
            {engagement?.shareableUrl && (
              <div className="overview-card share-card">
                <h3>Business Portal Link</h3>
                <p className="share-description">
                  Share this link with the business owner to allow them to fill out questionnaires and upload documents.
                </p>
                <div className="share-url-container">
                  <input
                    type="text"
                    value={engagement.shareableUrl}
                    readOnly
                    className="share-url-input"
                  />
                  <button
                    onClick={copyShareableUrl}
                    className={`btn-copy ${copied ? 'copied' : ''}`}
                  >
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>
            )}

            {/* Engagement Details Card */}
            <div className="overview-card">
              <h3>Engagement Details</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <label>Business Name</label>
                  <span>{engagement?.business_name}</span>
                </div>
                <div className="detail-item">
                  <label>Engagement Type</label>
                  <span className="engagement-type-badge">
                    {getEngagementTypeLabel(engagement?.engagementType)}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <span className={`status-badge status-${engagement?.status}`}>
                    {engagement?.status}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Progress</label>
                  <div className="progress-bar-small">
                    <div
                      className="progress-fill"
                      style={{ width: `${engagement?.completionPercentage || 0}%` }}
                    ></div>
                  </div>
                  <span>{engagement?.completionPercentage || 0}%</span>
                </div>
                <div className="detail-item">
                  <label>Created</label>
                  <span>
                    {engagement?.createdAt
                      ? new Date(engagement.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Last Updated</label>
                  <span>
                    {engagement?.updatedAt
                      ? new Date(engagement.updatedAt).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Questionnaire Responses</label>
                  <span>{engagement?.responseCount || 0} fields</span>
                </div>
                <div className="detail-item">
                  <label>Engagement ID</label>
                  <span className="monospace">{engagementId}</span>
                </div>
              </div>
            </div>

            {/* Risk Score Card */}
            {engagement?.riskScore && (
              <div className="overview-card risk-card">
                <h3>Risk Assessment</h3>
                <div className="risk-score-display">
                  <div className={`risk-score risk-${engagement.riskScore.category?.toLowerCase()}`}>
                    {engagement.riskScore.score}
                  </div>
                  <div className="risk-info">
                    <span className="risk-category">{engagement.riskScore.category}</span>
                    <span className="risk-date">
                      Calculated: {new Date(engagement.riskScore.calculatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="tab-panel">
            <DocumentUpload
              engagementId={engagementId}
              onUploadComplete={handleUploadComplete}
            />
          </div>
        )}

        {activeTab === 'valuation' && (
          <div className="tab-panel">
            <div className="placeholder-card">
              <h3>Valuation Analysis</h3>
              <p>Valuation analysis will be available once required documents are uploaded and reviewed.</p>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="tab-panel">
            <div className="placeholder-card">
              <h3>Engagement Notes</h3>
              <p>Notes and communication features coming soon.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default EngagementPage;
