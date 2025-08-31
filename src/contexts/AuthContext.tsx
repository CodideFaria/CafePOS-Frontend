import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, Permission, getUserPermissions, DEFAULT_AUTH_CONFIG } from '../types/auth';
import { networkAdapter } from '../network/NetworkAdapter';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  updateUser: (user: Partial<User>) => void;
  switchUser: (user: User) => void; // For admin switching between users
  updateActivity: () => void; // Extend session on user activity
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'SWITCH_USER'; payload: User }
  | { type: 'SET_LOCKOUT'; payload: Date }
  | { type: 'CLEAR_LOCKOUT' }
  | { type: 'UPDATE_ACTIVITY' }
  | { type: 'SESSION_EXPIRED' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    
    case 'LOGIN_SUCCESS':
      const now = new Date();
      const sessionExpiry = new Date(now.getTime() + DEFAULT_AUTH_CONFIG.sessionTimeoutMinutes * 60 * 1000);
      
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        loading: false,
        error: null,
        failedAttempts: 0,
        lockoutUntil: null,
        lastActivity: now,
        sessionExpiry
      };
    
    case 'LOGIN_FAILURE':
      const newFailedAttempts = state.failedAttempts + 1;
      const shouldLockout = newFailedAttempts >= DEFAULT_AUTH_CONFIG.maxFailedAttempts;
      const lockoutUntil = shouldLockout 
        ? new Date(Date.now() + DEFAULT_AUTH_CONFIG.lockoutDurationMinutes * 60 * 1000)
        : state.lockoutUntil;
      
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: action.payload,
        failedAttempts: newFailedAttempts,
        lockoutUntil
      };
    
    case 'LOGOUT':
    case 'SESSION_EXPIRED':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: action.type === 'SESSION_EXPIRED' ? 'Session expired. Please log in again.' : null,
        lastActivity: null,
        sessionExpiry: null
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
        lastActivity: new Date()
      };
    
    case 'SWITCH_USER':
      return {
        ...state,
        user: action.payload,
        lastActivity: new Date()
      };
    
    case 'SET_LOCKOUT':
      return {
        ...state,
        lockoutUntil: action.payload
      };
    
    case 'CLEAR_LOCKOUT':
      return {
        ...state,
        failedAttempts: 0,
        lockoutUntil: null
      };
    
    case 'UPDATE_ACTIVITY':
      const newSessionExpiry = new Date(Date.now() + DEFAULT_AUTH_CONFIG.sessionTimeoutMinutes * 60 * 1000);
      return {
        ...state,
        lastActivity: new Date(),
        sessionExpiry: newSessionExpiry
      };
    
    default:
      return state;
  }
};

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
  failedAttempts: 0,
  lockoutUntil: null,
  lastActivity: null,
  sessionExpiry: null
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing session on mount and restore auth state
  useEffect(() => {
    const validateSession = async () => {
      const savedUser = localStorage.getItem('cafepos_user');
      const savedAuthState = localStorage.getItem('cafepos_auth_state');
      
      if (savedUser && savedAuthState) {
        try {
          const user = JSON.parse(savedUser);
          const authState = JSON.parse(savedAuthState);
          
          // Check if session is still valid
          const sessionExpiry = authState.sessionExpiry ? new Date(authState.sessionExpiry) : null;
          const lockoutUntil = authState.lockoutUntil ? new Date(authState.lockoutUntil) : null;
          
          // If locked out and lockout hasn't expired, maintain lockout
          if (lockoutUntil && lockoutUntil > new Date()) {
            dispatch({ 
              type: 'SET_LOCKOUT', 
              payload: lockoutUntil 
            });
            return;
          }
          
          // If session expired, clear everything
          if (sessionExpiry && sessionExpiry < new Date()) {
            localStorage.removeItem('cafepos_user');
            localStorage.removeItem('cafepos_auth_state');
            dispatch({ type: 'SESSION_EXPIRED' });
            return;
          }
          
          // Verify user is still valid and active via API (only if we have a token)
          if (authState.token) {
            try {
              const response = await networkAdapter.getCurrentUser();
              if (response && response.success && response.data) {
                const currentUser = response.data.user; // Extract user from response.data.user
                currentUser.permissions = getUserPermissions(currentUser.role);
                dispatch({ type: 'LOGIN_SUCCESS', payload: currentUser });
              } else {
                localStorage.removeItem('cafepos_user');
                localStorage.removeItem('cafepos_auth_state');
              }
            } catch (error) {
              console.warn('Failed to verify current user:', error);
              localStorage.removeItem('cafepos_user');
              localStorage.removeItem('cafepos_auth_state');
            }
          } else {
            // No token available, clear session
            localStorage.removeItem('cafepos_user');
            localStorage.removeItem('cafepos_auth_state');
          }
        } catch (error) {
          localStorage.removeItem('cafepos_user');
          localStorage.removeItem('cafepos_auth_state');
        }
      }
    };

    validateSession();
  }, []);

  // Session timeout checker
  useEffect(() => {
    let sessionCheckInterval: NodeJS.Timeout;
    
    if (state.isAuthenticated && state.sessionExpiry) {
      sessionCheckInterval = setInterval(() => {
        if (new Date() >= new Date(state.sessionExpiry!)) {
          dispatch({ type: 'SESSION_EXPIRED' });
          localStorage.removeItem('cafepos_user');
          localStorage.removeItem('cafepos_auth_state');
        }
      }, 60000); // Check every minute
    }
    
    return () => {
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
      }
    };
  }, [state.isAuthenticated, state.sessionExpiry]);

  // Save auth state to localStorage whenever it changes
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      localStorage.setItem('cafepos_user', JSON.stringify(state.user));
      
      // Get existing auth state to preserve token
      const existingAuthState = localStorage.getItem('cafepos_auth_state');
      let authState = {
        failedAttempts: state.failedAttempts,
        lockoutUntil: state.lockoutUntil,
        lastActivity: state.lastActivity,
        sessionExpiry: state.sessionExpiry
      };
      
      // Preserve token if it exists
      if (existingAuthState) {
        try {
          const parsed = JSON.parse(existingAuthState);
          if (parsed.token) {
            authState.token = parsed.token;
          }
        } catch (error) {
          console.warn('Failed to parse existing auth state:', error);
        }
      }
      
      localStorage.setItem('cafepos_auth_state', JSON.stringify(authState));
    }
  }, [state]);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    // Check if currently locked out
    if (state.lockoutUntil && state.lockoutUntil > new Date()) {
      const timeLeft = Math.ceil((new Date(state.lockoutUntil).getTime() - Date.now()) / 1000 / 60);
      throw new Error(`Account locked. Try again in ${timeLeft} minute(s).`);
    }
    
    // Clear lockout if it has expired
    if (state.lockoutUntil && state.lockoutUntil <= new Date()) {
      dispatch({ type: 'CLEAR_LOCKOUT' });
    }

    dispatch({ type: 'LOGIN_START' });

    try {
      // API authentication only - no fallback
      const response = await networkAdapter.authenticate(credentials);
      console.log('Auth response:', response);
      
      // Check if authentication was successful (backend returns data with user info for success)
      if (response && response.data && response.data.user && response.data.token) {
        const user = response.data.user; // Extract user from response.data.user
        const token = response.data.token; // Extract token from response.data.token
        const sessionExpiry = response.data.sessionExpiry; // Extract session expiry

        if (!user) {
          throw new Error('User data is missing from response');
        }
        
        if (!user.role) {
          throw new Error('User role is missing from response');
        }

        // Update permissions based on role
        user.permissions = getUserPermissions(user.role);
        user.lastLogin = new Date();

        // Save user to localStorage
        localStorage.setItem('cafepos_user', JSON.stringify(user));

        // Save auth state with token to localStorage
        const authState = {
          token: token,
          sessionExpiry: sessionExpiry,
          lastActivity: new Date(),
          failedAttempts: 0,
          lockoutUntil: null
        };
        localStorage.setItem('cafepos_auth_state', JSON.stringify(authState));

        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      } else {
        // Handle authentication failure with proper error message
        let errorMessage = 'Invalid credentials. Please check your PIN or username/password.';
        
        if (response?.errors?.length > 0) {
          errorMessage = response.errors[0];
        } else if (response?.message) {
          errorMessage = response.message;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      let message = 'Login failed. Please try again.';
      
      if (error instanceof Error) {
        // Use the specific error message
        message = error.message;
      }
      
      // Handle network errors specifically
      if (error && typeof error === 'object' && 'name' in error && error.name === 'TypeError' && 
          'message' in error && typeof error.message === 'string' && error.message.includes('fetch')) {
        message = 'Unable to connect to server. Please check your connection.';
      }
      
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      throw error;
    }
  };

  const logout = (): void => {
    // Try to call API logout
    try {
      networkAdapter.logout().catch(error => {
        console.warn('API logout failed:', error);
      });
    } catch (error) {
      console.warn('API logout error:', error);
    }
    
    localStorage.removeItem('cafepos_user');
    localStorage.removeItem('cafepos_auth_state');
    dispatch({ type: 'LOGOUT' });
  };

  // Update activity (extend session)
  const updateActivity = (): void => {
    if (state.isAuthenticated) {
      dispatch({ type: 'UPDATE_ACTIVITY' });
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!state.user || !state.user.isActive) return false;
    return state.user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!state.user || !state.user.isActive) return false;
    return permissions.some(permission => state.user!.permissions.includes(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!state.user || !state.user.isActive) return false;
    return permissions.every(permission => state.user!.permissions.includes(permission));
  };

  const updateUser = (userUpdate: Partial<User>): void => {
    dispatch({ type: 'UPDATE_USER', payload: userUpdate });
    
    // Update localStorage
    if (state.user) {
      const updatedUser = { ...state.user, ...userUpdate };
      localStorage.setItem('cafepos_user', JSON.stringify(updatedUser));
    }
  };

  const switchUser = (user: User): void => {
    // Only admins can switch users
    if (state.user?.role !== 'admin') {
      throw new Error('Insufficient permissions to switch users');
    }
    
    localStorage.setItem('cafepos_user', JSON.stringify(user));
    dispatch({ type: 'SWITCH_USER', payload: user });
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    updateUser,
    switchUser,
    updateActivity
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

