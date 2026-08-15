import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Code2, LogOut, User as UserIcon, Users, Plus, Play, Send, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProblemActions } from '../context/ProblemActionsContext';
import './Navbar.css';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { actions } = useProblemActions() || {};
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isAdmin = user?.type === 'admin';
  const isSetterOrAdmin = user?.type === 'admin' || user?.type === 'problem_setter';
  const currentPath = location.pathname;
  const isProblemPage = currentPath.startsWith('/problems/') && currentPath !== '/problems';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    navigate('/profile');
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <div className="navbar-brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
            <div className="brand-icon-wrapper">
              <Code2 size={18} className="brand-icon" />
            </div>
            <span className="brand-title">
              ONLINE<span className="brand-title-accent">JUDGE</span>
            </span>
          </div>

          {/* Usual content (nav links) shown on all pages EXCEPT problem pages */}
          {isAuthenticated && user && !isProblemPage && (
            <div className="navbar-view-switcher">
              <button
                type="button"
                className={`nav-tab-btn ${currentPath.startsWith('/problems') && currentPath !== '/admin/add-problem' ? 'active' : ''}`}
                onClick={() => navigate('/problems')}
              >
                <span>Problems</span>
              </button>

              <button
                type="button"
                className={`nav-tab-btn`}
              >
                <span>Contests</span>
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
          )}
        </div>

        {/* Centered Run & Submit action buttons shown ONLY on problem pages */}
        {isAuthenticated && user && isProblemPage && (
          <div className="navbar-center-actions">
            <button
              className="btn-run-action"
              type="button"
              onClick={actions?.onRun}
              disabled={!actions || actions.running || actions.submitting}
            >
              {actions?.running ? (
                <>
                  <RefreshCw size={14} className="spin-icon" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play size={14} />
                  <span>Run</span>
                </>
              )}
            </button>

            <button
              className="btn-submit-action"
              type="button"
              onClick={actions?.onSubmit}
              disabled={!actions || actions.running || actions.submitting}
            >
              {actions?.submitting ? (
                <>
                  <RefreshCw size={14} className="spin-icon" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Submit</span>
                </>
              )}
            </button>
          </div>
        )}

        {isAuthenticated && user && (
          <div className="navbar-right">
            <div className="user-dropdown-container" ref={dropdownRef}>
              <button
                type="button"
                className={`user-dropdown-trigger ${isDropdownOpen ? 'active' : ''}`}
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                title="User menu"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <UserIcon size={16} className="user-badge-icon" />
              </button>

              {isDropdownOpen && (
                <div className="user-dropdown-menu" role="menu">
                  <span className="user-username">
                    <UserIcon size={25} className="user-badge-icon" /> @{user.username}
                  </span>
                  <button
                    type="button"
                    className="dropdown-item"
                    role="menuitem"
                    onClick={handleProfileClick}
                  >
                    <UserIcon size={15} />
                    <span>Profile</span>
                  </button>
                  <div className="dropdown-divider" />
                  <button
                    type="button"
                    className="dropdown-item logout-item"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
