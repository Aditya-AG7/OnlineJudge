import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { User, Mail, Shield, Key, Terminal, RefreshCw, CheckCircle2, LogOut } from 'lucide-react';
import './Dashboard.css';

export const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const [apiResponse, setApiResponse] = useState(null);
  const [testingApi, setTestingApi] = useState(false);

  const testProfileEndpoint = async () => {
    setTestingApi(true);
    try {
      const res = await authAPI.getProfile();
      setApiResponse({ status: 200, data: res });
    } catch (err) {
      setApiResponse({ status: 'Error', error: err.message });
    } finally {
      setTestingApi(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        {/* Header */}
        <div className="dashboard-header">
          <div className="status-pill">
            <span className="pulse-dot"></span>
            <span>Authenticated Session</span>
          </div>
          <h2 className="dashboard-welcome">
            Welcome back, <span className="highlight-text">{user?.full_name || user?.username}</span>
          </h2>
          <p className="dashboard-subtitle">
            You are successfully authenticated on the OnlineJudge platform.
          </p>
        </div>

        {/* User Info Grid */}
        <div className="user-info-grid">
          <div className="info-tile">
            <div className="info-tile-icon">
              <User size={18} />
            </div>
            <div className="info-tile-content">
              <span className="info-label">Full Name</span>
              <span className="info-value">{user?.full_name || 'N/A'}</span>
            </div>
          </div>

          <div className="info-tile">
            <div className="info-tile-icon">
              <User size={18} />
            </div>
            <div className="info-tile-content">
              <span className="info-label">Username</span>
              <span className="info-value">@{user?.username}</span>
            </div>
          </div>

          <div className="info-tile">
            <div className="info-tile-icon">
              <Mail size={18} />
            </div>
            <div className="info-tile-content">
              <span className="info-label">Email Address</span>
              <span className="info-value">{user?.email}</span>
            </div>
          </div>

          <div className="info-tile">
            <div className="info-tile-icon">
              <Shield size={18} />
            </div>
            <div className="info-tile-content">
              <span className="info-label">Account Role</span>
              <span className={`role-badge role-${user?.type || 'user'}`}>
                {(user?.type || 'user').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Live Endpoint Test Section */}
        <div className="endpoint-test-box">
          <div className="test-box-header">
            <div className="test-box-title">
              <Terminal size={18} className="terminal-icon" />
              <span>Backend Endpoint Tester: GET /profile</span>
            </div>
            <button
              className="btn-secondary btn-sm"
              onClick={testProfileEndpoint}
              disabled={testingApi}
            >
              <RefreshCw size={14} className={testingApi ? 'spin-icon' : ''} />
              <span>{testingApi ? 'Sending...' : 'Test /profile API'}</span>
            </button>
          </div>

          {apiResponse ? (
            <div className="console-output">
              <div className="console-header">
                <CheckCircle2 size={14} className="console-success-icon" />
                <span>Response received (Bearer token passed in Authorization header)</span>
              </div>
              <pre className="json-code">
                {JSON.stringify(apiResponse.data || apiResponse, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="console-placeholder">
              Click <strong>"Test /profile API"</strong> to test the authenticated route with your JWT token.
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="dashboard-actions">
          <button className="btn-logout-full" onClick={logout}>
            <LogOut size={18} />
            <span>Sign Out of Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
