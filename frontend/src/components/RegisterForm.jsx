import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, UserCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterForm = ({ onSuccess }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
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
    const { full_name, username, email, password } = formData;

    if (!full_name.trim() || !username.trim() || !email.trim() || !password) {
      setError('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register({
        full_name: full_name.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
        <label className="form-label" htmlFor="reg-fullname">
          Full Name
        </label>
        <div className="input-container">
          <User size={18} className="input-icon" />
          <input
            id="reg-fullname"
            type="text"
            name="full_name"
            className="form-input"
            placeholder="John Doe"
            value={formData.full_name}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="reg-username">
          Username
        </label>
        <div className="input-container">
          <UserCheck size={18} className="input-icon" />
          <input
            id="reg-username"
            type="text"
            name="username"
            className="form-input"
            placeholder="johndoe123"
            value={formData.username}
            onChange={handleChange}
            disabled={loading}
            autoComplete="username"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="reg-email">
          Email Address
        </label>
        <div className="input-container">
          <Mail size={18} className="input-icon" />
          <input
            id="reg-email"
            type="email"
            name="email"
            className="form-input"
            placeholder="john@example.com"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            autoComplete="email"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="reg-password">
          Password
        </label>
        <div className="input-container">
          <Lock size={18} className="input-icon" />
          <input
            id="reg-password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            className="form-input"
            placeholder="Min. 6 characters"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            autoComplete="new-password"
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

      <div className="role-note">
        <ShieldAlert size={14} className="role-note-icon" />
        <span>New accounts register as <strong>User</strong>. Role upgrades (e.g. Problem Setter) are assigned by Admin.</span>
      </div>

      <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
        {loading ? (
          <>
            <span className="spinner"></span>
            <span>Creating account...</span>
          </>
        ) : (
          <span>Create Account</span>
        )}
      </button>
    </form>
  );
};
