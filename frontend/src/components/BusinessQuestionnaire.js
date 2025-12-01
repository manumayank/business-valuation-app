/**
 * Business Questionnaire Component
 *
 * Dynamic questionnaire that loads questions based on engagement type
 * Supports multiple field types: text, number, select, date, textarea
 * Saves progress automatically
 */

import React, { useState, useEffect, useCallback } from 'react';
import './BusinessQuestionnaire.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Question sets for different engagement types
const QUESTIONNAIRE_TEMPLATES = {
  vac: {
    title: 'Value Acceleration Questionnaire',
    description: 'Help us understand your business to calculate value acceleration opportunities.',
    sections: [
      {
        id: 'company_info',
        title: 'Company Information',
        questions: [
          { id: 'companyName', label: 'Company Name', type: 'text', required: true },
          { id: 'industry', label: 'Industry', type: 'select', required: true, options: [
            'Technology', 'Healthcare', 'Manufacturing', 'Retail', 'Professional Services',
            'Construction', 'Financial Services', 'Real Estate', 'Transportation', 'Other'
          ]},
          { id: 'yearsInBusiness', label: 'Years in Business', type: 'number', required: true, min: 0, max: 200 },
          { id: 'employees', label: 'Number of Employees', type: 'number', required: true, min: 0 },
          { id: 'location', label: 'Primary Location (City, State)', type: 'text', required: false }
        ]
      },
      {
        id: 'financials',
        title: 'Financial Information',
        questions: [
          { id: 'annualRevenue', label: 'Annual Revenue ($)', type: 'currency', required: true },
          { id: 'ebitda', label: 'EBITDA ($)', type: 'currency', required: true, helpText: 'Earnings Before Interest, Taxes, Depreciation, and Amortization' },
          { id: 'netIncome', label: 'Net Income ($)', type: 'currency', required: false },
          { id: 'growthRate', label: 'Revenue Growth Rate (%)', type: 'percentage', required: true, min: -100, max: 500 },
          { id: 'profitMargin', label: 'Net Profit Margin (%)', type: 'percentage', required: true, min: -100, max: 100 }
        ]
      },
      {
        id: 'operations',
        title: 'Operations & Risk',
        questions: [
          { id: 'customerRetention', label: 'Customer Retention Rate (%)', type: 'percentage', required: true, min: 0, max: 100 },
          { id: 'topCustomerConcentration', label: 'Top Customer Revenue Concentration (%)', type: 'percentage', required: true, min: 0, max: 100, helpText: 'What % of revenue comes from your largest customer?' },
          { id: 'debtLevel', label: 'Debt-to-Equity Ratio', type: 'number', required: true, min: 0, max: 10, step: 0.1 },
          { id: 'ownerDependency', label: 'Owner Dependency Level', type: 'select', required: true, options: [
            'Low - Business runs independently',
            'Medium - Some owner involvement needed',
            'High - Business depends heavily on owner'
          ]}
        ]
      },
      {
        id: 'wealth_gap',
        title: 'Wealth Gap Analysis',
        questions: [
          { id: 'targetExitValue', label: 'Target Exit Value ($)', type: 'currency', required: true, helpText: 'How much do you want your business to be worth at exit?' },
          { id: 'yearsToExit', label: 'Years Until Planned Exit', type: 'number', required: true, min: 1, max: 30 },
          { id: 'retirementNeeds', label: 'Annual Retirement Income Needed ($)', type: 'currency', required: false },
          { id: 'otherAssets', label: 'Other Investment Assets ($)', type: 'currency', required: false, helpText: 'Assets outside the business (real estate, investments, etc.)' }
        ]
      }
    ]
  },
  valuation: {
    title: 'Business Valuation Questionnaire',
    description: 'Provide detailed information for an accurate business valuation.',
    sections: [
      {
        id: 'company_info',
        title: 'Company Overview',
        questions: [
          { id: 'companyName', label: 'Legal Business Name', type: 'text', required: true },
          { id: 'dbaName', label: 'DBA / Trade Name', type: 'text', required: false },
          { id: 'entityType', label: 'Entity Type', type: 'select', required: true, options: [
            'Sole Proprietorship', 'Partnership', 'LLC', 'S-Corporation', 'C-Corporation'
          ]},
          { id: 'industry', label: 'Industry / NAICS Code', type: 'text', required: true },
          { id: 'foundedYear', label: 'Year Founded', type: 'number', required: true, min: 1800, max: new Date().getFullYear() },
          { id: 'description', label: 'Business Description', type: 'textarea', required: true }
        ]
      },
      {
        id: 'financials',
        title: 'Financial Performance (Last 3 Years)',
        questions: [
          { id: 'revenue_y1', label: 'Revenue - Year 1 (Most Recent)', type: 'currency', required: true },
          { id: 'revenue_y2', label: 'Revenue - Year 2', type: 'currency', required: true },
          { id: 'revenue_y3', label: 'Revenue - Year 3', type: 'currency', required: true },
          { id: 'ebitda_y1', label: 'EBITDA - Year 1', type: 'currency', required: true },
          { id: 'ebitda_y2', label: 'EBITDA - Year 2', type: 'currency', required: true },
          { id: 'ebitda_y3', label: 'EBITDA - Year 3', type: 'currency', required: true },
          { id: 'ownerCompensation', label: 'Owner Compensation (Annual)', type: 'currency', required: true },
          { id: 'addbacks', label: 'Other Addbacks ($)', type: 'currency', required: false, helpText: 'Non-recurring expenses, personal expenses through business, etc.' }
        ]
      },
      {
        id: 'assets',
        title: 'Assets & Liabilities',
        questions: [
          { id: 'totalAssets', label: 'Total Assets ($)', type: 'currency', required: true },
          { id: 'totalLiabilities', label: 'Total Liabilities ($)', type: 'currency', required: true },
          { id: 'workingCapital', label: 'Working Capital ($)', type: 'currency', required: false },
          { id: 'realEstate', label: 'Real Estate Included?', type: 'select', required: true, options: ['Yes', 'No'] },
          { id: 'realEstateValue', label: 'Real Estate Value ($)', type: 'currency', required: false, conditional: { field: 'realEstate', value: 'Yes' } }
        ]
      }
    ]
  },
  exit_planning: {
    title: 'Exit Planning Questionnaire',
    description: 'Help us create your personalized exit strategy.',
    sections: [
      {
        id: 'exit_goals',
        title: 'Exit Goals',
        questions: [
          { id: 'exitTimeline', label: 'Desired Exit Timeline', type: 'select', required: true, options: [
            '0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years'
          ]},
          { id: 'exitType', label: 'Preferred Exit Type', type: 'select', required: true, options: [
            'Sale to Strategic Buyer', 'Sale to Financial Buyer (PE)', 'Sale to Management/Employees',
            'Family Succession', 'ESOP', 'IPO', 'Liquidation', 'Not Sure'
          ]},
          { id: 'minExitValue', label: 'Minimum Acceptable Exit Value ($)', type: 'currency', required: true },
          { id: 'idealExitValue', label: 'Ideal Exit Value ($)', type: 'currency', required: true },
          { id: 'postExitInvolvement', label: 'Desired Post-Exit Involvement', type: 'select', required: true, options: [
            'Complete exit - no involvement', 'Advisory role', 'Part-time involvement', 'Maintain minority ownership'
          ]}
        ]
      },
      {
        id: 'readiness',
        title: 'Business Readiness',
        questions: [
          { id: 'documentedProcesses', label: 'Are business processes documented?', type: 'select', required: true, options: ['Yes - Comprehensive', 'Partially', 'No'] },
          { id: 'managementTeam', label: 'Strength of management team without owner', type: 'select', required: true, options: ['Strong', 'Moderate', 'Weak', 'Non-existent'] },
          { id: 'customerContracts', label: 'Customer contract status', type: 'select', required: true, options: ['Long-term contracts', 'Mix of contracts', 'Month-to-month', 'No contracts'] },
          { id: 'vendorRelations', label: 'Key vendor relationships transferable?', type: 'select', required: true, options: ['Yes', 'Partially', 'No', 'Unknown'] }
        ]
      }
    ]
  },
  mna: {
    title: 'M&A Advisory Questionnaire',
    description: 'Provide information to help identify potential acquisition targets or buyers.',
    sections: [
      {
        id: 'deal_type',
        title: 'Transaction Type',
        questions: [
          { id: 'transactionType', label: 'Are you looking to:', type: 'select', required: true, options: ['Sell my business', 'Acquire a business', 'Merge with another company'] },
          { id: 'dealTimeline', label: 'Target Timeline', type: 'select', required: true, options: ['Immediate (0-6 months)', 'Near-term (6-12 months)', 'Medium-term (1-2 years)', 'Long-term planning'] },
          { id: 'dealSize', label: 'Target Deal Size ($)', type: 'currency', required: true },
          { id: 'financingNeeds', label: 'Financing Needs', type: 'select', required: true, options: ['All cash', 'Partial financing needed', 'Significant financing needed', 'Seller financing acceptable'] }
        ]
      },
      {
        id: 'criteria',
        title: 'Buyer/Target Criteria',
        questions: [
          { id: 'targetIndustries', label: 'Target Industries', type: 'textarea', required: true, helpText: 'List preferred industries, separated by commas' },
          { id: 'geographicPreference', label: 'Geographic Preference', type: 'select', required: true, options: ['Local only', 'Regional', 'National', 'International'] },
          { id: 'sizePreference', label: 'Company Size Preference', type: 'text', required: false, helpText: 'Revenue range, employee count, etc.' },
          { id: 'synergies', label: 'Key Synergies Sought', type: 'textarea', required: false }
        ]
      }
    ]
  }
};

