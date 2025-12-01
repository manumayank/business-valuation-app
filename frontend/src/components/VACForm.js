import React, { useState, useEffect } from 'react';
import './VACForm.css';
import { searchIndustries, calculateVAC } from '../services/api';

const VACForm = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [industrySearch, setIndustrySearch] = useState('');
  const [industryResults, setIndustryResults] = useState([]);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const totalSteps = 5;

  // Form data matching the 14 risk questions + financial inputs
  const [formData, setFormData] = useState({
    // Business Info
    businessName: '',
    naicsCode: '',
    industryName: '',

    // Financial Info
    revenue: '',
    pretaxProfit: '',
    interest: '',
    depreciation: '',
    amortization: '',
    discretionary: '',
    ownerSalaryAdjustment: '',
    rentAdjustment: '',
    useBaseline: false,

    // Multiple Selection
    multipleType: 'common',
    businessSize: 'small',
    customMultiple: '',

    // Value Acceleration Inputs
    revenueGrowth: '10',
    ebitdaImprovement: '5',
    multipleImprovement: '0.5',

    // Wealth Gap Inputs (Basic)
    targetWealth: '',
    yearsToProject: '5',
    growthRate: '10',

    // Enhanced Wealth Gap - Step 1: Current Scenario
    wg_dividends: '',
    wg_wages: '',
    wg_personalExpenses: '',
    wg_passiveIncome: '',
    wg_liquidAssets: '',
    wg_nonMortgageDebt: '',

    // Enhanced Wealth Gap - Step 2: Exit Goals
    wg_desiredIncome: '',
    wg_exitTimeline: '5',

    // Enhanced Wealth Gap - Step 4: Sale Price Factors
    wg_ownershipPercent: '100',
    wg_longTermDebt: '',
    wg_portfolioReturn: '7.5',
    wg_feeTaxRate: '10',
    wg_historicalGrowthRate: '3',

    // Risk Questions (Q1-Q14)
    q1_fiscalYearEnd: '',
    q2_incorporated: '',
    q3_profitLastYear: '',
    q4_lastSixMonths: '',
    q5_cleanFinancialYears: '',
    q6_hasGeneralManager: '',
    q7_projectBased: '',
    q8_largestCustomerPercent: '',
    q9_ownerHours: '',
    q10_leaseYears: '',
    q11_businessAge: '',
    q12_operatingSystem: '',
    q13_paymentTerms: '',
    q14_numberOfSPOFs: ''
  });

  // Industry search with debounce
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (industrySearch.length >= 2) {
        try {
          const result = await searchIndustries(industrySearch);
          if (result.success) {
            setIndustryResults(result.data);
            setShowIndustryDropdown(true);
          }
        } catch (err) {
          console.error('Industry search error:', err);
        }
      } else {
        setIndustryResults([]);
        setShowIndustryDropdown(false);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [industrySearch]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const selectIndustry = (industry) => {
    setFormData(prev => ({
      ...prev,
      naicsCode: industry.code,
      industryName: industry.title
    }));
    setIndustrySearch(industry.title);
    setShowIndustryDropdown(false);
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1: // Business & Financial Info
        if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
        if (!formData.revenue) newErrors.revenue = 'Annual revenue is required';
        else if (parseFloat(formData.revenue) <= 0) newErrors.revenue = 'Revenue must be positive';
        break;

      case 2: // Risk Questions Part 1 (Q1-Q7)
        if (!formData.q1_fiscalYearEnd) newErrors.q1_fiscalYearEnd = 'Please answer this question';
        if (!formData.q2_incorporated) newErrors.q2_incorporated = 'Please answer this question';
        if (!formData.q3_profitLastYear) newErrors.q3_profitLastYear = 'Please answer this question';
        if (!formData.q4_lastSixMonths) newErrors.q4_lastSixMonths = 'Please answer this question';
        if (!formData.q5_cleanFinancialYears) newErrors.q5_cleanFinancialYears = 'Please answer this question';
        if (!formData.q6_hasGeneralManager) newErrors.q6_hasGeneralManager = 'Please answer this question';
        if (!formData.q7_projectBased) newErrors.q7_projectBased = 'Please answer this question';
        break;

      case 3: // Risk Questions Part 2 (Q8-Q14)
        if (!formData.q8_largestCustomerPercent) newErrors.q8_largestCustomerPercent = 'Please answer this question';
        if (!formData.q9_ownerHours) newErrors.q9_ownerHours = 'Please answer this question';
        if (!formData.q10_leaseYears) newErrors.q10_leaseYears = 'Please answer this question';
        if (!formData.q11_businessAge) newErrors.q11_businessAge = 'Please answer this question';
        if (!formData.q12_operatingSystem) newErrors.q12_operatingSystem = 'Please answer this question';
        if (!formData.q13_paymentTerms) newErrors.q13_paymentTerms = 'Please answer this question';
        if (!formData.q14_numberOfSPOFs) newErrors.q14_numberOfSPOFs = 'Please answer this question';
        break;

      case 4: // Value & Wealth Gap Settings
        if (formData.multipleType === 'custom' && !formData.customMultiple) {
          newErrors.customMultiple = 'Custom multiple is required';
        }
        break;

      case 5: // Enhanced Wealth Gap
        if (!formData.wg_desiredIncome) {
          newErrors.wg_desiredIncome = 'Desired post-sale income is required for wealth gap analysis';
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    setSubmitError(null);

    try {
      // Build the API payload
      const payload = {
        // Risk answers
        q1: formData.q1_fiscalYearEnd,
        q2: formData.q2_incorporated,
        q3: formData.q3_profitLastYear,
        q4: formData.q4_lastSixMonths,
        q5: formData.q5_cleanFinancialYears,
        q6: formData.q6_hasGeneralManager,
        q7: formData.q7_projectBased,
        q8: formData.q8_largestCustomerPercent,
        q9: formData.q9_ownerHours,
        q10: formData.q10_leaseYears,
        q11: formData.q11_businessAge,
        q12: formData.q12_operatingSystem,
        q13: formData.q13_paymentTerms,
        q14: formData.q14_numberOfSPOFs,

        // Financial inputs
        revenue: formData.revenue,
        pretaxProfit: formData.pretaxProfit || undefined,
        interest: formData.interest || undefined,
        depreciation: formData.depreciation || undefined,
        amortization: formData.amortization || undefined,
        discretionary: formData.discretionary || undefined,
        ownerSalaryAdjustment: formData.ownerSalaryAdjustment || undefined,
        rentAdjustment: formData.rentAdjustment || undefined,
        useBaseline: formData.useBaseline,

        // Multiple selection
        multipleType: formData.multipleType,
        businessSize: formData.businessSize,
        customMultiple: formData.customMultiple ? parseFloat(formData.customMultiple) : undefined,
        industryCode: formData.naicsCode || undefined,

        // Value acceleration
        revenueGrowth: parseFloat(formData.revenueGrowth) / 100,
        ebitdaImprovement: formData.ebitdaImprovement ? parseFloat(formData.ebitdaImprovement) / 100 : undefined,
        multipleImprovement: parseFloat(formData.multipleImprovement),

        // Basic Wealth gap
        targetWealth: formData.targetWealth ? parseFloat(formData.targetWealth) : undefined,
        yearsToProject: parseInt(formData.yearsToProject, 10),
        growthRate: parseFloat(formData.growthRate) / 100,

        // Enhanced Wealth Gap - Current Scenario (Step 1)
        wealthGap: {
          dividends: formData.wg_dividends ? parseFloat(formData.wg_dividends) : 0,
          wages: formData.wg_wages ? parseFloat(formData.wg_wages) : 0,
          personalExpenses: formData.wg_personalExpenses ? parseFloat(formData.wg_personalExpenses) : 0,
          passiveIncome: formData.wg_passiveIncome ? parseFloat(formData.wg_passiveIncome) : 0,
          liquidAssets: formData.wg_liquidAssets ? parseFloat(formData.wg_liquidAssets) : 0,
          nonMortgageDebt: formData.wg_nonMortgageDebt ? parseFloat(formData.wg_nonMortgageDebt) : 0,
          // Exit Goals (Step 2)
          desiredIncome: formData.wg_desiredIncome ? parseFloat(formData.wg_desiredIncome) : undefined,
          exitTimeline: parseInt(formData.wg_exitTimeline, 10) || 5,
          // Sale Price Factors (Step 4)
          ownershipPercent: parseFloat(formData.wg_ownershipPercent) / 100 || 1.0,
          longTermDebt: formData.wg_longTermDebt ? parseFloat(formData.wg_longTermDebt) : 0,
          portfolioReturn: parseFloat(formData.wg_portfolioReturn) / 100 || 0.075,
          feeTaxRate: parseFloat(formData.wg_feeTaxRate) / 100 || 0.10,
          historicalGrowthRate: parseFloat(formData.wg_historicalGrowthRate) / 100 || 0.03
        }
      };

      const response = await calculateVAC(payload);

      if (response.success) {
        onComplete({
          ...response.data,
          businessName: formData.businessName,
          industryName: formData.industryName
        });
      } else {
        setSubmitError(response.error || 'Calculation failed');
      }
    } catch (err) {
      setSubmitError(err.response?.data?.error || err.message || 'Failed to calculate VAC');
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <div className="vac-progress">
      <div className="vac-progress-bar">
        <div
          className="vac-progress-fill"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
      <div className="vac-progress-steps">
        {[1, 2, 3, 4, 5].map(step => (
          <div
            key={step}
            className={`vac-progress-step ${currentStep >= step ? 'active' : ''}`}
          >
            {step}
          </div>
        ))}
      </div>
      <div className="vac-progress-labels">
        <span>Business</span>
        <span>Risk 1-7</span>
        <span>Risk 8-14</span>
        <span>Settings</span>
        <span>Wealth Gap</span>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="vac-step">
      <h3>Business & Financial Information</h3>

      <div className="vac-form-group">
        <label>Business Name *</label>
        <input
          type="text"
          name="businessName"
          value={formData.businessName}
          onChange={handleInputChange}
          placeholder="Enter business name"
          className={errors.businessName ? 'error' : ''}
        />
        {errors.businessName && <span className="error-text">{errors.businessName}</span>}
      </div>

      <div className="vac-form-group">
        <label>Industry (NAICS)</label>
        <input
          type="text"
          value={industrySearch}
          onChange={(e) => setIndustrySearch(e.target.value)}
          placeholder="Search industry..."
          onFocus={() => industryResults.length > 0 && setShowIndustryDropdown(true)}
        />
        {showIndustryDropdown && industryResults.length > 0 && (
          <div className="industry-dropdown">
            {industryResults.map(ind => (
              <div
                key={ind.code}
                className="industry-option"
                onClick={() => selectIndustry(ind)}
              >
                <span className="industry-code">{ind.code}</span>
                <span className="industry-title">{ind.title}</span>
              </div>
            ))}
          </div>
        )}
        {formData.naicsCode && (
          <small className="selected-industry">Selected: {formData.naicsCode} - {formData.industryName}</small>
        )}
      </div>

      <div className="vac-form-group">
        <label>Annual Revenue *</label>
        <input
          type="text"
          name="revenue"
          value={formData.revenue}
          onChange={handleInputChange}
          placeholder="e.g., 1000000 or $1,000,000"
          className={errors.revenue ? 'error' : ''}
        />
        {errors.revenue && <span className="error-text">{errors.revenue}</span>}
      </div>

      <div className="vac-form-row">
        <div className="vac-form-group">
          <label>Pretax Profit</label>
          <input
            type="text"
            name="pretaxProfit"
            value={formData.pretaxProfit}
            onChange={handleInputChange}
            placeholder="Optional"
          />
        </div>
        <div className="vac-form-group">
          <label>Interest Expense</label>
          <input
            type="text"
            name="interest"
            value={formData.interest}
            onChange={handleInputChange}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="vac-form-row">
        <div className="vac-form-group">
          <label>Depreciation</label>
          <input
            type="text"
            name="depreciation"
            value={formData.depreciation}
            onChange={handleInputChange}
            placeholder="Optional"
          />
        </div>
        <div className="vac-form-group">
          <label>Amortization</label>
          <input
            type="text"
            name="amortization"
            value={formData.amortization}
            onChange={handleInputChange}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="vac-form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="useBaseline"
            checked={formData.useBaseline}
            onChange={handleInputChange}
          />
          Use baseline EBITDA calculation (11.5% of revenue)
        </label>
        <small>Check this if you don't have detailed financial data</small>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="vac-step">
      <h3>Risk Assessment (Questions 1-7)</h3>

      <div className="vac-form-group">
        <label>Q1: Does your fiscal year end match the calendar year (Dec 31)? *</label>
        <div className="radio-group">
          <label><input type="radio" name="q1_fiscalYearEnd" value="yes" checked={formData.q1_fiscalYearEnd === 'yes'} onChange={handleInputChange} /> Yes</label>
          <label><input type="radio" name="q1_fiscalYearEnd" value="no" checked={formData.q1_fiscalYearEnd === 'no'} onChange={handleInputChange} /> No</label>
        </div>
        {errors.q1_fiscalYearEnd && <span className="error-text">{errors.q1_fiscalYearEnd}</span>}
      </div>

      <div className="vac-form-group">
        <label>Q2: Is your business incorporated? *</label>
        <div className="radio-group">
          <label><input type="radio" name="q2_incorporated" value="yes" checked={formData.q2_incorporated === 'yes'} onChange={handleInputChange} /> Yes</label>
          <label><input type="radio" name="q2_incorporated" value="no" checked={formData.q2_incorporated === 'no'} onChange={handleInputChange} /> No</label>
        </div>
        {errors.q2_incorporated && <span className="error-text">{errors.q2_incorporated}</span>}
      </div>

      <div className="vac-form-group">
        <label>Q3: Did your business make a profit last year? *</label>
        <div className="radio-group">
          <label><input type="radio" name="q3_profitLastYear" value="yes" checked={formData.q3_profitLastYear === 'yes'} onChange={handleInputChange} /> Yes</label>
          <label><input type="radio" name="q3_profitLastYear" value="no" checked={formData.q3_profitLastYear === 'no'} onChange={handleInputChange} /> No</label>
        </div>
        {errors.q3_profitLastYear && <span className="error-text">{errors.q3_profitLastYear}</span>}
      </div>

      <div className="vac-form-group">
        <label>Q4: How has your business performed in the last 6 months? *</label>
        <select name="q4_lastSixMonths" value={formData.q4_lastSixMonths} onChange={handleInputChange} className={errors.q4_lastSixMonths ? 'error' : ''}>
          <option value="">Select...</option>
          <option value="10%+ YOY Steady Growth">10%+ YOY Steady Growth</option>
          <option value="Modest YOY Steady Growth">Modest YOY Steady Growth</option>
          <option value="Flat">Flat</option>
          <option value="Declining">Declining</option>
        </select>
        {errors.q4_lastSixMonths && <span className="error-text">{errors.q4_lastSixMonths}</span>}
      </div>

      <div className="vac-form-group">
        <label>Q5: How many years of clean financials do you have? *</label>
        <select name="q5_cleanFinancialYears" value={formData.q5_cleanFinancialYears} onChange={handleInputChange} className={errors.q5_cleanFinancialYears ? 'error' : ''}>
          <option value="">Select...</option>
          <option value="5+">5+ years</option>
          <option value="3-4">3-4 years</option>
          <option value="1-2">1-2 years</option>
          <option value="none">None / Less than 1 year</option>
        </select>
        {errors.q5_cleanFinancialYears && <span className="error-text">{errors.q5_cleanFinancialYears}</span>}
      </div>

      <div className="vac-form-group">
        <label>Q6: Do you have a General Manager who could run the business? *</label>
        <div className="radio-group">
          <label><input type="radio" name="q6_hasGeneralManager" value="yes" checked={formData.q6_hasGeneralManager === 'yes'} onChange={handleInputChange} /> Yes</label>
          <label><input type="radio" name="q6_hasGeneralManager" value="no" checked={formData.q6_hasGeneralManager === 'no'} onChange={handleInputChange} /> No</label>
        </div>
        {errors.q6_hasGeneralManager && <span className="error-text">{errors.q6_hasGeneralManager}</span>}
      </div>

      <div className="vac-form-group">
        <label>Q7: Is your business project-based (vs. recurring revenue)? *</label>
        <select name="q7_projectBased" value={formData.q7_projectBased} onChange={handleInputChange} className={errors.q7_projectBased ? 'error' : ''}>
          <option value="">Select...</option>
          <option value="no">No - Mostly recurring revenue</option>
          <option value="between">Between - Mix of both</option>
          <option value="yes">Yes - Mostly project-based</option>
        </select>
        {errors.q7_projectBased && <span className="error-text">{errors.q7_projectBased}</span>}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="vac-step">
      <h3>Risk Assessment (Questions 8-14)</h3>

      <div className="vac-form-group">
        <label>Q8: What % of revenue comes from your largest customer? *</label>
        <select name="q8_largestCustomerPercent" value={formData.q8_largestCustomerPercent} onChange={handleInputChange} className={errors.q8_largestCustomerPercent ? 'error' : ''}>
          <option value="">Select...</option>
          <option value="<5%">Less than 5%</option>
          <option value="5-10%">5-10%</option>
          <option value="10-15%">10-15%</option>
          <option value="15-25%">15-25%</option>
          <option value=">25%">More than 25%</option>
        </select>
        {errors.q8_largestCustomerPercent && <span className="error-text">{errors.q8_largestCustomerPercent}</span>}
      </div>

      <div className="vac-form-group">
        <label>Q9: How many hours per week does the owner work in the business? *</label>
        <select name="q9_ownerHours" value={formData.q9_ownerHours} onChange={handleInputChange} className={errors.q9_ownerHours ? 'error' : ''}>
          <option value="">Select...</option>
          <option value="<10">Less than 10 hours</option>
          <option value="10-20">10-20 hours</option>
          <option value="20-30">20-30 hours</option>
          <option value="30+">30+ hours</option>
        </select>
        {errors.q9_ownerHours && <span className="error-text">{errors.q9_ownerHours}</span>}
      </div>

      <div className="vac-form-group">
        <label>Q10: How many years remain on your lease (or do you own the building)? *</label>
        <select name="q10_leaseYears" value={formData.q10_leaseYears} onChange={handleInputChange} className={errors.q10_leaseYears ? 'error' : ''}>
          <option value="">Select...</option>
          <option value="own">Own the building</option>
          <option value="10+">10+ years remaining</option>
          <option value="5-10">5-10 years remaining</option>
          <option value="<5">Less than 5 years</option>
        </select>
        {errors.q10_leaseYears && <span className="error-text">{errors.q10_leaseYears}</span>}
      </div>

      <div className="vac-form-group">
        <label>Q11: How old is your business? *</label>
        <select name="q11_businessAge" value={formData.q11_businessAge} onChange={handleInputChange} className={errors.q11_businessAge ? 'error' : ''}>
          <option value="">Select...</option>
          <option value="25+">25+ years</option>
          <option value="15-25">15-25 years</option>
          <option value="10-15">10-15 years</option>
          <option value="<10">Less than 10 years</option>
        </select>
        {errors.q11_businessAge && <span className="error-text">{errors.q11_businessAge}</span>}
      </div>

      <div className="vac-form-group">
        <label>Q12: What operating system do you use? *</label>
        <select name="q12_operatingSystem" value={formData.q12_operatingSystem} onChange={handleInputChange} className={errors.q12_operatingSystem ? 'error' : ''}>
          <option value="">Select...</option>
          <option value="Cloud-based ERP">Cloud-based ERP (e.g., NetSuite, SAP)</option>
          <option value="Customized CRM">Customized CRM</option>
          <option value="Basic">Basic / Spreadsheets</option>
          <option value="None">No formal system</option>
        </select>
        {errors.q12_operatingSystem && <span className="error-text">{errors.q12_operatingSystem}</span>}
      </div>

      <div className="vac-form-group">
        <label>Q13: What are your typical customer payment terms? *</label>
        <select name="q13_paymentTerms" value={formData.q13_paymentTerms} onChange={handleInputChange} className={errors.q13_paymentTerms ? 'error' : ''}>
          <option value="">Select...</option>
          <option value="Contracted Recurring Monthly">Contracted Recurring Monthly</option>
          <option value="30-60 days">30-60 days</option>
          <option value="60-90 days">60-90 days</option>
          <option value="90+ days">90+ days</option>
        </select>
        {errors.q13_paymentTerms && <span className="error-text">{errors.q13_paymentTerms}</span>}
      </div>

      <div className="vac-form-group">
        <label>Q14: How many Single Points of Failure (SPOFs) exist in your business? *</label>
        <small className="helper-text">SPOFs are critical dependencies (key person, single supplier, one major client, etc.)</small>
        <select name="q14_numberOfSPOFs" value={formData.q14_numberOfSPOFs} onChange={handleInputChange} className={errors.q14_numberOfSPOFs ? 'error' : ''}>
          <option value="">Select...</option>
          <option value="0">0 - No single points of failure</option>
          <option value="1">1 SPOF</option>
          <option value="2-3">2-3 SPOFs</option>
          <option value="4-5">4-5 SPOFs</option>
          <option value="6+">6 or more SPOFs</option>
        </select>
        {errors.q14_numberOfSPOFs && <span className="error-text">{errors.q14_numberOfSPOFs}</span>}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="vac-step">
      <h3>Valuation & Growth Settings</h3>

      <div className="vac-section">
        <h4>Multiple Selection</h4>

        <div className="vac-form-group">
          <label>Multiple Type</label>
          <select name="multipleType" value={formData.multipleType} onChange={handleInputChange}>
            <option value="common">Common (by business size)</option>
            <option value="industry">Industry-specific</option>
            <option value="custom">Custom multiple</option>
          </select>
        </div>

        {formData.multipleType === 'common' && (
          <div className="vac-form-group">
            <label>Business Size</label>
            <select name="businessSize" value={formData.businessSize} onChange={handleInputChange}>
              <option value="micro">Micro (&lt;$500K revenue)</option>
              <option value="small">Small ($500K-$2M)</option>
              <option value="medium">Medium ($2M-$10M)</option>
              <option value="large">Large ($10M+)</option>
            </select>
          </div>
        )}

        {formData.multipleType === 'custom' && (
          <div className="vac-form-group">
            <label>Custom Multiple *</label>
            <input
              type="number"
              name="customMultiple"
              value={formData.customMultiple}
              onChange={handleInputChange}
              placeholder="e.g., 4.5"
              step="0.1"
              min="0"
              className={errors.customMultiple ? 'error' : ''}
            />
            {errors.customMultiple && <span className="error-text">{errors.customMultiple}</span>}
          </div>
        )}
      </div>

      <div className="vac-section">
        <h4>Value Acceleration Assumptions</h4>

        <div className="vac-form-row">
          <div className="vac-form-group">
            <label>Revenue Growth (%)</label>
            <input
              type="number"
              name="revenueGrowth"
              value={formData.revenueGrowth}
              onChange={handleInputChange}
              placeholder="10"
              min="0"
              max="100"
            />
          </div>
          <div className="vac-form-group">
            <label>EBITDA Improvement (%)</label>
            <input
              type="number"
              name="ebitdaImprovement"
              value={formData.ebitdaImprovement}
              onChange={handleInputChange}
              placeholder="5"
              min="0"
              max="100"
            />
          </div>
          <div className="vac-form-group">
            <label>Multiple Improvement</label>
            <input
              type="number"
              name="multipleImprovement"
              value={formData.multipleImprovement}
              onChange={handleInputChange}
              placeholder="0.5"
              step="0.1"
              min="0"
            />
          </div>
        </div>
      </div>

      <div className="vac-section">
        <h4>Wealth Gap Analysis</h4>

        <div className="vac-form-row">
          <div className="vac-form-group">
            <label>Target Wealth ($)</label>
            <input
              type="text"
              name="targetWealth"
              value={formData.targetWealth}
              onChange={handleInputChange}
              placeholder="e.g., 5000000"
            />
          </div>
          <div className="vac-form-group">
            <label>Years to Project</label>
            <input
              type="number"
              name="yearsToProject"
              value={formData.yearsToProject}
              onChange={handleInputChange}
              min="1"
              max="20"
            />
          </div>
          <div className="vac-form-group">
            <label>Annual Growth Rate (%)</label>
            <input
              type="number"
              name="growthRate"
              value={formData.growthRate}
              onChange={handleInputChange}
              min="0"
              max="50"
            />
          </div>
        </div>
      </div>

      <div className="vac-section">
        <h4>EBITDA Adjustments (Optional)</h4>

        <div className="vac-form-row">
          <div className="vac-form-group">
            <label>Owner Salary Adjustment ($)</label>
            <input
              type="text"
              name="ownerSalaryAdjustment"
              value={formData.ownerSalaryAdjustment}
              onChange={handleInputChange}
              placeholder="Positive = below market"
            />
            <small>Positive if owner paid below market rate</small>
          </div>
          <div className="vac-form-group">
            <label>Rent Adjustment ($)</label>
            <input
              type="text"
              name="rentAdjustment"
              value={formData.rentAdjustment}
              onChange={handleInputChange}
              placeholder="Positive = below market"
            />
            <small>Positive if rent is below market rate</small>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="vac-step">
      <h3>Enhanced Wealth Gap Analysis</h3>
      <p className="step-description">Plan your exit strategy by analyzing your current financial situation and target goals.</p>

      <div className="vac-section">
        <h4>Step 1: Current Financial Scenario</h4>
        <p className="section-hint">Enter your current annual income streams</p>

        <div className="vac-form-row">
          <div className="vac-form-group">
            <label>Annual Dividends ($)</label>
            <input
              type="text"
              name="wg_dividends"
              value={formData.wg_dividends}
              onChange={handleInputChange}
              placeholder="e.g., 50000"
            />
          </div>
          <div className="vac-form-group">
            <label>Annual Wages/Salary ($)</label>
            <input
              type="text"
              name="wg_wages"
              value={formData.wg_wages}
              onChange={handleInputChange}
              placeholder="e.g., 150000"
            />
          </div>
        </div>

        <div className="vac-form-row">
          <div className="vac-form-group">
            <label>Personal Expenses Covered ($)</label>
            <input
              type="text"
              name="wg_personalExpenses"
              value={formData.wg_personalExpenses}
              onChange={handleInputChange}
              placeholder="Business pays for"
            />
            <small>Car, phone, travel, etc. paid by business</small>
          </div>
          <div className="vac-form-group">
            <label>Other Passive Income ($)</label>
            <input
              type="text"
              name="wg_passiveIncome"
              value={formData.wg_passiveIncome}
              onChange={handleInputChange}
              placeholder="Rental, investments, etc."
            />
          </div>
        </div>

        <div className="vac-form-row">
          <div className="vac-form-group">
            <label>Liquid Assets ($)</label>
            <input
              type="text"
              name="wg_liquidAssets"
              value={formData.wg_liquidAssets}
              onChange={handleInputChange}
              placeholder="Cash, stocks, bonds"
            />
            <small>Cash and easily convertible assets</small>
          </div>
          <div className="vac-form-group">
            <label>Non-Mortgage Debt ($)</label>
            <input
              type="text"
              name="wg_nonMortgageDebt"
              value={formData.wg_nonMortgageDebt}
              onChange={handleInputChange}
              placeholder="Credit cards, loans, etc."
            />
          </div>
        </div>
      </div>

      <div className="vac-section">
        <h4>Step 2: Exit Goals</h4>

        <div className="vac-form-row">
          <div className="vac-form-group">
            <label>Desired Post-Sale Annual Income ($) *</label>
            <input
              type="text"
              name="wg_desiredIncome"
              value={formData.wg_desiredIncome}
              onChange={handleInputChange}
              placeholder="e.g., 200000"
              className={errors.wg_desiredIncome ? 'error' : ''}
            />
            <small>Target annual income after selling the business</small>
            {errors.wg_desiredIncome && <span className="error-text">{errors.wg_desiredIncome}</span>}
          </div>
          <div className="vac-form-group">
            <label>Desired Exit Timeline (Years)</label>
            <input
              type="number"
              name="wg_exitTimeline"
              value={formData.wg_exitTimeline}
              onChange={handleInputChange}
              min="1"
              max="30"
            />
          </div>
        </div>
      </div>

      <div className="vac-section">
        <h4>Step 4: Sale Price Factors</h4>

        <div className="vac-form-row">
          <div className="vac-form-group">
            <label>Ownership Percentage (%)</label>
            <input
              type="number"
              name="wg_ownershipPercent"
              value={formData.wg_ownershipPercent}
              onChange={handleInputChange}
              min="0"
              max="100"
            />
            <small>Your ownership stake in the business</small>
          </div>
          <div className="vac-form-group">
            <label>Long-Term Business Debt ($)</label>
            <input
              type="text"
              name="wg_longTermDebt"
              value={formData.wg_longTermDebt}
              onChange={handleInputChange}
              placeholder="Debt to pay at sale"
            />
          </div>
        </div>

        <div className="vac-form-row">
          <div className="vac-form-group">
            <label>Expected Portfolio Return (%)</label>
            <input
              type="number"
              name="wg_portfolioReturn"
              value={formData.wg_portfolioReturn}
              onChange={handleInputChange}
              step="0.5"
              min="0"
              max="20"
            />
            <small>Default: 7.5% annual return</small>
          </div>
          <div className="vac-form-group">
            <label>Est. Fees & Taxes (%)</label>
            <input
              type="number"
              name="wg_feeTaxRate"
              value={formData.wg_feeTaxRate}
              onChange={handleInputChange}
              step="1"
              min="0"
              max="50"
            />
            <small>Professional fees + capital gains tax</small>
          </div>
        </div>

        <div className="vac-form-group">
          <label>Historical Annual Growth Rate (%)</label>
          <input
            type="number"
            name="wg_historicalGrowthRate"
            value={formData.wg_historicalGrowthRate}
            onChange={handleInputChange}
            step="0.5"
            min="-20"
            max="50"
          />
          <small>Used for exit planning projections</small>
        </div>
      </div>
    </div>
  );

  return (
    <div className="vac-form-container">
      <div className="vac-form-header">
        <h2>Value Acceleration Calculator</h2>
        <p>Complete this assessment to calculate your business value and growth potential</p>
      </div>

      {renderProgressBar()}

      <div className="vac-form-content">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
      </div>

      {submitError && (
        <div className="vac-error-banner">
          {submitError}
        </div>
      )}

      <div className="vac-form-actions">
        {onCancel && (
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
        )}

        {currentStep > 1 && (
          <button type="button" className="btn-secondary" onClick={prevStep}>
            Previous
          </button>
        )}

        {currentStep < totalSteps ? (
          <button type="button" className="btn-primary" onClick={nextStep}>
            Next
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Calculating...' : 'Calculate VAC'}
          </button>
        )}
      </div>
    </div>
  );
};

export default VACForm;
