/**
 * Register Page
 *
 * Allows new users to create an account.
 * Includes password strength validation.
 * Redirects to login on successful registration.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Auth.css';

function Register() {
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    password: '',
    passwordConfirm: '',
    agreeToTerms: false,
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  /**
   * Calculate password strength (0-100)
   */
  const calculatePasswordStrength = (password) => {
    let strength = 0;

    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 10;

    return Math.min(strength, 100);
  };

  /**
   * Handle form input change
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Calculate password strength
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  /**
   * Get password strength label
   */
  const getPasswordStrengthLabel = () => {
    if (passwordStrength < 20) return { label: 'Very Weak', color: '#d32f2f' };
    if (passwordStrength < 40) return { label: 'Weak', color: '#f57c00' };
    if (passwordStrength < 60) return { label: 'Fair', color: '#fbc02d' };
    if (passwordStrength < 80) return { label: 'Good', color: '#7cb342' };
    return { label: 'Strong', color: '#388e3c' };
  };

  /**
   * Validate form inputs
   */
  const validateForm = () => {
    const errors = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    } else if (!/[A-Z]/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(formData.password)) {
      errors.password = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(formData.password)) {
      errors.password = 'Password must contain at least one number';
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
      errors.password = 'Password must contain at least one special character';
    }

    if (!formData.passwordConfirm) {
      errors.passwordConfirm = 'Please confirm your password';
    } else if (formData.password !== formData.passwordConfirm) {
      errors.passwordConfirm = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    return errors;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      // Attempt registration
      await register(
        formData.email,
        formData.password,
        formData.fullName,
        formData.company
      );

      // Redirect to dashboard on success
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by useAuth and displayed via error state
      console.error('Registration error:', err);
    }
  };

  const passwordStrengthInfo = getPasswordStrengthLabel();

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Your Account</h1>
          <p>Join us to get started with business valuation</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Global Error Message */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <div>
                <p className="error-title">Registration Failed</p>
                <p className="error-text">{error}</p>
              </div>
            </div>
          )}

          {/* Full Name Field */}
          <div className="form-group">
            <label htmlFor="fullName">Full Name *</label>
            <input
              id="fullName"
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="John Doe"
              className={validationErrors.fullName ? 'input-error' : ''}
              disabled={loading}
              autoComplete="name"
            />
            {validationErrors.fullName && (
              <span className="field-error">{validationErrors.fullName}</span>
            )}
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="you@example.com"
              className={validationErrors.email ? 'input-error' : ''}
              disabled={loading}
              autoComplete="email"
            />
            {validationErrors.email && (
              <span className="field-error">{validationErrors.email}</span>
            )}
          </div>

          {/* Company Field */}
          <div className="form-group">
            <label htmlFor="company">Company (Optional)</label>
            <input
              id="company"
              type="text"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              placeholder="Your company name"
              disabled={loading}
              autoComplete="organization"
            />
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a strong password"
                className={validationErrors.password ? 'input-error' : ''}
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div
                    className="strength-fill"
                    style={{
                      width: `${passwordStrength}%`,
                      backgroundColor: passwordStrengthInfo.color,
                    }}
                  ></div>
                </div>
                <span
                  className="strength-label"
                  style={{ color: passwordStrengthInfo.color }}
                >
                  {passwordStrengthInfo.label}
                </span>
              </div>
            )}

            {validationErrors.password && (
              <span className="field-error">{validationErrors.password}</span>
            )}

            <p className="password-hint">
              At least 8 characters including uppercase, lowercase, number, and special character
            </p>
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="passwordConfirm">Confirm Password *</label>
            <div className="password-input-wrapper">
              <input
                id="passwordConfirm"
                type={showPasswordConfirm ? 'text' : 'password'}
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                className={validationErrors.passwordConfirm ? 'input-error' : ''}
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                disabled={loading}
              >
                {showPasswordConfirm ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {validationErrors.passwordConfirm && (
              <span className="field-error">{validationErrors.passwordConfirm}</span>
            )}
          </div>

          {/* Terms Checkbox */}
          <div className="form-checkbox">
            <input
              id="agreeToTerms"
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleInputChange}
              disabled={loading}
            />
            <label htmlFor="agreeToTerms">
              I agree to the{' '}
              <a href="#terms" className="link">
                Terms and Conditions
              </a>{' '}
              and{' '}
              <a href="#privacy" className="link">
                Privacy Policy
              </a>
              *
            </label>
          </div>
          {validationErrors.agreeToTerms && (
            <span className="field-error">{validationErrors.agreeToTerms}</span>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="auth-switch">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
