import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { Code2, Shield } from 'lucide-react';
import './AuthCard.css';

export const AuthCard = () => {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'

  return (
    <div className="auth-card-wrapper">
      <div className="auth-card">
        {/* Card Header & Branding */}
        <div className="auth-card-header">
          <div className="auth-logo-badge">
            <Code2 size={28} className="auth-logo-icon" />
          </div>
          <h1 className="auth-title">
            {activeTab === 'login' ? 'Access Platform' : 'Join OnlineJudge'}
          </h1>
          <p className="auth-subtitle">
            {activeTab === 'login'
              ? 'Enter your credentials to access the judge terminal'
              : 'Create your competitive programming profile'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            Register
          </button>
          <div
            className="auth-tab-indicator"
            style={{
              transform: activeTab === 'login' ? 'translateX(0%)' : 'translateX(100%)',
            }}
          />
        </div>

        {/* Dynamic Form */}
        <div className="auth-card-body">
          {activeTab === 'login' ? (
            <LoginForm />
          ) : (
            <RegisterForm onSuccess={() => {}} />
          )}
        </div>

        {/* Bottom Switch Link */}
        <div className="auth-card-footer">
          {activeTab === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => setActiveTab('register')}
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => setActiveTab('login')}
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
