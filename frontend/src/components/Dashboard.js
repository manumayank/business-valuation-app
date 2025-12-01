import React, { useState } from 'react';
import './Dashboard.css';
import RiskAnalysis from './RiskAnalysis';
import ExportReport from './ExportReport';
import WorkingCapitalForm from './WorkingCapitalForm';
import WorkingCapitalAnalysis from './WorkingCapitalAnalysis';
import WorkingCapitalOptimization from './WorkingCapitalOptimization';
import WorkingCapitalRecommendations from './WorkingCapitalRecommendations';
import DealAnalysisForm from './DealAnalysisForm';
import DealMetricsPanel from './DealMetricsPanel';
import DealScorecard from './DealScorecard';
import SynergyAnalysis from './SynergyAnalysis';
import DealRiskAssessment from './DealRiskAssessment';
import NegotiationGuidance from './NegotiationGuidance';
import DealScenarios from './DealScenarios';
import { markImprovementAsCompleted, updateValuation, getValuation } from '../services/api';

const Dashboard = ({ valuation, valuationId, onReturnToWizard, onValuationUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [wcView, setWcView] = useState('none'); // 'none', 'form', 'analysis', 'optimization', 'recommendations'
  const [wcAnalysis, setWcAnalysis] = useState(null);
  const [dealView, setDealView] = useState('none'); // 'none', 'form', 'metrics', 'scorecard', 'synergies', 'risk', 'negotiation', 'scenarios'
  const [dealAnalysis, setDealAnalysis] = useState(null);

  const handleMarkAsCompleted = async (improvementKey) => {
    setLoading(true);
    setError(null);

    try {
      const updated = await markImprovementAsCompleted(valuationId, improvementKey);
      onValuationUpdate(updated);
    } catch (err) {
      setError('Failed to mark improvement as completed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToWizard = () => {
    setLoading(true);
    onReturnToWizard();
  };

  const handleWcAnalysisComplete = (analysis) => {
    setWcAnalysis(analysis);
    setWcView('analysis');
  };

  const handleWcCancel = () => {
    setWcView('none');
    setWcAnalysis(null);
  };

  const handleWcOptimize = () => {
    setWcView('optimization');
  };

  const handleWcViewRecommendations = () => {
    setWcView('recommendations');
  };

  const handleDealAnalysisComplete = (analysis) => {
    setDealAnalysis(analysis);
    setDealView('metrics');
  };

  const handleDealCancel = () => {
    setDealView('none');
    setDealAnalysis(null);
  };

  const handleViewDealScorecard = () => {
    setDealView('scorecard');
  };

  const handleViewSynergies = () => {
    setDealView('synergies');
  };

  const handleViewRiskAssessment = () => {
    setDealView('risk');
  };

  const handleViewNegotiationGuidance = () => {
    setDealView('negotiation');
  };

  const handleViewDealScenarios = () => {
    setDealView('scenarios');
  };

  const handleBackToMetrics = () => {
    setDealView('metrics');
  };

  if (!valuation) {
    return (
      <div className="dashboard">
        <p>Loading valuation...</p>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value) => {
    if (typeof value === 'string') {
      return value;
    }
    return (value * 100).toFixed(1) + '%';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const completedImprovements = valuation.completedImprovements || [];
  const remainingSuggestions = (valuation.suggestions || []).filter(
    s => !completedImprovements.includes(s.key)
  );

  // Handle both new and legacy valuation formats
  const mainValuation = valuation.recommendedValuation || valuation.finalValuation || 0;
  const valuationRange = valuation.valuationRange || { low: mainValuation, high: mainValuation };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>{valuation.companyName}</h2>
        <p className="industry-badge">{valuation.industry}</p>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
        </div>
      )}

      {/* Main Valuation Card */}
      <div className="valuation-card">
        <div className="valuation-content">
          <h3>Estimated Business Valuation</h3>
          <div className="valuation-amount">
            {formatCurrency(mainValuation)}
          </div>
          <div className="valuation-range">
            <span>Estimated range: {formatCurrency(valuationRange.low)} - {formatCurrency(valuationRange.high)}</span>
          </div>
          <p className="valuation-date">
            Calculated on {formatDate(valuation.calculationDate)}
          </p>
          <p className="valuation-note">
            This is an estimate based on industry benchmarks and your company metrics.
          </p>
        </div>
      </div>

      {/* Valuation Methods Breakdown */}
      {valuation.valuationMethods && (
        <section className="dashboard-section">
          <h3 className="section-title">Valuation Methods</h3>
          <div className="methods-grid">
            {valuation.valuationMethods.ebitda && (
              <div className="method-card">
                <h4>{valuation.valuationMethods.ebitda.method}</h4>
                <div className="method-value">{formatCurrency(valuation.valuationMethods.ebitda.value)}</div>
                <p className="method-description">{valuation.valuationMethods.ebitda.description}</p>
              </div>
            )}
            {valuation.valuationMethods.revenue && (
              <div className="method-card">
                <h4>{valuation.valuationMethods.revenue.method}</h4>
                <div className="method-value">{formatCurrency(valuation.valuationMethods.revenue.value)}</div>
                <p className="method-description">{valuation.valuationMethods.revenue.description}</p>
              </div>
            )}
            {valuation.valuationMethods.dcf && (
              <div className="method-card">
                <h4>{valuation.valuationMethods.dcf.method}</h4>
                <div className="method-value">{formatCurrency(valuation.valuationMethods.dcf.value)}</div>
                <p className="method-description">{valuation.valuationMethods.dcf.description}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Risk Analysis */}
      {valuation.riskAnalysis && (
        <RiskAnalysis riskAnalysis={valuation.riskAnalysis} />
      )}

      {/* Working Capital Analysis */}
      <section className="dashboard-section working-capital-section">
        <h3 className="section-title">Working Capital Analysis</h3>

        {wcView === 'none' && !wcAnalysis && (
          <div className="wc-intro-card">
            <h4>Optimize Your Working Capital</h4>
            <p>
              Analyze your cash conversion cycle, benchmark against industry standards,
              and discover opportunities to free up cash and improve your valuation.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setWcView('form')}
              disabled={loading}
            >
              Start Working Capital Analysis
            </button>
          </div>
        )}

        {wcView === 'form' && (
          <WorkingCapitalForm
            valuationId={valuationId}
            industry={valuation.industry}
            onAnalysisComplete={handleWcAnalysisComplete}
            onCancel={handleWcCancel}
          />
        )}

        {wcView === 'analysis' && wcAnalysis && (
          <WorkingCapitalAnalysis
            analysis={wcAnalysis}
            onOptimize={handleWcOptimize}
            onViewRecommendations={handleWcViewRecommendations}
          />
        )}

        {wcView === 'optimization' && wcAnalysis && (
          <WorkingCapitalOptimization
            analysis={wcAnalysis}
            valuationId={valuationId}
            onClose={() => setWcView('analysis')}
          />
        )}

        {wcView === 'recommendations' && wcAnalysis && (
          <WorkingCapitalRecommendations
            analysis={wcAnalysis}
            valuationId={valuationId}
            onClose={() => setWcView('analysis')}
          />
        )}
      </section>

      {/* Deal Analysis Section */}
      <section className="dashboard-section deal-analysis-section">
        <h3 className="section-title">M&A Deal Analysis</h3>

        {dealView === 'none' && !dealAnalysis && (
          <div className="deal-intro-card">
            <h4>Analyze Acquisition Opportunities</h4>
            <p>
              Evaluate potential acquisition targets with comprehensive financial modeling,
              synergy analysis, risk assessment, and negotiation guidance for informed deal decisions.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setDealView('form')}
              disabled={loading}
            >
              Start Deal Analysis
            </button>
          </div>
        )}

        {dealView === 'form' && (
          <DealAnalysisForm
            valuationId={valuationId}
            onAnalysisComplete={handleDealAnalysisComplete}
            onCancel={handleDealCancel}
          />
        )}

        {dealView === 'metrics' && dealAnalysis && (
          <DealMetricsPanel
            analysis={dealAnalysis}
            onViewScorecard={handleViewDealScorecard}
            onViewSynergies={handleViewSynergies}
            onViewRiskAssessment={handleViewRiskAssessment}
            onViewNegotiationGuidance={handleViewNegotiationGuidance}
            onViewScenarios={handleViewDealScenarios}
          />
        )}

        {dealView === 'scorecard' && dealAnalysis && (
          <div>
            <button className="btn btn-small btn-secondary" onClick={handleBackToMetrics}>
              ← Back to Metrics
            </button>
            <DealScorecard analysis={dealAnalysis} />
          </div>
        )}

        {dealView === 'synergies' && dealAnalysis && (
          <div>
            <button className="btn btn-small btn-secondary" onClick={handleBackToMetrics}>
              ← Back to Metrics
            </button>
            <SynergyAnalysis analysis={dealAnalysis} />
          </div>
        )}

        {dealView === 'risk' && dealAnalysis && (
          <div>
            <button className="btn btn-small btn-secondary" onClick={handleBackToMetrics}>
              ← Back to Metrics
            </button>
            <DealRiskAssessment analysis={dealAnalysis} />
          </div>
        )}

        {dealView === 'negotiation' && dealAnalysis && (
          <div>
            <button className="btn btn-small btn-secondary" onClick={handleBackToMetrics}>
              ← Back to Metrics
            </button>
            <NegotiationGuidance analysis={dealAnalysis} />
          </div>
        )}

        {dealView === 'scenarios' && dealAnalysis && (
          <DealScenarios
            valuationId={valuationId}
            inputData={dealAnalysis}
            onClose={handleBackToMetrics}
          />
        )}
      </section>

      {/* Key Drivers Section */}
      <section className="dashboard-section">
        <h3 className="section-title">Value Drivers - What's Working Well</h3>
        <div className="drivers-grid">
          {(valuation.drivers || []).map((driver) => (
            <div key={driver.key} className="driver-card">
              <div className="driver-icon">✓</div>
              <h4>{driver.label || driver.title}</h4>
              {driver.description && <p className="driver-description">{driver.description}</p>}
              <p className="driver-impact">
                +{formatCurrency(Math.abs(driver.impact))}
              </p>
            </div>
          ))}
        </div>
        {(!valuation.drivers || valuation.drivers.length === 0) && (
          <p className="empty-state">No positive drivers identified</p>
        )}
      </section>

      {/* Gaps & Opportunities Section */}
      <section className="dashboard-section">
        <h3 className="section-title">Gaps vs Industry Benchmarks</h3>
        <div className="gaps-list">
          {(valuation.gaps || []).map((gap) => (
            <div key={gap.key} className="gap-item">
              <div className="gap-header">
                <h4>{gap.label}</h4>
                <span className={`gap-badge ${gap.gap < 0 ? 'negative' : ''}`}>
                  Gap: {typeof gap.gap === 'number' && gap.gap % 1 === 0 ? gap.gap + '%' : gap.gap}
                </span>
              </div>
              <div className="gap-details">
                <div className="gap-metric">
                  <span className="label">Your {gap.label.toLowerCase()}:</span>
                  <span className="value">
                    {typeof gap.current === 'number' && gap.current < 1 ? formatPercentage(gap.current) : gap.current}
                  </span>
                </div>
                <div className="gap-metric">
                  <span className="label">Industry average:</span>
                  <span className="value">
                    {typeof gap.benchmark === 'number' && gap.benchmark < 1 ? formatPercentage(gap.benchmark) : gap.benchmark}
                  </span>
                </div>
              </div>
              {gap.impact && (
                <p className="gap-impact">
                  Impact on valuation: -{formatCurrency(Math.abs(gap.impact))}
                </p>
              )}
            </div>
          ))}
        </div>
        {(!valuation.gaps || valuation.gaps.length === 0) && (
          <p className="empty-state">Great! No significant gaps identified</p>
        )}
      </section>

      {/* Improvement Suggestions */}
      <section className="dashboard-section">
        <h3 className="section-title">Recommended Improvements</h3>
        <div className="suggestions-list">
          {remainingSuggestions.length > 0 ? (
            remainingSuggestions.map((suggestion) => (
              <div key={suggestion.key} className={`suggestion-card priority-${suggestion.priority || 'medium'}`}>
                <div className="suggestion-header">
                  <h4>{suggestion.title}</h4>
                  {suggestion.priority && (
                    <span className={`priority-badge priority-${suggestion.priority}`}>
                      {suggestion.priority.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="suggestion-description">{suggestion.description}</p>
                {suggestion.impact && (
                  <p className="suggestion-impact">
                    Potential impact: +{formatCurrency(Math.abs(suggestion.impact))}
                  </p>
                )}
                <button
                  className="btn btn-small btn-primary"
                  onClick={() => handleMarkAsCompleted(suggestion.key)}
                  disabled={loading}
                >
                  Mark as Completed
                </button>
              </div>
            ))
          ) : (
            <p className="empty-state">All improvements completed! 🎉</p>
          )}
        </div>
      </section>

      {/* Completed Improvements */}
      {completedImprovements.length > 0 && (
        <section className="dashboard-section">
          <h3 className="section-title">Completed Improvements</h3>
          <div className="completed-improvements">
            {(valuation.suggestions || [])
              .filter(s => completedImprovements.includes(s.key))
              .map((suggestion) => (
                <div key={suggestion.key} className="completed-item">
                  <span className="check-mark">✓</span>
                  <span>{suggestion.title}</span>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Export Report Section */}
      <ExportReport valuationId={valuationId} />

      {/* Action Buttons */}
      <div className="dashboard-actions">
        <button
          className="btn btn-secondary"
          onClick={handleReturnToWizard}
          disabled={loading}
        >
          Update Data & Recalculate
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
