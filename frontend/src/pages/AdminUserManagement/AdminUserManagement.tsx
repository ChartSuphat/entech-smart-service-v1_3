import React, { useState, useEffect } from 'react';
import { HiUserGroup, HiShieldCheck, HiUserCircle, HiSearch, HiTrash, HiOfficeBuilding, HiKey } from 'react-icons/hi';
import api from '../../utils/axios';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'technician' | 'user';
  companyCode: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Customer {
  customerId: string;
  companyName: string;
}

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'technician' | 'user'>('all');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assignModal, setAssignModal] = useState<{ open: boolean; userId: number; userName: string; currentCode: string | null }>({ open: false, userId: 0, userName: '', currentCode: null });
  const [selectedCompanyCode, setSelectedCompanyCode] = useState<string>('');
  const [passwordModal, setPasswordModal] = useState<{ open: boolean; userId: number; userName: string }>({ open: false, userId: 0, userName: '' });
  const [newPassword, setNewPassword] = useState<string>('');

  // Load current user info (to check if admin)
  useEffect(() => {
    loadCurrentUser();
    loadCustomers();
  }, []);

  // Load users
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadUsers();
    }
  }, [currentUser]);

  const loadCurrentUser = async () => {
    try {
      // const response = await fetch('/api/users/profile', {
      //   credentials: 'include'
      // });
      const response = await api.get('/users/profile')
      if (response.data.success) {
        // const userData = await response.json();
        setCurrentUser(response.data.data);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users')
      // const response = await fetch('/api/users', {
      //   credentials: 'include'
      // });

      if (response.data.success) {
        // const data = await response.json();
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: 'admin' | 'technician' | 'user') => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      // const response = await fetch(`/api/users/${userId}/role`, {
      //   method: 'PATCH',
      //   credentials: 'include',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({ role: newRole })
      // });

      const response = await api.post(`/users/${userId}/role`, { role: newRole } );

      if (response.data.success) {
        alert('User role updated successfully');
        loadUsers();
      } 
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update user role');
    }
  };
  const handleManualVerify = async (userId: number, userName: string) => {
    if (!confirm(`Manually verify Account for "${userName}"`)) {
      return;
    }

    try {
      // const response = await fetch(`/api/users/${userId}/verify-manual`, {
      //   method: 'PATCH',
      //   credentials: 'include'
      // });
      const response = await api.post(`/users/${userId}/verify-manual`)
      if (response.data.success) {
        alert('User verified successfully');
        loadUsers();
      } 
    } catch (error) {
      console.error('Error verifying user:', error);
      alert('Failed to verify user');
    }
  };
  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!confirm(`⚠️ WARNING: Are you sure you want to DELETE user "${userName}"?\n\nThis action CANNOT be undone. All user data will be permanently removed.`)) {
      return;
    }

    // Double confirmation for safety
    if (!confirm(`Final confirmation: Delete "${userName}"?`)) {
      return;
    }

    try {
      // const response = await fetch(`/api/users/${userId}`, {
      //   method: 'DELETE',
      //   credentials: 'include'
      // });


      const response = await api.delete(`/users/${userId}`)
      if (response.data.success) {
        alert('User deleted successfully');
        loadUsers();
      } 
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const openAssignModal = (user: User) => {
    setAssignModal({ open: true, userId: user.id, userName: user.fullName, currentCode: user.companyCode });
    setSelectedCompanyCode(user.companyCode || '');
  };

  const handleAssignCompany = async () => {
    try {
      const response = await api.post(`/users/${assignModal.userId}/assign-company`, {
        companyCode: selectedCompanyCode || null
      });
      if (response.data.success) {
        alert(response.data.message);
        setAssignModal({ open: false, userId: 0, userName: '', currentCode: null });
        loadUsers();
      }
    } catch (error: any) {
      console.error('Error assigning company:', error);
      alert(error.response?.data?.message || 'Failed to assign company code');
    }
  };

  const openPasswordModal = (user: User) => {
    setPasswordModal({ open: true, userId: user.id, userName: user.fullName });
    setNewPassword('');
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    try {
      const response = await api.post(`/users/${passwordModal.userId}/reset-password`, {
        newPassword
      });
      if (response.data.success) {
        alert(response.data.message);
        setPasswordModal({ open: false, userId: 0, userName: '' });
        setNewPassword('');
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      alert(error.response?.data?.message || 'Failed to reset password');
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  // Check if current user is admin
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (currentUser.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <HiShieldCheck className="mx-auto h-16 w-16 text-red-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'technician': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <HiShieldCheck className="w-4 h-4" />;
      case 'technician': return <HiUserCircle className="w-4 h-4" />;
      default: return <HiUserGroup className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-2">
          User Management
        </h1>
        <p className="text-gray-600">Manage user roles and permissions</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-1/3 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="technician">Technician</option>
            <option value="user">User</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{users.length}</div>
            <div className="text-xs text-gray-500">Total Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{users.filter(u => u.role === 'admin').length}</div>
            <div className="text-xs text-gray-500">Admins</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'technician').length}</div>
            <div className="text-xs text-gray-500">Technicians</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{users.filter(u => u.role === 'user').length}</div>
            <div className="text-xs text-gray-500">Regular Users</div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No users found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Current Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Joined</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {user.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                          <div className="text-xs text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.companyCode ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${user.companyCode === 'ENTCH' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'}`}>
                          <HiOfficeBuilding className="w-3 h-3" />
                          {user.companyCode}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {/* Role dropdown */}
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                          disabled={user.id === currentUser.id}
                          className="px-3 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="user">User</option>
                          <option value="technician">Technician</option>
                          <option value="admin">Admin</option>
                        </select>

                        {/* Assign company button */}
                        <button
                          onClick={() => openAssignModal(user)}
                          disabled={user.id === currentUser.id}
                          className="px-3 py-1 text-xs rounded-md font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Assign company"
                        >
                          <HiOfficeBuilding className="w-4 h-4 inline mr-1" />
                          Company
                        </button>

                        {/* Reset password button */}
                        <button
                          onClick={() => openPasswordModal(user)}
                          disabled={user.id === currentUser.id}
                          className="px-3 py-1 text-xs rounded-md font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Reset password"
                        >
                          <HiKey className="w-4 h-4 inline mr-1" />
                          Password
                        </button>

                        {/* Manual verify button - only show for unverified users */}
                        {!user.isActive && (
                          <button
                            onClick={() => handleManualVerify(user.id, user.fullName)}
                            className="px-3 py-1 text-xs rounded-md font-medium bg-green-100 text-green-700 hover:bg-green-200"
                            title="Manually verify email"
                          >
                            Verify
                          </button>
                        )}

                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteUser(user.id, user.fullName)}
                          disabled={user.id === currentUser.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete user"
                        >
                          <HiTrash className="w-5 h-5" />
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

      {/* Assign Company Modal */}
      {assignModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Assign Company Code
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Assign a company to <strong>{assignModal.userName}</strong>
            </p>

            <select
              value={selectedCompanyCode}
              onChange={(e) => setSelectedCompanyCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
            >
              <option value="">-- No Company (Remove) --</option>
              <option value="ENTCH">ENTCH - Entech (See All Certificates)</option>
              {customers.map((c) => (
                <option key={c.customerId} value={c.customerId}>
                  {c.customerId} - {c.companyName}
                </option>
              ))}
            </select>

            <p className="text-xs text-gray-500 mb-4">
              {selectedCompanyCode === 'ENTCH'
                ? 'Entech staff - will see ALL certificates'
                : selectedCompanyCode
                  ? `Will only see certificates for company "${selectedCompanyCode}"`
                  : 'No company - user will see no certificates'}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setAssignModal({ open: false, userId: 0, userName: '', currentCode: null })}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignCompany}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {passwordModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <HiKey className="w-5 h-5 inline mr-2 text-blue-600" />
              Reset Password
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Set new password for <strong>{passwordModal.userName}</strong>
            </p>

            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 6 characters)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setPasswordModal({ open: false, userId: 0, userName: '' });
                  setNewPassword('');
                }}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={!newPassword || newPassword.length < 6}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;