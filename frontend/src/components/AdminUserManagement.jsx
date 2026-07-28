import React, { useState, useEffect } from 'react';
import { 
  Users, ShieldAlert, ShieldCheck, UserCheck, Search, 
  RefreshCw, CheckCircle2, AlertCircle, Sparkles, ArrowUpRight
} from 'lucide-react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AdminUserManagement.css';

export const AdminUserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null); // { type: 'success'|'error', text: '' }

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getUsers();
      if (data && data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load user list from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, targetRole, username) => {
    setUpdatingId(userId);
    try {
      const res = await adminAPI.updateUserRole(userId, targetRole);
      
      // Update local state directly
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

  const stats = {
    total: users.length,
    admins: users.filter(u => u.type === 'admin').length,
    setters: users.filter(u => u.type === 'problem_setter').length,
    standard: users.filter(u => u.type === 'user' || !u.type).length,
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
            <h1 className="admin-title">User Role Management</h1>
            <p className="admin-subtitle">
              Promote platform members to <strong>Problem Setter</strong> or <strong>Admin</strong> privileges.
            </p>
          </div>

          <div className="admin-stats-grid">
            <div className="admin-stat-box">
              <span className="admin-stat-val">{stats.total}</span>
              <span className="admin-stat-lbl">Total Registered</span>
            </div>
            <div className="admin-stat-box">
              <span className="admin-stat-val text-amber">{stats.setters}</span>
              <span className="admin-stat-lbl">Problem Setters</span>
            </div>
            <div className="admin-stat-box">
              <span className="admin-stat-val text-red">{stats.admins}</span>
              <span className="admin-stat-lbl">Admins</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="admin-toolbar">
          <div className="admin-search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search by name, username, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button className="btn-secondary btn-refresh" onClick={fetchUsers} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
            <span>Refresh Users</span>
          </button>
        </div>

        {/* Users Table */}
        <div className="admin-table-card">
          {loading ? (
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

      </div>
    </div>
  );
};
