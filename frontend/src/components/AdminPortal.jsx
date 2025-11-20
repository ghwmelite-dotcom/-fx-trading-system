import { useState, useEffect } from 'react';
import { Users, Activity, Shield, Plus, Edit, Trash2, Search, Download, X, Check, AlertCircle, Settings, Key } from 'lucide-react';
import PlatformSettings from './PlatformSettings';

const AdminPortal = ({ apiUrl, apiKey, currentUser }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // User Management State
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Temporary Access State
  const [tempAccessTokens, setTempAccessTokens] = useState([]);
  const [showGenerateToken, setShowGenerateToken] = useState(false);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const apiCall = async (endpoint, method = 'GET', body = null) => {
    try {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        throw new Error('Not authenticated. Please login again.');
      }

      if (!apiUrl) {
        throw new Error('API URL not configured');
      }

      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const url = `${apiUrl}${endpoint}`;
      console.log(`API Call: ${method} ${url}`);

      const response = await fetch(url, options);

      // Try to parse JSON response
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Call Error:', error);
      throw error;
    }
  };

  // Load Dashboard Stats
  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/api/admin/dashboard');
      setDashboardStats(data.stats);
    } catch (error) {
      showNotification('Failed to load dashboard: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load Users
  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/api/admin/users');
      setUsers(data.users);
    } catch (error) {
      showNotification('Failed to load users: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load Audit Logs
  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/api/admin/audit-logs');
      setAuditLogs(data.logs);
    } catch (error) {
      showNotification('Failed to load audit logs: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Create User
  const handleCreateUser = async (userData) => {
    try {
      await apiCall('/api/admin/users', 'POST', userData);
      showNotification('User created successfully');
      setShowCreateUser(false);
      loadUsers();
    } catch (error) {
      showNotification('Failed to create user: ' + error.message, 'error');
    }
  };

  // Update User
  const handleUpdateUser = async (userId, userData) => {
    try {
      await apiCall(`/api/admin/users/${userId}`, 'PUT', userData);
      showNotification('User updated successfully');
      setShowEditUser(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      showNotification('Failed to update user: ' + error.message, 'error');
    }
  };

  // Delete User
  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await apiCall(`/api/admin/users/${userId}`, 'DELETE');
      showNotification('User deleted successfully');
      loadUsers();
    } catch (error) {
      showNotification('Failed to delete user: ' + error.message, 'error');
    }
  };

  // Reset User Password
  const handleResetPassword = async (user) => {
    const newPassword = prompt(`Reset password for ${user.username}?\n\nEnter new password:`);

    if (!newPassword) {
      return; // User cancelled
    }

    if (newPassword.length < 6) {
      showNotification('Password must be at least 6 characters long', 'error');
      return;
    }

    try {
      await apiCall(`/api/admin/users/${user.id}/reset-password`, 'POST', { newPassword });
      showNotification(`Password reset successfully for ${user.username}`);
    } catch (error) {
      showNotification('Failed to reset password: ' + error.message, 'error');
    }
  };

  // Load Temporary Access Tokens
  const loadTempAccessTokens = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/api/admin/temporary-access');
      setTempAccessTokens(data.tokens);
    } catch (error) {
      showNotification('Failed to load temporary access tokens: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Generate Temporary Access Token
  const handleGenerateToken = async (tokenData) => {
    try {
      const data = await apiCall('/api/admin/temporary-access', 'POST', tokenData);
      showNotification('Temporary access created successfully');
      setShowGenerateToken(false);
      loadTempAccessTokens();

      // Show the generated code in an alert
      const expiresAt = new Date(data.expires_at);
      alert(
        `Temporary Access Created!\n\n` +
        `Access Code: ${data.access_code}\n` +
        `Access Level: ${data.access_level}\n` +
        `Duration: ${data.duration_minutes} minutes\n` +
        `Expires At: ${expiresAt.toLocaleString()}\n\n` +
        `Share this code with the user. They can use it to login at the temporary access page.`
      );

      return data;
    } catch (error) {
      showNotification('Failed to generate token: ' + error.message, 'error');
      throw error;
    }
  };

  // Revoke Temporary Access Token
  const handleRevokeToken = async (accessCode) => {
    if (!confirm('Are you sure you want to revoke this temporary access?')) {
      return;
    }

    try {
      await apiCall(`/api/admin/temporary-access/${accessCode}`, 'DELETE');
      showNotification('Temporary access revoked successfully');
      loadTempAccessTokens();
    } catch (error) {
      showNotification('Failed to revoke token: ' + error.message, 'error');
    }
  };

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboard();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'audit') {
      loadAuditLogs();
    } else if (activeTab === 'temp-access') {
      loadTempAccessTokens();
    }
  }, [activeTab]);

  // Filter users by search term
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg animate-in slide-in-from-top ${
          notification.type === 'success'
            ? 'bg-green-600 text-white'
            : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="text-purple-400" size={32} />
          <h2 className="text-2xl font-bold text-white">Admin Portal</h2>
        </div>
        <p className="text-slate-400">Manage users, view audit logs, and monitor system health</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'dashboard'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <Activity className="inline mr-2" size={18} />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <Users className="inline mr-2" size={18} />
          Users
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'audit'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <Shield className="inline mr-2" size={18} />
          Audit Logs
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'settings'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <Settings className="inline mr-2" size={18} />
          Settings
        </button>
        <button
          onClick={() => setActiveTab('temp-access')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'temp-access'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <Key className="inline mr-2" size={18} />
          Temp Access
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <DashboardTab stats={dashboardStats} loading={loading} />
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <UsersTab
          users={filteredUsers}
          loading={loading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onCreateUser={() => setShowCreateUser(true)}
          onEditUser={(user) => {
            setSelectedUser(user);
            setShowEditUser(true);
          }}
          onDeleteUser={handleDeleteUser}
          onResetPassword={handleResetPassword}
        />
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <AuditLogsTab logs={auditLogs} loading={loading} />
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <PlatformSettings apiUrl={apiUrl} apiKey={apiKey} />
      )}

      {/* Temporary Access Tab */}
      {activeTab === 'temp-access' && (
        <TempAccessTab
          tokens={tempAccessTokens}
          loading={loading}
          onGenerateToken={() => setShowGenerateToken(true)}
          onRevokeToken={handleRevokeToken}
        />
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <UserModal
          title="Create New User"
          onClose={() => setShowCreateUser(false)}
          onSubmit={handleCreateUser}
        />
      )}

      {/* Edit User Modal */}
      {showEditUser && selectedUser && (
        <UserModal
          title="Edit User"
          user={selectedUser}
          onClose={() => {
            setShowEditUser(false);
            setSelectedUser(null);
          }}
          onSubmit={(userData) => handleUpdateUser(selectedUser.id, userData)}
        />
      )}

      {/* Generate Token Modal */}
      {showGenerateToken && (
        <GenerateTokenModal
          onClose={() => setShowGenerateToken(false)}
          onSubmit={handleGenerateToken}
        />
      )}
    </div>
  );
};

