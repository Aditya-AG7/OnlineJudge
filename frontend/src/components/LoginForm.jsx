import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginForm = ({ onSuccess }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(formData.username.trim(), formData.password);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {error && (
        <div className="alert-banner error">
          <AlertCircle size={18} style={{ shrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="login-username">
          Username
        </label>
        <div className="input-container">
          <User size={18} className="input-icon" />
          <input
            id="login-username"
            type="text"
            name="username"
            className="form-input"
            placeholder="Enter your username"
            value={formData.username}
            onChange={handleChange}
            disabled={loading}
            autoComplete="username"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="login-password">
          Password
        </label>
        <div className="input-container">
          <Lock size={18} className="input-icon" />
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            className="form-input"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="input-toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
        {loading ? (
          <>
            <span className="spinner"></span>
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <span>Sign In</span>
            <ArrowRight size={18} />
          </>
        )}
      </button>
    </form>
  );
};
