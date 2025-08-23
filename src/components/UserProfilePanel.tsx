import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MOCK_USERS } from '../contexts/AuthContext';
import { formatDateTime } from '../utils/dateUtils';

interface UserProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfilePanel: React.FC<UserProfilePanelProps> = ({ isOpen, onClose }) => {
  const { user, logout, switchUser, hasPermission } = useAuth();
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-600 bg-red-100';
      case 'manager': return 'text-blue-600 bg-blue-100';
      case 'cashier': return 'text-green-600 bg-green-100';
      case 'trainee': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return '👑';
      case 'manager': return '👔';
      case 'cashier': return '💰';
      case 'trainee': return '📚';
      default: return '👤';
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleSwitchUser = (targetUser: typeof MOCK_USERS[0]) => {
    try {
      switchUser(targetUser);
      setShowUserSwitcher(false);
      onClose();
    } catch (error) {
      console.error('Failed to switch user:', error);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl">
                {getRoleIcon(user.role)}
              </div>
              <div>
                <h2 className="text-xl font-bold">{user.firstName} {user.lastName}</h2>
                <p className="text-orange-100">@{user.username}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-orange-200 p-1"
              aria-label="Close profile"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* User Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Role:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRoleColor(user.role)}`}>
                {getRoleIcon(user.role)} {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Email:</span>
              <span className="text-sm text-gray-800">{user.email}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">User ID:</span>
              <span className="text-sm text-gray-800 font-mono">{user.id}</span>
            </div>
            
            {user.lastLogin && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Last Login:</span>
                <span className="text-sm text-gray-800">{formatDateTime(user.lastLogin)}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                user.isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
              }`}>
                {user.isActive ? '✅ Active' : '❌ Inactive'}
              </span>
            </div>
          </div>

          {/* Permissions Summary */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Permission Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { permission: 'menu.edit', label: 'Edit Menu' },
                { permission: 'inventory.edit', label: 'Edit Inventory' },
                { permission: 'sales.refund', label: 'Process Refunds' },
                { permission: 'reports.view', label: 'View Reports' },
                { permission: 'users.view', label: 'Manage Users' },
                { permission: 'system.settings', label: 'System Settings' }
              ].map(({ permission, label }) => (
                <div
                  key={permission}
                  className={`p-2 rounded-lg border ${
                    hasPermission(permission as any)
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{hasPermission(permission as any) ? '✅' : '❌'}</span>
                    <span>{label}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-3 text-center">
              <span className="text-xs text-gray-500">
                Total permissions: {user.permissions.length}
              </span>
            </div>
          </div>

          {/* Admin User Switcher */}
          {user.role === 'admin' && (
            <div className="border-t pt-4">
              <button
                onClick={() => setShowUserSwitcher(!showUserSwitcher)}
                className="w-full text-left p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-blue-800">🔄 Switch User</div>
                    <div className="text-xs text-blue-600">Admin privilege</div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-blue-600 transition-transform ${
                      showUserSwitcher ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {showUserSwitcher && (
                <div className="mt-3 space-y-2">
                  {MOCK_USERS.filter(u => u.id !== user.id && u.isActive).map(switchUser => (
                    <button
                      key={switchUser.id}
                      onClick={() => handleSwitchUser(switchUser)}
                      className="w-full p-3 text-left bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getRoleIcon(switchUser.role)}</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {switchUser.firstName} {switchUser.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {switchUser.role} • @{switchUser.username}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="border-t pt-4 space-y-3">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePanel;