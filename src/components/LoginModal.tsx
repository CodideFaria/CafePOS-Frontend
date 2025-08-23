import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MOCK_USERS } from '../contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, loading, error } = useAuth();
  const [loginMethod, setLoginMethod] = useState<'pin' | 'username'>('pin');
  const [pinCode, setPinCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');

  const handlePinSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinCode.length !== 4) return;

    try {
      await login({ pinCode });
      setPinCode('');
      onClose?.();
    } catch (error) {
      // Error is handled by the context
    }
  }, [pinCode, login, onClose]);

  const handleUsernameSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    try {
      await login({ username, password });
      setUsername('');
      setPassword('');
      onClose?.();
    } catch (error) {
      // Error is handled by the context
    }
  }, [username, password, login, onClose]);

  const handleQuickLogin = useCallback(async (userRole: string) => {
    const user = MOCK_USERS.find(u => u.role === userRole);
    if (user?.pinCode) {
      try {
        await login({ pinCode: user.pinCode });
        onClose?.();
      } catch (error) {
        // Error is handled by the context
      }
    }
  }, [login, onClose]);

  const handlePinInput = (digit: string) => {
    if (pinCode.length < 4) {
      setPinCode(prev => prev + digit);
    }
  };

  const clearPin = () => {
    setPinCode('');
  };

  const removeLastDigit = () => {
    setPinCode(prev => prev.slice(0, -1));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-orange-500 text-white p-6 text-center">
          <h2 className="text-2xl font-bold">☕ Cafe POS Login</h2>
          <p className="text-orange-100 mt-2">Please authenticate to continue</p>
        </div>

        {/* Login Method Toggle */}
        <div className="p-6">
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setLoginMethod('pin')}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                loginMethod === 'pin'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📱 PIN Code
            </button>
            <button
              onClick={() => setLoginMethod('username')}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                loginMethod === 'username'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              👤 Username
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* PIN Login */}
          {loginMethod === 'pin' && (
            <div className="space-y-4">
              <form onSubmit={handlePinSubmit}>
                <div className="text-center mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your 4-digit PIN
                  </label>
                  <div className="flex justify-center space-x-2 mb-4">
                    {[0, 1, 2, 3].map(index => (
                      <div
                        key={index}
                        className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center text-xl font-bold ${
                          pinCode.length > index
                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                            : 'border-gray-300 bg-gray-50'
                        }`}
                      >
                        {pinCode.length > index ? '●' : ''}
                      </div>
                    ))}
                  </div>
                </div>

                {/* PIN Pad */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'clear', 0, 'back'].map(key => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        if (key === 'clear') clearPin();
                        else if (key === 'back') removeLastDigit();
                        else handlePinInput(String(key));
                      }}
                      className={`h-12 rounded-lg font-semibold transition-colors ${
                        typeof key === 'number'
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                          : 'bg-orange-100 hover:bg-orange-200 text-orange-600'
                      }`}
                    >
                      {key === 'clear' ? '🗑️' : key === 'back' ? '⌫' : key}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={pinCode.length !== 4 || loading}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    pinCode.length === 4 && !loading
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Authenticating...' : 'Login'}
                </button>
              </form>
            </div>
          )}

          {/* Username Login */}
          {loginMethod === 'username' && (
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter username"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={!username || loading}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  username && !loading
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? 'Authenticating...' : 'Login'}
              </button>
            </form>
          )}

          {/* Quick Login Demo Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3 text-center">Demo Quick Login:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickLogin('admin')}
                disabled={loading}
                className="p-3 text-left bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <div className="font-semibold text-red-800">👑 Admin</div>
                <div className="text-xs text-red-600">PIN: 1234</div>
              </button>
              <button
                onClick={() => handleQuickLogin('manager')}
                disabled={loading}
                className="p-3 text-left bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                <div className="font-semibold text-blue-800">👔 Manager</div>
                <div className="text-xs text-blue-600">PIN: 2345</div>
              </button>
              <button
                onClick={() => handleQuickLogin('cashier')}
                disabled={loading}
                className="p-3 text-left bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
              >
                <div className="font-semibold text-green-800">💰 Cashier</div>
                <div className="text-xs text-green-600">PIN: 3456</div>
              </button>
              <button
                onClick={() => handleQuickLogin('trainee')}
                disabled={loading}
                className="p-3 text-left bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors disabled:opacity-50"
              >
                <div className="font-semibold text-yellow-800">📚 Trainee</div>
                <div className="text-xs text-yellow-600">PIN: 4567</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;