const BusinessQuestionnaire = ({ engagementId, engagementType, accessToken, onProgressChange }) => {
  const [template, setTemplate] = useState(null);
  const [responses, setResponses] = useState({});
  const [currentSection, setCurrentSection] = useState(0);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [errors, setErrors] = useState({});

  // Load template and existing responses
  useEffect(() => {
    const loadedTemplate = QUESTIONNAIRE_TEMPLATES[engagementType] || QUESTIONNAIRE_TEMPLATES.vac;
    setTemplate(loadedTemplate);
    loadExistingResponses();
  }, [engagementType, engagementId]);

  // Calculate and report progress
  useEffect(() => {
    if (template && onProgressChange) {
      const progress = calculateProgress();
      onProgressChange(progress);
    }
  }, [responses, template]);

  const loadExistingResponses = async () => {
    try {
      const response = await fetch(`${API_URL}/business-portal/${accessToken}/responses`);
      if (response.ok) {
        const data = await response.json();
        setResponses(data.responses || {});
      }
    } catch (err) {
      console.error('Error loading responses:', err);
    }
  };

  const calculateProgress = () => {
    if (!template) return 0;

    let totalRequired = 0;
    let answeredRequired = 0;

    template.sections.forEach(section => {
      section.questions.forEach(q => {
        if (q.required) {
          totalRequired++;
          if (responses[q.id] !== undefined && responses[q.id] !== '') {
            answeredRequired++;
          }
        }
      });
    });

    return totalRequired > 0 ? Math.round((answeredRequired / totalRequired) * 100) : 0;
  };

  const handleInputChange = useCallback((questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));

    // Clear error for this field
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }

    // Auto-save after 1 second of no typing
    debouncedSave();
  }, [errors]);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async () => {
      await saveResponses();
    }, 1000),
    [responses, accessToken]
  );

  const saveResponses = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/business-portal/${accessToken}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses })
      });

      if (response.ok) {
        setLastSaved(new Date());
      }
    } catch (err) {
      console.error('Error saving responses:', err);
    } finally {
      setSaving(false);
    }
  };

  const validateSection = (sectionIndex) => {
    const section = template.sections[sectionIndex];
    const newErrors = {};

    section.questions.forEach(q => {
      if (q.required && (responses[q.id] === undefined || responses[q.id] === '')) {
        newErrors[q.id] = 'This field is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToNextSection = () => {
    if (validateSection(currentSection)) {
      saveResponses();
      if (currentSection < template.sections.length - 1) {
        setCurrentSection(currentSection + 1);
        window.scrollTo(0, 0);
      }
    }
  };

  const goToPrevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    if (validateSection(currentSection)) {
      await saveResponses();
      // Trigger final submission
      try {
        await fetch(`${API_URL}/business-portal/${accessToken}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ responses })
        });
      } catch (err) {
        console.error('Submit error:', err);
      }
    }
  };

  if (!template) {
    return <div className="questionnaire-loading">Loading questionnaire...</div>;
  }

  const currentSectionData = template.sections[currentSection];
  const progress = calculateProgress();

  return (
    <div className="business-questionnaire">
      {/* Progress Bar */}
      <div className="questionnaire-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-info">
          <span>{progress}% Complete</span>
          {saving && <span className="saving-indicator">Saving...</span>}
          {lastSaved && !saving && (
            <span className="saved-indicator">Saved {formatTime(lastSaved)}</span>
          )}
        </div>
      </div>

      {/* Section Navigation */}
      <div className="section-nav">
        {template.sections.map((section, idx) => (
          <button
            key={section.id}
            className={`section-nav-item ${idx === currentSection ? 'active' : ''} ${idx < currentSection ? 'completed' : ''}`}
            onClick={() => setCurrentSection(idx)}
          >
            <span className="section-number">{idx + 1}</span>
            <span className="section-title">{section.title}</span>
          </button>
        ))}
      </div>

      {/* Current Section */}
      <div className="questionnaire-section">
        <div className="section-header">
          <h2>{currentSectionData.title}</h2>
          <p className="section-step">Step {currentSection + 1} of {template.sections.length}</p>
        </div>

        <div className="questions-list">
          {currentSectionData.questions.map(question => (
            <QuestionField
              key={question.id}
              question={question}
              value={responses[question.id]}
              onChange={(value) => handleInputChange(question.id, value)}
              error={errors[question.id]}
              allResponses={responses}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="section-actions">
          {currentSection > 0 && (
            <button className="btn-secondary" onClick={goToPrevSection}>
              Previous
            </button>
          )}
          {currentSection < template.sections.length - 1 ? (
            <button className="btn-primary" onClick={goToNextSection}>
              Next Section
            </button>
          ) : (
            <button className="btn-primary btn-submit" onClick={handleSubmit}>
              Submit Questionnaire
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Question Field Component
const QuestionField = ({ question, value, onChange, error, allResponses }) => {
  // Check conditional visibility
  if (question.conditional) {
    const conditionMet = allResponses[question.conditional.field] === question.conditional.value;
    if (!conditionMet) return null;
  }

  const renderInput = () => {
    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            className={error ? 'input-error' : ''}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            min={question.min}
            max={question.max}
            step={question.step || 1}
            className={error ? 'input-error' : ''}
          />
        );

      case 'currency':
        return (
          <div className="currency-input">
            <span className="currency-symbol">$</span>
            <input
              type="text"
              value={value ? formatCurrency(value) : ''}
              onChange={(e) => onChange(parseCurrency(e.target.value))}
              placeholder="0"
              className={error ? 'input-error' : ''}
            />
          </div>
        );

      case 'percentage':
        return (
          <div className="percentage-input">
            <input
              type="number"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              min={question.min}
              max={question.max}
              step={0.1}
              className={error ? 'input-error' : ''}
            />
            <span className="percentage-symbol">%</span>
          </div>
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={error ? 'input-error' : ''}
          >
            <option value="">Select an option...</option>
            {question.options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            placeholder={question.placeholder}
            className={error ? 'input-error' : ''}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={error ? 'input-error' : ''}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={error ? 'input-error' : ''}
          />
        );
    }
  };

  return (
    <div className={`question-field ${error ? 'has-error' : ''}`}>
      <label>
        {question.label}
        {question.required && <span className="required-mark">*</span>}
      </label>
      {question.helpText && <p className="help-text">{question.helpText}</p>}
      {renderInput()}
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

// Utility functions
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const formatCurrency = (value) => {
  if (!value) return '';
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('en-US').format(num);
};

const parseCurrency = (value) => {
  if (!value) return '';
  return value.replace(/[^0-9.]/g, '');
};

const formatTime = (date) => {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return date.toLocaleTimeString();
};

export default BusinessQuestionnaire;
