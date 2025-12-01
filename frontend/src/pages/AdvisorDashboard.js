import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getBusinesses,
  getEngagements,
  createBusiness,
  createEngagement
} from '../services/api';
import './AdvisorDashboard.css';

const AdvisorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Data state
  const [businesses, setBusinesses] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [showNewBusinessModal, setShowNewBusinessModal] = useState(false);
  const [showNewEngagementModal, setShowNewEngagementModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newBusiness, setNewBusiness] = useState({
    name: '',
    naicsCode: '',
    location: '',
    foundedYear: ''
  });
  const [newEngagement, setNewEngagement] = useState({
    engagementType: 'vac',
    notes: ''
  });
  const [creating, setCreating] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [businessesRes, engagementsRes] = await Promise.all([
        getBusinesses().catch(() => ({ businesses: [] })),
        getEngagements().catch(() => ({ engagements: [] }))
      ]);

      setBusinesses(businessesRes.businesses || []);
      setEngagements(engagementsRes.engagements || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate stats
  const stats = {
    totalBusinesses: businesses.length,
    totalEngagements: engagements.length,
    activeEngagements: engagements.filter(e => !['archived', 'completed'].includes(e.status)).length,
    pendingReview: engagements.filter(e => e.status === 'review' || e.status === 'under_review').length,
    inIntake: engagements.filter(e => e.status === 'intake' || e.status === 'created').length
  };

  // Filter engagements
  const filteredEngagements = engagements.filter(engagement => {
    const matchesSearch = !searchTerm ||
      engagement.businessName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || engagement.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle create business
  const handleCreateBusiness = async (e) => {
    e.preventDefault();
    if (!newBusiness.name.trim()) return;

    try {
      setCreating(true);
      const result = await createBusiness({
        name: newBusiness.name,
        naicsCode: newBusiness.naicsCode || null,
        location: newBusiness.location || null,
        foundedYear: newBusiness.foundedYear ? parseInt(newBusiness.foundedYear) : null
      });

      if (result.business) {
        setBusinesses(prev => [result.business, ...prev]);
        setShowNewBusinessModal(false);
        setNewBusiness({ name: '', naicsCode: '', location: '', foundedYear: '' });
      }
    } catch (err) {
      console.error('Error creating business:', err);
      setError('Failed to create business');
    } finally {
      setCreating(false);
    }
  };

  // Handle create engagement
  const handleCreateEngagement = async (e) => {
    e.preventDefault();
    if (!selectedBusiness) return;

    try {
      setCreating(true);
      const result = await createEngagement(selectedBusiness.id, {
        engagementType: newEngagement.engagementType,
        notes: newEngagement.notes || null
      });

      if (result.engagement) {
        // Navigate to the new engagement
        navigate(`/engagements/${result.engagement.id}`);
      }
    } catch (err) {
      console.error('Error creating engagement:', err);
      setError('Failed to create engagement');
    } finally {
      setCreating(false);
    }
  };

  // Handle business click - open engagement modal
  const handleBusinessClick = (business) => {
    setSelectedBusiness(business);
    setNewEngagement({ engagementType: 'vac', notes: '' });
    setShowNewEngagementModal(true);
  };

  // Get status badge class
  const getStatusClass = (status) => {
    const statusClasses = {
      created: 'status-new',
      intake: 'status-intake',
      review: 'status-review',
      under_review: 'status-review',
      drafted: 'status-drafted',
      reports: 'status-complete',
      completed: 'status-complete',
      archived: 'status-archived'
    };
    return statusClasses[status] || 'status-default';
  };

  // Format status for display
  const formatStatus = (status) => {
    const statusLabels = {
      created: 'New',
      intake: 'Intake',
      review: 'Review',
      under_review: 'Under Review',
      drafted: 'Drafted',
      reports: 'Reports',
      completed: 'Completed',
      archived: 'Archived'
    };
    return statusLabels[status] || status;
  };

  if (loading) {
    return (
      <div className="advisor-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="advisor-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Advisor Dashboard</h1>
          <p className="welcome-text">Welcome back, {user?.fullName || 'Advisor'}</p>
        </div>
        <div className="header-right">
          <button
            className="btn-primary"
            onClick={() => setShowNewBusinessModal(true)}
          >
            + New Business
          </button>
          <button className="btn-secondary" onClick={() => navigate('/vac')}>
            VAC Calculator
          </button>
          <button className="btn-logout" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon businesses-icon">B</div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalBusinesses}</span>
            <span className="stat-label">Businesses</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon engagements-icon">E</div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalEngagements}</span>
            <span className="stat-label">Engagements</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active-icon">A</div>
          <div className="stat-content">
            <span className="stat-value">{stats.activeEngagements}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-icon pending-icon">!</div>
          <div className="stat-content">
            <span className="stat-value">{stats.pendingReview}</span>
            <span className="stat-label">Pending Review</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content">
        {/* Engagements List */}
        <section className="engagements-section">
          <div className="section-header">
            <h2>Engagements</h2>
            <div className="filters">
              <input
                type="text"
                placeholder="Search businesses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="status-filter"
              >
                <option value="all">All Status</option>
                <option value="created">New</option>
                <option value="intake">Intake</option>
                <option value="review">Review</option>
                <option value="under_review">Under Review</option>
                <option value="drafted">Drafted</option>
                <option value="reports">Reports</option>
              </select>
            </div>
          </div>

          {filteredEngagements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No engagements found</h3>
              <p>
                {engagements.length === 0
                  ? 'Create a business and start a new engagement to get started.'
                  : 'Try adjusting your search or filters.'}
              </p>
            </div>
          ) : (
            <div className="engagements-list">
              {filteredEngagements.map((engagement) => (
                <div
                  key={engagement.id}
                  className="engagement-card"
                  onClick={() => navigate(`/engagements/${engagement.id}`)}
                >
                  <div className="engagement-main">
                    <h3>{engagement.businessName || 'Unnamed Business'}</h3>
                    <span className={`status-badge ${getStatusClass(engagement.status)}`}>
                      {formatStatus(engagement.status)}
                    </span>
                  </div>
                  <div className="engagement-details">
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${engagement.completionPercentage || 0}%` }}
                        />
                      </div>
                      <span className="progress-text">
                        {engagement.completionPercentage || 0}% complete
                      </span>
                    </div>
                    <span className="engagement-date">
                      Updated: {new Date(engagement.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Businesses Sidebar */}
        <aside className="businesses-sidebar">
          <div className="section-header">
            <h2>Businesses</h2>
            <button
              className="btn-icon"
              onClick={() => setShowNewBusinessModal(true)}
              title="Add Business"
            >
              +
            </button>
          </div>

          {businesses.length === 0 ? (
            <div className="empty-state small">
              <p>No businesses yet</p>
              <button
                className="btn-link"
                onClick={() => setShowNewBusinessModal(true)}
              >
                Create your first business
              </button>
            </div>
          ) : (
            <ul className="businesses-list">
              {businesses.map((business) => (
                <li
                  key={business.id}
                  className="business-item clickable"
                  onClick={() => handleBusinessClick(business)}
                  title="Click to start engagement"
                >
                  <div className="business-name">{business.name}</div>
                  <div className="business-meta">
                    {business.location && <span>{business.location}</span>}
                    <span className={`status-dot status-${business.status}`} />
                  </div>
                  <button
                    className="btn-start-engagement"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBusinessClick(business);
                    }}
                  >
                    Start Engagement
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      {/* Quick Actions */}
      <section className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button className="action-card" onClick={() => navigate('/vac')}>
            <span className="action-icon">📊</span>
            <span className="action-label">VAC Calculator</span>
          </button>
          <button className="action-card" onClick={() => setShowNewBusinessModal(true)}>
            <span className="action-icon">🏢</span>
            <span className="action-label">New Business</span>
          </button>
          <button className="action-card" onClick={loadData}>
            <span className="action-icon">🔄</span>
            <span className="action-label">Refresh Data</span>
          </button>
        </div>
      </section>

      {/* New Business Modal */}
      {showNewBusinessModal && (
        <div className="modal-overlay" onClick={() => setShowNewBusinessModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Business</h2>
              <button
                className="modal-close"
                onClick={() => setShowNewBusinessModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateBusiness}>
              <div className="form-group">
                <label htmlFor="businessName">Business Name *</label>
                <input
                  type="text"
                  id="businessName"
                  value={newBusiness.name}
                  onChange={(e) => setNewBusiness(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter business name"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  value={newBusiness.location}
                  onChange={(e) => setNewBusiness(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="City, State"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="naicsCode">NAICS Code</label>
                  <input
                    type="text"
                    id="naicsCode"
                    value={newBusiness.naicsCode}
                    onChange={(e) => setNewBusiness(prev => ({ ...prev, naicsCode: e.target.value }))}
                    placeholder="e.g., 541611"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="foundedYear">Founded Year</label>
                  <input
                    type="number"
                    id="foundedYear"
                    value={newBusiness.foundedYear}
                    onChange={(e) => setNewBusiness(prev => ({ ...prev, foundedYear: e.target.value }))}
                    placeholder="e.g., 2015"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowNewBusinessModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={creating || !newBusiness.name.trim()}
                >
                  {creating ? 'Creating...' : 'Create Business'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Engagement Modal */}
      {showNewEngagementModal && selectedBusiness && (
        <div className="modal-overlay" onClick={() => setShowNewEngagementModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Start New Engagement</h2>
              <button
                className="modal-close"
                onClick={() => setShowNewEngagementModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateEngagement}>
              <div className="form-group">
                <label>Business</label>
                <input
                  type="text"
                  value={selectedBusiness.name}
                  disabled
                  className="input-disabled"
                />
              </div>
              <div className="form-group">
                <label htmlFor="engagementType">Engagement Type *</label>
                <select
                  id="engagementType"
                  value={newEngagement.engagementType}
                  onChange={(e) => setNewEngagement(prev => ({ ...prev, engagementType: e.target.value }))}
                  className="status-filter"
                  style={{ width: '100%' }}
                >
                  <option value="vac">VAC - Value Acceleration</option>
                  <option value="valuation">Business Valuation</option>
                  <option value="exit_planning">Exit Planning</option>
                  <option value="mna">M&A Advisory</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="engagementNotes">Notes (Optional)</label>
                <textarea
                  id="engagementNotes"
                  value={newEngagement.notes}
                  onChange={(e) => setNewEngagement(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any initial notes about this engagement..."
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowNewEngagementModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Start Engagement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvisorDashboard;
