import React, { useState, useEffect } from 'react';
import { 
  Users, ShieldAlert, ShieldCheck, UserCheck, Search, 
  RefreshCw, CheckCircle2, AlertCircle, Sparkles, Code2, Tag, Edit, Trash2, Plus, Inbox
} from 'lucide-react';
import { adminAPI, problemAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AdminUserManagement.css';

export const AdminUserManagement = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'problems'

  // Users state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Problems state
  const [problems, setProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [problemsError, setProblemsError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null); // { type: 'success'|'error', text: '' }

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await adminAPI.getUsers();
      if (data && data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load user list from server', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchProblems = async () => {
    setLoadingProblems(true);
    setProblemsError(null);
    try {
      const data = await problemAPI.getProblems();
      const problemsArray = Array.isArray(data) ? data : data.problems || [];
      setProblems(problemsArray);
    } catch (err) {
      setProblemsError(err.message || 'Failed to load problems from server');
    } finally {
      setLoadingProblems(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'problems') {
      fetchProblems();
    }
  }, [activeTab]);

  const handleRoleChange = async (userId, targetRole, username) => {
    setUpdatingId(userId);
    try {
      await adminAPI.updateUserRole(userId, targetRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, type: targetRole } : u));
      const roleLabel = targetRole === 'problem_setter' ? 'Problem Setter' : targetRole === 'admin' ? 'Admin' : 'User';
      showToast(`Successfully updated @${username} to ${roleLabel}!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update user role', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProblems = problems.filter(p =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const stats = {
    totalUsers: users.length,
    admins: users.filter(u => u.type === 'admin').length,
    setters: users.filter(u => u.type === 'problem_setter').length,
    totalProblems: problems.length,
  };

  return (
    <div className="admin-page-wrapper">
      <div className="admin-container">
        
        {/* Toast Alert Notification */}
        {toast && (
          <div className={`toast-notification ${toast.type}`}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{toast.text}</span>
          </div>
        )}

        {/* Admin Header */}
        <div className="admin-header-card">
          <div className="admin-header-main">
            <div className="admin-badge">
              <ShieldCheck size={16} className="admin-badge-icon" />
              <span>Admin Control Panel</span>
            </div>
            <h1 className="admin-title">Platform Administration</h1>
            <p className="admin-subtitle">
              Manage platform user roles and inspect live problem repository data.
            </p>
          </div>

          <div className="admin-stats-grid">
            <div className="admin-stat-box">
              <span className="admin-stat-val">{stats.totalUsers}</span>
              <span className="admin-stat-lbl">Total Users</span>
            </div>
            <div className="admin-stat-box">
              <span className="admin-stat-val text-amber">{stats.setters}</span>
              <span className="admin-stat-lbl">Setters</span>
            </div>
            <div className="admin-stat-box">
              <span className="admin-stat-val text-red">{stats.admins}</span>
              <span className="admin-stat-lbl">Admins</span>
            </div>
          </div>
        </div>

        {/* Admin Sub-Tabs */}
        <div className="admin-subtabs-bar">
          <button
            type="button"
            className={`admin-subtab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} />
            <span>User Directory ({users.length})</span>
          </button>
          <button
            type="button"
            className={`admin-subtab ${activeTab === 'problems' ? 'active' : ''}`}
            onClick={() => setActiveTab('problems')}
          >
            <Code2 size={16} />
            <span>Live Problems Directory (GET /problems)</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="admin-toolbar">
          <div className="admin-search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="admin-search-input"
              placeholder={activeTab === 'users' ? "Search users..." : "Search problems..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button 
            className="btn-secondary btn-refresh" 
            onClick={activeTab === 'users' ? fetchUsers : fetchProblems} 
            disabled={loadingUsers || loadingProblems}
          >
            <RefreshCw size={16} className={(loadingUsers || loadingProblems) ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* TAB 1: USERS DIRECTORY */}
        {activeTab === 'users' && (
          <div className="admin-table-card">
            {loadingUsers ? (
              <div className="admin-loading-state">
                <RefreshCw size={28} className="spin-icon text-red" />
                <p>Fetching user directory from database...</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User Profile</th>
                    <th>Email</th>
                    <th>Current Role</th>
                    <th>Actions / Promote Role</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => {
                      const isSelf = u.id === currentUser?.id || u.username === currentUser?.username;
                      const isUpdating = updatingId === u.id;

                      return (
                        <tr key={u.id || u.username} className="admin-user-row">
                          <td>
                            <div className="user-profile-cell">
                              <div className="user-avatar">
                                {(u.full_name || u.username || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="user-profile-meta">
                                <span className="user-name">{u.full_name}</span>
                                <span className="user-handle">@{u.username} {isSelf && '(You)'}</span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className="user-email-text">{u.email}</span>
                          </td>

                          <td>
                            <span className={`role-pill role-${u.type || 'user'}`}>
                              {(u.type || 'user').toUpperCase()}
                            </span>
                          </td>

                          <td>
                            <div className="action-buttons-group">
                              {u.type !== 'problem_setter' && (
                                <button
                                  type="button"
                                  className="btn-role-action btn-setter"
                                  onClick={() => handleRoleChange(u.id, 'problem_setter', u.username)}
                                  disabled={isUpdating}
                                  title="Promote user to Problem Setter"
                                >
                                  <UserCheck size={14} />
                                  <span>Promote Setter</span>
                                </button>
                              )}

                              {u.type !== 'admin' && (
                                <button
                                  type="button"
                                  className="btn-role-action btn-admin"
                                  onClick={() => handleRoleChange(u.id, 'admin', u.username)}
                                  disabled={isUpdating}
                                  title="Promote user to Admin"
                                >
                                  <ShieldAlert size={14} />
                                  <span>Promote Admin</span>
                                </button>
                              )}

                              {u.type !== 'user' && (
                                <button
                                  type="button"
                                  className="btn-role-action btn-demote"
                                  onClick={() => handleRoleChange(u.id, 'user', u.username)}
                                  disabled={isUpdating}
                                  title="Demote user to standard User role"
                                >
                                  <span>Reset to User</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="admin-empty-table">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 2: LIVE PROBLEMS DIRECTORY */}
        {activeTab === 'problems' && (
          <div className="admin-table-card">
            {loadingProblems ? (
              <div className="admin-loading-state">
                <RefreshCw size={28} className="spin-icon text-red" />
                <p>Fetching problem repository from GET /problems...</p>
              </div>
            ) : problemsError ? (
              <div className="state-card error-state">
                <AlertCircle size={32} className="text-red" />
                <p className="state-title">Failed to load problems</p>
                <p className="state-desc">{problemsError}</p>
              </div>
            ) : problems.length === 0 ? (
              <div className="state-card empty-state">
                <Inbox size={36} className="text-muted" />
                <p className="state-title">No problems yet</p>
                <p className="state-desc">No problems created in the database yet.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Difficulty</th>
                    <th>Tags</th>
                    <th>Admin Actions (Stubbed)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProblems.map((p) => (
                    <tr key={p._id || p.id} className="admin-user-row">
                      <td>
                        <span className="user-name">{p.title}</span>
                      </td>
                      <td>
                        <span className={`diff-tag diff-${(p.difficulty || 'easy').toLowerCase()}`}>
                          {p.difficulty || 'Easy'}
                        </span>
                      </td>
                      <td>
                        <div className="tags-container">
                          {p.tags && p.tags.length > 0 ? (
                            p.tags.map((tag, idx) => (
                              <span key={idx} className="tag-pill">
                                <Tag size={10} style={{ marginRight: 3 }} />
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="no-tags">-</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons-group">
                          <button
                            type="button"
                            className="btn-role-action btn-demote"
                            disabled
                            title="Edit Problem Page (TODO)"
                          >
                            <Edit size={13} />
                            <span>Edit (TODO)</span>
                          </button>
                          <button
                            type="button"
                            className="btn-role-action btn-demote"
                            disabled
                            title="Delete Problem (TODO)"
                          >
                            <Trash2 size={13} />
                            <span>Delete (TODO)</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
