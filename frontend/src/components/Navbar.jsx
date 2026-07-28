import React from 'react';
import { Code2, LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <div className="brand-icon-wrapper">
            <Code2 size={22} className="brand-icon" />
          </div>
          <span className="brand-title">
            ONLINE<span className="brand-title-accent">JUDGE</span>
          </span>
        </div>

        {isAuthenticated && user && (
          <div className="navbar-user-section">
            <div className="user-badge">
              <UserIcon size={14} className="user-badge-icon" />
              <span className="user-username">{user.username}</span>
              <span className={`role-pill role-${user.type || 'user'}`}>
                {user.type === 'admin' ? (
                  <ShieldCheck size={12} />
                ) : null}
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
