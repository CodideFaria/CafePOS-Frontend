import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LoginCredentials, DEFAULT_AUTH_CONFIG, User } from '../types/auth';
import { useAuth } from '../contexts/AuthContext';

interface AuthenticationFormProps {
  onSuccess?: (user: User) => void;
  onForgotPassword?: () => void;
  allowRememberMe?: boolean;
  showUserSelector?: boolean;
  defaultMode?: 'pin' | 'password';
}

type LoginMode = 'pin' | 'password';

const AuthenticationForm: React.FC<AuthenticationFormProps> = ({
  onSuccess,
  onForgotPassword,
  allowRememberMe = true,
  showUserSelector = true,
  defaultMode = 'pin'
}) => {
  const { login, loading, error, failedAttempts, lockoutUntil } = useAuth();
  
  const [mode, setMode] = useState<LoginMode>(defaultMode);
  const [credentials, setCredentials] = useState<LoginCredentials>({
    pinCode: '',
    username: '',
    password: '',
    rememberMe: false
  });
  const [pin, setPin] = useState<string[]>(['', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState<number>(0);
  
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Mock users for PIN selection
  const mockUsers = [
    { id: 'admin-001', username: 'admin', displayName: 'John Administrator', pinCode: '1234' },
    { id: 'manager-001', username: 'manager', displayName: 'Sarah Manager', pinCode: '2345' },
    { id: 'cashier-001', username: 'cashier', displayName: 'Mike Cashier', pinCode: '3456' },
    { id: 'trainee-001', username: 'trainee', displayName: 'Emma Trainee', pinCode: '4567' }
  ];

  // Handle lockout timer
  useEffect(() => {
    if (lockoutUntil) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const lockoutTime = new Date(lockoutUntil).getTime();
        const timeLeft = Math.max(0, Math.ceil((lockoutTime - now) / 1000));
        setLockoutTimeLeft(timeLeft);
        
        if (timeLeft <= 0) {
          setLockoutTimeLeft(0);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutUntil]);

  // Format lockout time display
  const formatLockoutTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Check if currently locked out
  const isLockedOut = lockoutTimeLeft > 0;

  // Handle PIN input
  const handlePinChange = useCallback((index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digits
    if (value && !/^\d$/.test(value)) return; // Only allow digits
    
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    
    // Auto-focus next input
    if (value && index < pin.length - 1) {
      pinInputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when PIN is complete
    if (newPin.every(digit => digit !== '') && newPin.length === DEFAULT_AUTH_CONFIG.pinLength) {
      const pinCode = newPin.join('');
      setCredentials(prev => ({ ...prev, pinCode }));
      handleSubmit({ pinCode, rememberMe: credentials.rememberMe });
    }
  }, [pin, credentials.rememberMe]);

  // Handle PIN key events
  const handlePinKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      pinInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < pin.length - 1) {
      pinInputRefs.current[index + 1]?.focus();
    }
  }, [pin]);

  // Clear PIN
  const clearPin = useCallback(() => {
    setPin(['', '', '', '']);
    pinInputRefs.current[0]?.focus();
  }, []);

  // Handle form submission
  const handleSubmit = async (submitCredentials?: LoginCredentials) => {
    if (isLockedOut) return;
    
    const creds = submitCredentials || credentials;
    
    try {
      await login(creds);
      // Success will be handled by the AuthContext and useAuth hook
      // The parent component can listen for auth state changes
    } catch (err) {
      // Clear PIN on failure
      if (mode === 'pin') {
        clearPin();
      } else {
        setCredentials(prev => ({ ...prev, password: '' }));
      }
    }
  };

  // Handle regular form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  // Handle user selection for PIN mode
  const handleUserSelect = (username: string) => {
    setSelectedUser(username);
    setCredentials(prev => ({ ...prev, username }));
    // Focus first PIN input
    setTimeout(() => {
      pinInputRefs.current[0]?.focus();
    }, 100);
  };

  // Handle mode switch
  const handleModeSwitch = (newMode: LoginMode) => {
    setMode(newMode);
    setCredentials({
      pinCode: '',
      username: '',
      password: '',
      rememberMe: credentials.rememberMe
    });
    setPin(['', '', '', '']);
    setSelectedUser('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo and Header */}
        <div className="flex justify-center mb-6">
          <div className="bg-orange-600 p-4 rounded-full">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>
        <h2 className="text-center text-3xl font-bold text-gray-900">
          CafePOS System
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to your account
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md mt-8">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => handleModeSwitch('pin')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                mode === 'pin'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              PIN Login
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('password')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                mode === 'password'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Password Login
            </button>
          </div>

          {/* Lockout Warning */}
          {isLockedOut && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 text-red-800">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Account Temporarily Locked</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                Too many failed login attempts. Try again in {formatLockoutTime(lockoutTimeLeft)}.
              </p>
              <p className="text-xs text-red-600 mt-1">
                Failed attempts: {failedAttempts}/{DEFAULT_AUTH_CONFIG.maxFailedAttempts}
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && !isLockedOut && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 text-red-800">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
              {failedAttempts > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Attempts remaining: {DEFAULT_AUTH_CONFIG.maxFailedAttempts - failedAttempts}
                </p>
              )}
            </div>
          )}

          {/* PIN Login Mode */}
          {mode === 'pin' && (
            <div className="space-y-6">
              {/* User Selection */}
              {showUserSelector && !selectedUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select User
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {mockUsers.map(user => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleUserSelect(user.username)}
                        disabled={isLockedOut}
                        className="p-3 text-left border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="font-medium text-gray-900">{user.displayName}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PIN Input */}
              {(selectedUser || !showUserSelector) && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Enter PIN
                      {selectedUser && (
                        <span className="text-orange-600 ml-1">
                          ({mockUsers.find(u => u.username === selectedUser)?.displayName})
                        </span>
                      )}
                    </label>
                    {selectedUser && showUserSelector && (
                      <button
                        type="button"
                        onClick={() => setSelectedUser('')}
                        className="text-xs text-orange-600 hover:text-orange-800"
                      >
                        Change User
                      </button>
                    )}
                  </div>
                  
                  <div className="flex justify-center space-x-3">
                    {pin.map((digit, index) => (
                      <input
                        key={index}
                        ref={el => pinInputRefs.current[index] = el}
                        type="password"
                        maxLength={1}
                        value={digit}
                        onChange={e => handlePinChange(index, e.target.value)}
                        onKeyDown={e => handlePinKeyDown(index, e)}
                        disabled={loading || isLockedOut}
                        className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    ))}
                  </div>

                  <div className="flex justify-center mt-4">
                    <button
                      type="button"
                      onClick={clearPin}
                      disabled={loading || isLockedOut}
                      className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Clear PIN
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Password Login Mode */}
          {mode === 'password' && (
            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={credentials.username}
                  onChange={e => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  disabled={loading || isLockedOut}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter your username"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={credentials.password}
                    onChange={e => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    disabled={loading || isLockedOut}
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading || isLockedOut}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M14.12 14.12l1.415 1.415M14.12 14.12L18.364 9.876M21.543 12a9.97 9.97 0 01-1.563 3.029" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                {allowRememberMe && (
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={credentials.rememberMe}
                      onChange={e => setCredentials(prev => ({ ...prev, rememberMe: e.target.checked }))}
                      disabled={loading || isLockedOut}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                      Remember me
                    </label>
                  </div>
                )}

                {onForgotPassword && (
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-sm text-orange-600 hover:text-orange-500"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || isLockedOut}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          )}

          {/* Loading State for PIN */}
          {mode === 'pin' && loading && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
              <span className="ml-2 text-sm text-gray-600">Authenticating...</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          Secure point-of-sale system • Contact support if you need assistance
        </p>
      </div>
    </div>
  );
};

export default AuthenticationForm;