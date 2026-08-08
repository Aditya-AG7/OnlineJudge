import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Code2, LogOut, User as UserIcon, ShieldCheck, ListFilter, Users, LayoutDashboard, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = user?.type === 'admin';
  const isSetterOrAdmin = user?.type === 'admin' || user?.type === 'problem_setter';
  const currentPath = location.pathname;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <div className="brand-icon-wrapper">
            <Code2 size={22} className="brand-icon" />
          </div>
          <span className="brand-title">
            ONLINE<span className="brand-title-accent">JUDGE</span>
          </span>
        </div>

        {isAuthenticated && user && (
          <div className="navbar-user-section">
            <div className="navbar-view-switcher">
              <button
                type="button"
                className={`nav-tab-btn ${currentPath === '/dashboard' ? 'active' : ''}`}
                onClick={() => navigate('/dashboard')}
              >
                <LayoutDashboard size={14} />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                className={`nav-tab-btn ${currentPath.startsWith('/problems') && currentPath !== '/admin/add-problem' ? 'active' : ''}`}
                onClick={() => navigate('/problems')}
              >
                <ListFilter size={14} />
                <span>Problems</span>
              </button>

              {isSetterOrAdmin && (
                <button
                  type="button"
                  className={`nav-tab-btn ${currentPath === '/admin/add-problem' ? 'active' : ''}`}
                  onClick={() => navigate('/admin/add-problem')}
                >
                  <Plus size={14} />
                  <span>Add Problem</span>
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  className={`nav-tab-btn ${currentPath === '/admin' ? 'active' : ''}`}
                  onClick={() => navigate('/admin')}
                >
                  <Users size={14} />
                  <span>Admin Panel</span>
                </button>
              )}
            </div>

            <div 
              className="user-badge" 
              onClick={() => navigate('/profile')} 
              style={{ cursor: 'pointer' }} 
              title="View Profile"
            >
              <UserIcon size={14} className="user-badge-icon" />
              <span className="user-username">@{user.username}</span>
              <span className={`role-pill role-${user.type || 'user'}`}>
                {user.type === 'admin' && <ShieldCheck size={12} />}
                {(user.type || 'user').toUpperCase()}
              </span>
            </div>

            <button className="btn-logout" onClick={handleLogout} title="Sign Out">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
