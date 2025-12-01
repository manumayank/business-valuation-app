import React from 'react';
import '../styles/DealAnalysis.css';

const SynergyAnalysis = ({ analysis }) => {
  if (!analysis || !analysis.synergies) return null;

  const { synergies } = analysis;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="synergy-analysis-container">
      <h3 className="deal-section-title">💼 Synergy Analysis</h3>

      {/* Total Synergies */}
      <div className="synergy-total-card">
        <div className="synergy-total-amount">{formatCurrency(synergies.totalSynergies)}</div>
        <div className="synergy-total-label">Total Identified Synergies</div>
        <div className="synergy-as-percentage">
          {synergies.synergiesAsPercentOfPrice.toFixed(1)}% of purchase price
        </div>
      </div>

      {/* Revenue Synergies */}
      <div className="synergy-category">
        <h4 className="synergy-category-title">📈 Revenue Synergies</h4>
        <div className="synergy-items">
          {synergies.revenue.crossSelling > 0 && (
            <div className="synergy-item">
              <div className="synergy-item-name">Cross-Selling</div>
              <div className="synergy-item-value">{formatCurrency(synergies.revenue.crossSelling)}</div>
            </div>
          )}
          {synergies.revenue.marketExpansion > 0 && (
            <div className="synergy-item">
              <div className="synergy-item-name">Market Expansion</div>
              <div className="synergy-item-value">{formatCurrency(synergies.revenue.marketExpansion)}</div>
            </div>
          )}
          {synergies.revenue.productExpansion > 0 && (
            <div className="synergy-item">
              <div className="synergy-item-name">Product Expansion</div>
              <div className="synergy-item-value">{formatCurrency(synergies.revenue.productExpansion)}</div>
            </div>
          )}
          {synergies.revenue.other > 0 && (
            <div className="synergy-item">
              <div className="synergy-item-name">Other Revenue</div>
              <div className="synergy-item-value">{formatCurrency(synergies.revenue.other)}</div>
            </div>
          )}
          <div className="synergy-subtotal">
            <div className="synergy-subtotal-label">Revenue Synergies Total</div>
            <div className="synergy-subtotal-value">{formatCurrency(synergies.revenue.total)}</div>
          </div>
        </div>
      </div>

      {/* Cost Synergies */}
      <div className="synergy-category">
        <h4 className="synergy-category-title">📉 Cost Synergies</h4>
        <div className="synergy-items">
          {synergies.cost.operationalEfficiency > 0 && (
            <div className="synergy-item">
              <div className="synergy-item-name">Operational Efficiency</div>
              <div className="synergy-item-value">{formatCurrency(synergies.cost.operationalEfficiency)}</div>
            </div>
          )}
          {synergies.cost.overheadReduction > 0 && (
            <div className="synergy-item">
              <div className="synergy-item-name">Overhead Reduction</div>
              <div className="synergy-item-value">{formatCurrency(synergies.cost.overheadReduction)}</div>
            </div>
          )}
          {synergies.cost.rnd > 0 && (
            <div className="synergy-item">
              <div className="synergy-item-name">R&D Consolidation</div>
              <div className="synergy-item-value">{formatCurrency(synergies.cost.rnd)}</div>
            </div>
          )}
          {synergies.cost.other > 0 && (
            <div className="synergy-item">
              <div className="synergy-item-name">Other Cost Savings</div>
              <div className="synergy-item-value">{formatCurrency(synergies.cost.other)}</div>
            </div>
          )}
          <div className="synergy-subtotal">
            <div className="synergy-subtotal-label">Cost Synergies Total</div>
            <div className="synergy-subtotal-value">{formatCurrency(synergies.cost.total)}</div>
          </div>
        </div>
      </div>

      {/* Financial Synergies */}
      {synergies.financial.total > 0 && (
        <div className="synergy-category">
          <h4 className="synergy-category-title">💰 Financial Synergies</h4>
          <div className="synergy-items">
            {synergies.financial.taxBenefits > 0 && (
              <div className="synergy-item">
                <div className="synergy-item-name">Tax Benefits</div>
                <div className="synergy-item-value">{formatCurrency(synergies.financial.taxBenefits)}</div>
              </div>
            )}
            <div className="synergy-subtotal">
              <div className="synergy-subtotal-label">Financial Synergies Total</div>
              <div className="synergy-subtotal-value">{formatCurrency(synergies.financial.total)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Synergy Summary */}
      <div className="synergy-summary">
        <h4>Synergy Implementation</h4>
        <ul>
          <li>
            <strong>Realization Timeline:</strong> Most synergies typically realized over 12-24 months
          </li>
          <li>
            <strong>Confidence Level:</strong> Cost synergies are more predictable than revenue synergies
          </li>
          <li>
            <strong>Implementation Risk:</strong> ~20% synergy slippage is typical in M&A deals
          </li>
          <li>
            <strong>Management:</strong> Dedicated integration team required for complex synergies
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SynergyAnalysis;
