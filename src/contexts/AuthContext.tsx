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

// Mock users for demonstration
const MOCK_USERS: User[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',  // Valid UUID for admin
    username: 'admin',
    firstName: 'John',
    lastName: 'Administrator',
    email: 'admin@cafepos.com',
    role: 'admin',
    permissions: getUserPermissions('admin'),
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
    pinCode: '1234'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',  // Valid UUID for manager
    username: 'manager',
    firstName: 'Sarah',
    lastName: 'Manager',
    email: 'manager@cafepos.com',
    role: 'manager',
    permissions: getUserPermissions('manager'),
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
    pinCode: '2345'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',  // Valid UUID for cashier
    username: 'cashier',
    firstName: 'Mike',
    lastName: 'Cashier',
    email: 'cashier@cafepos.com',
    role: 'cashier',
    permissions: getUserPermissions('cashier'),
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
    pinCode: '3456'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',  // Valid UUID for trainee
    username: 'trainee',
    firstName: 'Emma',
    lastName: 'Trainee',
    email: 'trainee@cafepos.com',
    role: 'trainee',
    permissions: getUserPermissions('trainee'),
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
    pinCode: '4567'
  }
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing session on mount and restore auth state
  useEffect(() => {
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
        
        // Verify user is still valid and active
        const currentUser = MOCK_USERS.find(u => u.id === user.id && u.isActive);
        if (currentUser) {
          dispatch({ type: 'LOGIN_SUCCESS', payload: currentUser });
        } else {
          localStorage.removeItem('cafepos_user');
          localStorage.removeItem('cafepos_auth_state');
        }
      } catch (error) {
        localStorage.removeItem('cafepos_user');
        localStorage.removeItem('cafepos_auth_state');
      }
    }
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
      localStorage.setItem('cafepos_auth_state', JSON.stringify({
        failedAttempts: state.failedAttempts,
        lockoutUntil: state.lockoutUntil,
        lastActivity: state.lastActivity,
        sessionExpiry: state.sessionExpiry
      }));
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
      let user: User | undefined;
      
      // Try API authentication first
      try {
        const response = await networkAdapter.authenticate(credentials);
        if (response && response.user && !response.errors?.length) {
          user = response.user;
          // Update permissions based on role
          user.permissions = getUserPermissions(user.role);
        }
      } catch (apiError) {
        console.warn('API authentication failed, falling back to mock authentication:', apiError);
      }

      // Fallback to mock authentication if API fails
      if (!user) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // PIN-based login
        if (credentials.pinCode) {
          user = MOCK_USERS.find(u => 
            u.pinCode === credentials.pinCode && u.isActive
          );
        }
        
        // Username/password login
        if (!user && credentials.username) {
          user = MOCK_USERS.find(u => 
            u.username === credentials.username && u.isActive
          );
          
          // In a real app, you'd verify the password here
          // For demo purposes, we'll accept any password for existing usernames
        }
      }

      if (!user) {
        throw new Error('Invalid credentials or user not found');
      }

      // Update last login
      user.lastLogin = new Date();

      // Save to localStorage
      localStorage.setItem('cafepos_user', JSON.stringify(user));

      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
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

// Export mock users for development/testing
export { MOCK_USERS };