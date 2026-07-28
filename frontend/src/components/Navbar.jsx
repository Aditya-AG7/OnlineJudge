import React from 'react';
import { Code2, LogOut, User as UserIcon, ShieldCheck, ListFilter, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export const Navbar = ({ activeView, setActiveView }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const isAdmin = user?.type === 'admin';

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => setActiveView && setActiveView('problemset')} style={{ cursor: 'pointer' }}>
          <div className="brand-icon-wrapper">
            <Code2 size={22} className="brand-icon" />
          </div>
          <span className="brand-title">
            ONLINE<span className="brand-title-accent">JUDGE</span>
          </span>
        </div>

        {isAuthenticated && user && (
          <div className="navbar-user-section">
            {/* View Switcher for Admins */}
            {isAdmin && (
              <div className="navbar-view-switcher">
                <button
                  type="button"
                  className={`nav-tab-btn ${activeView === 'admin' ? 'active' : ''}`}
                  onClick={() => setActiveView('admin')}
                >
                  <Users size={14} />
                  <span>Admin Panel</span>
                </button>

                <button
                  type="button"
                  className={`nav-tab-btn ${activeView === 'problemset' ? 'active' : ''}`}
                  onClick={() => setActiveView('problemset')}
                >
                  <ListFilter size={14} />
                  <span>Problemset</span>
                </button>
              </div>
            )}

            <div className="user-badge">
              <UserIcon size={14} className="user-badge-icon" />
              <span className="user-username">@{user.username}</span>
              <span className={`role-pill role-${user.type || 'user'}`}>
                {user.type === 'admin' && <ShieldCheck size={12} />}
                {(user.type || 'user').toUpperCase()}
              </span>
            </div>

            <button className="btn-logout" onClick={logout} title="Sign Out">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