// Dashboard Tab Component
const DashboardTab = ({ stats, loading }) => {
  if (loading || !stats) {
    return <div className="text-center text-slate-400 py-12">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20">
          <Users className="text-blue-400 mb-3" size={32} />
          <h3 className="text-slate-400 text-sm font-medium mb-1">Total Users</h3>
          <p className="text-4xl font-bold text-white">{stats.totalUsers}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-xl rounded-2xl p-6 border border-green-500/20">
          <Check className="text-green-400 mb-3" size={32} />
          <h3 className="text-slate-400 text-sm font-medium mb-1">Active Users</h3>
          <p className="text-4xl font-bold text-white">{stats.activeUsers}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20">
          <Activity className="text-purple-400 mb-3" size={32} />
          <h3 className="text-slate-400 text-sm font-medium mb-1">Total Trades</h3>
          <p className="text-4xl font-bold text-white">{stats.totalTrades}</p>
        </div>
      </div>

      {/* Recent Logins */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4">Recent Logins</h3>
        <div className="space-y-3">
          {stats.recentLogins && stats.recentLogins.length > 0 ? (
            stats.recentLogins.map((login, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-white font-medium">{login.username}</span>
                <span className="text-slate-400 text-sm">{new Date(login.last_login).toLocaleString()}</span>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-center py-4">No recent logins</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Users Tab Component
const UsersTab = ({ users, loading, searchTerm, setSearchTerm, onCreateUser, onEditUser, onDeleteUser, onResetPassword }) => {
  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button
          onClick={onCreateUser}
          className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-medium transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Create User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="text-center text-slate-400 py-12">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="text-center text-slate-400 py-12">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50 border-b border-white/10">
                <tr>
                  <th className="text-left px-6 py-4 text-slate-300 font-semibold text-sm">Username</th>
                  <th className="text-left px-6 py-4 text-slate-300 font-semibold text-sm">Email</th>
                  <th className="text-left px-6 py-4 text-slate-300 font-semibold text-sm">Role</th>
                  <th className="text-left px-6 py-4 text-slate-300 font-semibold text-sm">Status</th>
                  <th className="text-left px-6 py-4 text-slate-300 font-semibold text-sm">Last Login</th>
                  <th className="text-right px-6 py-4 text-slate-300 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{user.username}</td>
                    <td className="px-6 py-4 text-slate-400">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.role === 'admin'
                          ? 'bg-purple-600/30 text-purple-200'
                          : 'bg-blue-600/30 text-blue-200'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.is_active
                          ? 'bg-green-600/30 text-green-200'
                          : 'bg-red-600/30 text-red-200'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEditUser(user)}
                          className="p-2 hover:bg-blue-600/20 text-blue-400 rounded-lg transition-all"
                          title="Edit user"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => onResetPassword(user)}
                          className="p-2 hover:bg-yellow-600/20 text-yellow-400 rounded-lg transition-all"
                          title="Reset password"
                        >
                          <Key size={18} />
                        </button>
                        <button
                          onClick={() => onDeleteUser(user.id)}
                          className="p-2 hover:bg-red-600/20 text-red-400 rounded-lg transition-all"
                          title="Delete user"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Audit Logs Tab Component
const AuditLogsTab = ({ logs, loading }) => {
  const getActionColor = (action) => {
    if (action.includes('login')) return 'text-green-400';
    if (action.includes('logout')) return 'text-blue-400';
    if (action.includes('delete')) return 'text-red-400';
    if (action.includes('create')) return 'text-purple-400';
    return 'text-yellow-400';
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
      {loading ? (
        <div className="text-center text-slate-400 py-12">Loading audit logs...</div>
      ) : logs.length === 0 ? (
        <div className="text-center text-slate-400 py-12">No audit logs found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-white/10">
              <tr>
                <th className="text-left px-6 py-4 text-slate-300 font-semibold text-sm">Timestamp</th>
                <th className="text-left px-6 py-4 text-slate-300 font-semibold text-sm">User</th>
                <th className="text-left px-6 py-4 text-slate-300 font-semibold text-sm">Action</th>
                <th className="text-left px-6 py-4 text-slate-300 font-semibold text-sm">Target</th>
                <th className="text-left px-6 py-4 text-slate-300 font-semibold text-sm">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-slate-400 text-sm">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-white font-medium">{log.username || 'System'}</td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${getActionColor(log.action)}`}>
                      {log.action.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">{log.target_username || '-'}</td>
                  <td className="px-6 py-4 text-slate-500 text-sm font-mono">{log.ip_address || 'Unknown'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// User Modal Component
const UserModal = ({ title, user = null, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'trader',
    fullName: user?.full_name || '',
    isActive: user?.is_active !== 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (!submitData.password) delete submitData.password; // Don't send empty password
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-2xl p-8 max-w-md w-full border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Password {user && '(leave blank to keep current)'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!user}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Full Name</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="trader">Trader</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-purple-600 focus:ring-2 focus:ring-purple-500"
              />
              <label htmlFor="isActive" className="text-slate-300 font-medium">Active Account</label>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all font-medium shadow-lg"
            >
              {user ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Temporary Access Tab Component
const TempAccessTab = ({ tokens, loading, onGenerateToken, onRevokeToken }) => {
  if (loading) {
    return <div className="text-center text-slate-400 py-12">Loading temporary access tokens...</div>;
  }

  const now = new Date();
  const activeTokens = tokens.filter(t => t.is_active && new Date(t.expires_at) > now);
  const expiredTokens = tokens.filter(t => !t.is_active || new Date(t.expires_at) <= now);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Temporary Access Management</h2>
          <p className="text-slate-400 mt-1">Generate time-limited access codes for temporary admin access</p>
        </div>
        <button
          onClick={onGenerateToken}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all font-medium shadow-lg"
        >
          <Plus size={20} className="mr-2" />
          Generate Token
        </button>
      </div>

      {/* Active Tokens */}
      <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Key size={20} className="mr-2 text-green-400" />
          Active Tokens ({activeTokens.length})
        </h3>
        {activeTokens.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No active temporary access tokens</p>
        ) : (
          <div className="space-y-3">
            {activeTokens.map(token => (
              <TokenCard key={token.id} token={token} onRevoke={onRevokeToken} isActive={true} />
            ))}
          </div>
        )}
      </div>

      {/* Expired/Revoked Tokens */}
      {expiredTokens.length > 0 && (
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <AlertCircle size={20} className="mr-2 text-slate-400" />
            Expired/Revoked Tokens ({expiredTokens.length})
          </h3>
          <div className="space-y-3">
            {expiredTokens.slice(0, 10).map(token => (
              <TokenCard key={token.id} token={token} onRevoke={onRevokeToken} isActive={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Token Card Component
const TokenCard = ({ token, onRevoke, isActive }) => {
  const expiresAt = new Date(token.expires_at);
  const createdAt = new Date(token.created_at);
  const usedAt = token.used_at ? new Date(token.used_at) : null;

  const getStatusBadge = () => {
    if (token.revoked_at) {
      return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">Revoked</span>;
    }
    if (expiresAt < new Date()) {
      return <span className="px-3 py-1 bg-slate-500/20 text-slate-400 rounded-full text-xs font-medium">Expired</span>;
    }
    if (token.is_used) {
      return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">Used</span>;
    }
    return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">Active</span>;
  };

  return (
    <div className={`bg-slate-700/30 rounded-xl p-4 border ${isActive ? 'border-purple-500/30' : 'border-slate-600/30'}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <code className="text-lg font-mono font-bold text-purple-400">{token.access_code}</code>
            {getStatusBadge()}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Access Level:</span>
              <span className="text-white ml-2 font-medium">{token.access_level}</span>
            </div>
            <div>
              <span className="text-slate-400">Duration:</span>
              <span className="text-white ml-2 font-medium">{token.duration_minutes} minutes</span>
            </div>
            <div>
              <span className="text-slate-400">Created:</span>
              <span className="text-white ml-2">{createdAt.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400">Expires:</span>
              <span className={`ml-2 ${expiresAt < new Date() ? 'text-red-400' : 'text-white'}`}>
                {expiresAt.toLocaleString()}
              </span>
            </div>
          </div>
          {token.granted_to_email && (
            <div className="mt-2 text-sm">
              <span className="text-slate-400">Granted To:</span>
              <span className="text-white ml-2">{token.granted_to_email}</span>
            </div>
          )}
          {token.notes && (
            <div className="mt-2 text-sm">
              <span className="text-slate-400">Notes:</span>
              <span className="text-white ml-2">{token.notes}</span>
            </div>
          )}
          {usedAt && (
            <div className="mt-2 text-sm">
              <span className="text-slate-400">Used At:</span>
              <span className="text-white ml-2">{usedAt.toLocaleString()}</span>
            </div>
          )}
        </div>
        {isActive && !token.revoked_at && (
          <button
            onClick={() => onRevoke(token.access_code)}
            className="ml-4 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
            title="Revoke Access"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

// Generate Token Modal Component
const GenerateTokenModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    duration_minutes: 30,
    access_level: 'admin',
    granted_to_email: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to generate token:', error);
    }
  };

  const quickDurations = [
    { label: '30 Minutes', value: 30 },
    { label: '1 Hour', value: 60 },
    { label: '2 Hours', value: 120 },
    { label: '4 Hours', value: 240 },
    { label: '8 Hours', value: 480 },
    { label: '24 Hours', value: 1440 }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Generate Temporary Access</h2>
          <p className="text-slate-400 mt-1">Create a time-limited access code for temporary admin access</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Duration Selection */}
          <div>
            <label className="block text-slate-300 font-medium mb-2">Duration</label>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {quickDurations.map(duration => (
                <button
                  key={duration.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, duration_minutes: duration.value })}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    formData.duration_minutes === duration.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {duration.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="5"
                max="1440"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Custom minutes"
              />
              <span className="text-slate-400">minutes (5-1440)</span>
            </div>
          </div>

          {/* Access Level */}
          <div>
            <label className="block text-slate-300 font-medium mb-2">Access Level</label>
            <select
              value={formData.access_level}
              onChange={(e) => setFormData({ ...formData, access_level: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="admin">Full Admin Access</option>
              <option value="read_only">Read Only Access</option>
            </select>
            <p className="text-slate-400 text-sm mt-1">
              {formData.access_level === 'admin'
                ? 'Full access to all admin features'
                : 'View-only access, no modifications allowed'}
            </p>
          </div>

          {/* Optional Email */}
          <div>
            <label className="block text-slate-300 font-medium mb-2">
              Granted To Email <span className="text-slate-500">(Optional)</span>
            </label>
            <input
              type="email"
              value={formData.granted_to_email}
              onChange={(e) => setFormData({ ...formData, granted_to_email: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="user@example.com"
            />
            <p className="text-slate-400 text-sm mt-1">
              If specified, only this email can use the access code
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-300 font-medium mb-2">
              Notes <span className="text-slate-500">(Optional)</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows="3"
              placeholder="Why is this access being granted?"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all font-medium shadow-lg"
            >
              Generate Access Code
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPortal;
