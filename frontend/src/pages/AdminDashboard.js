/**
 * Admin Dashboard
 *
 * Administrative interface for:
 * - Managing advisors (view, add, edit, deactivate)
 * - Viewing all businesses and their assigned advisors
 * - System statistics and overview
 * - Engagement monitoring
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data state
  const [stats, setStats] = useState({
    totalAdvisors: 0,
    totalBusinesses: 0,
    totalEngagements: 0,
    activeEngagements: 0,
    completedEngagements: 0,
    pendingReview: 0
  });
  const [advisors, setAdvisors] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [industryMultiples, setIndustryMultiples] = useState([]);

  // Modal state
  const [showAddAdvisorModal, setShowAddAdvisorModal] = useState(false);
  const [editingAdvisor, setEditingAdvisor] = useState(null);
  const [newAdvisor, setNewAdvisor] = useState({ fullName: '', email: '', password: '' });

  // Industry Multiples modal state
  const [showMultipleModal, setShowMultipleModal] = useState(false);
  const [editingMultiple, setEditingMultiple] = useState(null);
  const [newMultiple, setNewMultiple] = useState({ naicsCode: '', industryName: '', multiple: '', source: '' });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Load data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all data in parallel
      const [statsRes, advisorsRes, businessesRes, engagementsRes, activityRes, multiplesRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }).then(r => r.json()).catch(() => ({})),
        fetch('/api/admin/advisors', { headers }).then(r => r.json()).catch(() => ({ advisors: [] })),
        fetch('/api/admin/businesses', { headers }).then(r => r.json()).catch(() => ({ businesses: [] })),
        fetch('/api/admin/engagements', { headers }).then(r => r.json()).catch(() => ({ engagements: [] })),
        fetch('/api/admin/activity', { headers }).then(r => r.json()).catch(() => ({ activities: [] })),
        fetch('/api/admin/industry-multiples', { headers }).then(r => r.json()).catch(() => ({ multiples: [] }))
      ]);

      setStats(statsRes.stats || {
        totalAdvisors: advisorsRes.advisors?.length || 0,
        totalBusinesses: businessesRes.businesses?.length || 0,
        totalEngagements: engagementsRes.engagements?.length || 0,
        activeEngagements: engagementsRes.engagements?.filter(e => !['completed', 'archived'].includes(e.status)).length || 0,
        completedEngagements: engagementsRes.engagements?.filter(e => e.status === 'completed').length || 0,
        pendingReview: engagementsRes.engagements?.filter(e => e.status === 'review').length || 0
      });
      setAdvisors(advisorsRes.advisors || []);
      setBusinesses(businessesRes.businesses || []);
      setEngagements(engagementsRes.engagements || []);
      setRecentActivity(activityRes.activities || []);
      setIndustryMultiples(multiplesRes.multiples || []);

    } catch (err) {
      console.error('Error loading admin data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Handle add advisor
  const handleAddAdvisor = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/advisors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newAdvisor)
      });

      if (response.ok) {
        const data = await response.json();
        setAdvisors(prev => [...prev, data.advisor]);
        setShowAddAdvisorModal(false);
        setNewAdvisor({ fullName: '', email: '', password: '' });
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to add advisor');
      }
    } catch (err) {
      console.error('Error adding advisor:', err);
      alert('Failed to add advisor');
    }
  };

  // Handle update advisor status
  const handleToggleAdvisorStatus = async (advisorId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

      const response = await fetch(`/api/admin/advisors/${advisorId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setAdvisors(prev =>
          prev.map(a => a.id === advisorId ? { ...a, status: newStatus } : a)
        );
      }
    } catch (err) {
      console.error('Error updating advisor:', err);
    }
  };

  // Handle add/edit industry multiple
  const handleSaveMultiple = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const isEditing = !!editingMultiple;
      const url = isEditing
        ? `/api/admin/industry-multiples/${editingMultiple.id}`
        : '/api/admin/industry-multiples';

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          naicsCode: newMultiple.naicsCode,
          industryName: newMultiple.industryName,
          multiple: parseFloat(newMultiple.multiple),
          source: newMultiple.source || 'admin'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (isEditing) {
          setIndustryMultiples(prev =>
            prev.map(m => m.id === editingMultiple.id
              ? { ...m, ...newMultiple, multiple: parseFloat(newMultiple.multiple) }
              : m
            )
          );
        } else {
          setIndustryMultiples(prev => [...prev, data.multiple]);
        }
        closeMultipleModal();
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to save industry multiple');
      }
    } catch (err) {
      console.error('Error saving industry multiple:', err);
      alert('Failed to save industry multiple');
    }
  };

  // Handle delete industry multiple
  const handleDeleteMultiple = async (id) => {
    if (!window.confirm('Are you sure you want to delete this industry multiple?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/industry-multiples/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setIndustryMultiples(prev => prev.filter(m => m.id !== id));
      } else {
        alert('Failed to delete industry multiple');
      }
    } catch (err) {
      console.error('Error deleting industry multiple:', err);
    }
  };

  // Open modal for editing a multiple
  const openEditMultiple = (multiple) => {
    setEditingMultiple(multiple);
    setNewMultiple({
      naicsCode: multiple.naicsCode,
      industryName: multiple.industryName,
      multiple: multiple.multiple.toString(),
      source: multiple.source || ''
    });
    setShowMultipleModal(true);
  };

  // Close multiple modal
  const closeMultipleModal = () => {
    setShowMultipleModal(false);
    setEditingMultiple(null);
    setNewMultiple({ naicsCode: '', industryName: '', multiple: '', source: '' });
  };

  // Filter industry multiples
  const filteredMultiples = industryMultiples.filter(m => {
    const matchesSearch = !searchTerm ||
      m.naicsCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.industryName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Filter advisors
  const filteredAdvisors = advisors.filter(advisor => {
    const matchesSearch = !searchTerm ||
      advisor.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advisor.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || advisor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter businesses
  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = !searchTerm ||
      business.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.advisorName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="header-left">
          <h1>Admin Dashboard</h1>
          <p className="admin-user">Logged in as {user?.fullName || 'Admin'}</p>
        </div>
        <div className="header-right">
          <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
            Advisor View
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

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon advisors-icon">A</div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalAdvisors}</span>
            <span className="stat-label">Advisors</span>
          </div>
        </div>
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
            <span className="stat-label">Total Engagements</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active-icon">*</div>
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
        <div className="stat-card">
          <div className="stat-icon completed-icon">+</div>
          <div className="stat-content">
            <span className="stat-value">{stats.completedEngagements}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="admin-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'advisors' ? 'active' : ''}`}
          onClick={() => setActiveTab('advisors')}
        >
          Advisors ({advisors.length})
        </button>
        <button
          className={`tab ${activeTab === 'businesses' ? 'active' : ''}`}
          onClick={() => setActiveTab('businesses')}
        >
          Businesses ({businesses.length})
        </button>
        <button
          className={`tab ${activeTab === 'engagements' ? 'active' : ''}`}
          onClick={() => setActiveTab('engagements')}
        >
          Engagements ({engagements.length})
        </button>
        <button
          className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          Activity Log
        </button>
        <button
          className={`tab ${activeTab === 'multiples' ? 'active' : ''}`}
          onClick={() => setActiveTab('multiples')}
        >
          Industry Multiples ({industryMultiples.length})
        </button>
      </nav>

      {/* Tab Content */}
      <main className="admin-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-grid">
            <div className="overview-card">
              <h3>Recent Engagements</h3>
              {engagements.slice(0, 5).map(eng => (
                <div key={eng.id} className="overview-item">
                  <span className="item-name">{eng.businessName}</span>
                  <span className={`status-badge status-${eng.status}`}>{eng.status}</span>
                </div>
              ))}
            </div>
            <div className="overview-card">
              <h3>Top Advisors</h3>
              {advisors.slice(0, 5).map(advisor => (
                <div key={advisor.id} className="overview-item">
                  <span className="item-name">{advisor.fullName}</span>
                  <span className="item-stat">{advisor.engagementCount || 0} engagements</span>
                </div>
              ))}
            </div>
            <div className="overview-card">
              <h3>Recent Activity</h3>
              {recentActivity.slice(0, 5).map((activity, idx) => (
                <div key={idx} className="activity-item">
                  <span className="activity-text">{activity.description}</span>
                  <span className="activity-time">{formatTimeAgo(activity.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advisors Tab */}
        {activeTab === 'advisors' && (
          <div className="advisors-section">
            <div className="section-header">
              <h2>Manage Advisors</h2>
              <div className="section-actions">
                <input
                  type="text"
                  placeholder="Search advisors..."
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <button
                  className="btn-primary"
                  onClick={() => setShowAddAdvisorModal(true)}
                >
                  + Add Advisor
                </button>
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Businesses</th>
                  <th>Engagements</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdvisors.map(advisor => (
                  <tr key={advisor.id}>
                    <td>{advisor.fullName}</td>
                    <td>{advisor.email}</td>
                    <td>{advisor.businessCount || 0}</td>
                    <td>{advisor.engagementCount || 0}</td>
                    <td>
                      <span className={`status-badge status-${advisor.status || 'active'}`}>
                        {advisor.status || 'active'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-small"
                        onClick={() => handleToggleAdvisorStatus(advisor.id, advisor.status || 'active')}
                      >
                        {advisor.status === 'inactive' ? 'Activate' : 'Deactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredAdvisors.length === 0 && (
                  <tr>
                    <td colSpan="6" className="no-data">No advisors found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Businesses Tab */}
        {activeTab === 'businesses' && (
          <div className="businesses-section">
            <div className="section-header">
              <h2>All Businesses</h2>
              <div className="section-actions">
                <input
                  type="text"
                  placeholder="Search businesses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Business Name</th>
                  <th>Industry</th>
                  <th>Location</th>
                  <th>Advisor</th>
                  <th>Engagements</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredBusinesses.map(business => (
                  <tr key={business.id}>
                    <td>{business.name}</td>
                    <td>{business.industry || '-'}</td>
                    <td>{business.location || '-'}</td>
                    <td>{business.advisorName || 'Unassigned'}</td>
                    <td>{business.engagementCount || 0}</td>
                    <td>{formatDate(business.createdAt)}</td>
                  </tr>
                ))}
                {filteredBusinesses.length === 0 && (
                  <tr>
                    <td colSpan="6" className="no-data">No businesses found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Engagements Tab */}
        {activeTab === 'engagements' && (
          <div className="engagements-section">
            <div className="section-header">
              <h2>All Engagements</h2>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Type</th>
                  <th>Advisor</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {engagements.map(eng => (
                  <tr key={eng.id}>
                    <td>{eng.businessName}</td>
                    <td>{formatEngagementType(eng.engagementType)}</td>
                    <td>{eng.advisorName || 'Unassigned'}</td>
                    <td>
                      <span className={`status-badge status-${eng.status}`}>
                        {eng.status}
                      </span>
                    </td>
                    <td>
                      <div className="progress-mini">
                        <div
                          className="progress-fill"
                          style={{ width: `${eng.completionPercentage || 0}%` }}
                        />
                        <span>{eng.completionPercentage || 0}%</span>
                      </div>
                    </td>
                    <td>{formatDate(eng.updatedAt)}</td>
                  </tr>
                ))}
                {engagements.length === 0 && (
                  <tr>
                    <td colSpan="6" className="no-data">No engagements found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Activity Log Tab */}
        {activeTab === 'activity' && (
          <div className="activity-section">
            <div className="section-header">
              <h2>Activity Log</h2>
            </div>

            <div className="activity-list">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="activity-row">
                  <div className="activity-icon">{getActivityIcon(activity.type)}</div>
                  <div className="activity-details">
                    <p className="activity-description">{activity.description}</p>
                    <span className="activity-meta">
                      {activity.userName} - {formatTimeAgo(activity.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="no-data">No recent activity</div>
              )}
            </div>
          </div>
        )}

        {/* Industry Multiples Tab */}
        {activeTab === 'multiples' && (
          <div className="multiples-section">
            <div className="section-header">
              <h2>Industry Multiples</h2>
              <div className="section-actions">
                <input
                  type="text"
                  placeholder="Search by NAICS code or industry..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <button
                  className="btn-primary"
                  onClick={() => setShowMultipleModal(true)}
                >
                  + Add Multiple
                </button>
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>NAICS Code</th>
                  <th>Industry Name</th>
                  <th>Multiple</th>
                  <th>Source</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMultiples.map(multiple => (
                  <tr key={multiple.id}>
                    <td><code>{multiple.naicsCode}</code></td>
                    <td>{multiple.industryName}</td>
                    <td><strong>{multiple.multiple}x</strong></td>
                    <td>{multiple.source || '-'}</td>
                    <td>{formatDate(multiple.updatedAt)}</td>
                    <td>
                      <button
                        className="btn-small"
                        onClick={() => openEditMultiple(multiple)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-small btn-danger"
                        onClick={() => handleDeleteMultiple(multiple.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredMultiples.length === 0 && (
                  <tr>
                    <td colSpan="6" className="no-data">
                      {searchTerm ? 'No multiples match your search' : 'No industry multiples found. Add some to get started.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add Advisor Modal */}
      {showAddAdvisorModal && (
        <div className="modal-overlay" onClick={() => setShowAddAdvisorModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Advisor</h2>
              <button className="modal-close" onClick={() => setShowAddAdvisorModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleAddAdvisor}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={newAdvisor.fullName}
                  onChange={(e) => setNewAdvisor(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={newAdvisor.email}
                  onChange={(e) => setNewAdvisor(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Temporary Password *</label>
                <input
                  type="password"
                  value={newAdvisor.password}
                  onChange={(e) => setNewAdvisor(prev => ({ ...prev, password: e.target.value }))}
                  required
                  minLength={8}
                />
                <small>Advisor will be prompted to change on first login</small>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddAdvisorModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Advisor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Industry Multiple Modal */}
      {showMultipleModal && (
        <div className="modal-overlay" onClick={closeMultipleModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingMultiple ? 'Edit Industry Multiple' : 'Add Industry Multiple'}</h2>
              <button className="modal-close" onClick={closeMultipleModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveMultiple}>
              <div className="form-group">
                <label>NAICS Code *</label>
                <input
                  type="text"
                  value={newMultiple.naicsCode}
                  onChange={(e) => setNewMultiple(prev => ({ ...prev, naicsCode: e.target.value }))}
                  placeholder="e.g., 541511"
                  required
                  disabled={!!editingMultiple}
                />
                {editingMultiple && (
                  <small>NAICS code cannot be changed after creation</small>
                )}
              </div>
              <div className="form-group">
                <label>Industry Name *</label>
                <input
                  type="text"
                  value={newMultiple.industryName}
                  onChange={(e) => setNewMultiple(prev => ({ ...prev, industryName: e.target.value }))}
                  placeholder="e.g., Custom Computer Programming Services"
                  required
                />
              </div>
              <div className="form-group">
                <label>EBITDA Multiple *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="50"
                  value={newMultiple.multiple}
                  onChange={(e) => setNewMultiple(prev => ({ ...prev, multiple: e.target.value }))}
                  placeholder="e.g., 4.5"
                  required
                />
                <small>Industry benchmark EBITDA multiple (typically 2-15x)</small>
              </div>
              <div className="form-group">
                <label>Source</label>
                <input
                  type="text"
                  value={newMultiple.source}
                  onChange={(e) => setNewMultiple(prev => ({ ...prev, source: e.target.value }))}
                  placeholder="e.g., BizBuySell, DealStats, Industry Report"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeMultipleModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingMultiple ? 'Save Changes' : 'Add Multiple'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString();
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const formatEngagementType = (type) => {
  const types = {
    vac: 'VAC',
    valuation: 'Valuation',
    exit_planning: 'Exit Planning',
    mna: 'M&A'
  };
  return types[type] || type || 'General';
};

const getActivityIcon = (type) => {
  const icons = {
    engagement_created: '+',
    document_uploaded: 'D',
    questionnaire_submitted: 'Q',
    status_changed: 'S',
    user_registered: 'U'
  };
  return icons[type] || '*';
};

export default AdminDashboard;
