import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, ShieldAlert, ShieldCheck, UserCheck, Search, 
  RefreshCw, CheckCircle2, AlertCircle, Sparkles, Code2, Tag, Edit, Trash2, Plus, Inbox, UserPlus, X
} from 'lucide-react';
import { authAPI, adminAPI, problemAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AdminUserManagement.css';

export const AdminUserManagement = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'problems'

  // Users state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Add User Modal state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    type: 'user',
  });
  const [addingUser, setAddingUser] = useState(false);
  const [addUserError, setAddUserError] = useState(null);

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

  useEffect(() => {
    if (showAddUserModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAddUserModal]);

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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setAddUserError(null);

    if (!addUserForm.full_name || !addUserForm.username || !addUserForm.email || !addUserForm.password) {
      setAddUserError('All fields are required.');
      return;
    }

    setAddingUser(true);
    try {
      // 1. Register user via authAPI
      const response = await authAPI.register({
        full_name: addUserForm.full_name.trim(),
        username: addUserForm.username.trim(),
        email: addUserForm.email.trim(),
        password: addUserForm.password,
      });

      const createdUser = response?.user;

      // 2. If target role is not 'user', promote role via adminAPI
      if (createdUser && createdUser.id && addUserForm.type !== 'user') {
        await adminAPI.updateUserRole(createdUser.id, addUserForm.type);
      }

      showToast(`Successfully created user @${addUserForm.username}!`, 'success');
      setShowAddUserModal(false);
      setAddUserForm({ full_name: '', username: '', email: '', password: '', type: 'user' });
      fetchUsers();
    } catch (err) {
      console.error('Failed to create user:', err);
      setAddUserError(err.message || 'Failed to create user.');
    } finally {
      setAddingUser(false);
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

        {/* Add User Modal */}
        {showAddUserModal && (
          <div className="modal-backdrop" onClick={() => setShowAddUserModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-group">
                  <UserPlus size={20} className="text-red" />
                  <h2>Add New User</h2>
                </div>
                <button 
                  type="button"
                  className="btn-modal-close" 
                  onClick={() => setShowAddUserModal(false)}
                >
                  <X size={18} />
                </button>
              </div>

              {addUserError && (
                <div className="alert-banner error" style={{ margin: '1rem 1.5rem 0 1.5rem' }}>
                  <AlertCircle size={18} />
                  <span>{addUserError}</span>
                </div>
              )}

              <form onSubmit={handleCreateUser} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Full Name <span className="text-red">*</span></label>
                  <input
                    type="text"
                    className="form-input no-icon"
                    placeholder="e.g. John Doe"
                    value={addUserForm.full_name}
                    onChange={(e) => setAddUserForm({ ...addUserForm, full_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Username <span className="text-red">*</span></label>
                  <input
                    type="text"
                    className="form-input no-icon"
                    placeholder="e.g. johndoe"
                    value={addUserForm.username}
                    onChange={(e) => setAddUserForm({ ...addUserForm, username: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address <span className="text-red">*</span></label>
                  <input
                    type="email"
                    className="form-input no-icon"
                    placeholder="e.g. john@example.com"
                    value={addUserForm.email}
                    onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password <span className="text-red">*</span></label>
                  <input
                    type="password"
                    className="form-input no-icon"
                    placeholder="••••••••"
                    value={addUserForm.password}
                    onChange={(e) => setAddUserForm({ ...addUserForm, password: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    className="form-input no-icon form-select"
                    value={addUserForm.type}
                    onChange={(e) => setAddUserForm({ ...addUserForm, type: e.target.value })}
                  >
                    <option value="user">User (Standard)</option>
                    <option value="problem_setter">Problem Setter</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowAddUserModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={addingUser}
                    style={{ width: 'auto' }}
                  >
                    {addingUser ? (
                      <>
                        <RefreshCw size={15} className="spin-icon" />
                        <span>Creating User...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        <span>Create User</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
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
            <span>Live Problems Directory</span>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {activeTab === 'users' ? (
              <button 
                type="button"
                className="btn-primary btn-sm" 
                onClick={() => setShowAddUserModal(true)}
                style={{ width: 'auto', padding: '0.6rem 1.1rem' }}
              >
                <UserPlus size={16} />
                <span>Add User</span>
              </button>
            ) : (
              <button 
                type="button"
                className="btn-primary btn-sm" 
                onClick={() => navigate('/admin/add-problem')}
                style={{ width: 'auto', padding: '0.6rem 1.1rem' }}
              >
                <Plus size={16} />
                <span>Add New Problem</span>
              </button>
            )}

            <button 
              className="btn-secondary btn-refresh" 
              onClick={activeTab === 'users' ? fetchUsers : fetchProblems} 
              disabled={loadingUsers || loadingProblems}
            >
              <RefreshCw size={16} className={(loadingUsers || loadingProblems) ? 'spin-icon' : ''} />
              <span>Refresh</span>
            </button>
          </div>
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
