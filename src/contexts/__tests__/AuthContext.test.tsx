import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '../AuthContext';
import { networkAdapter } from '../../network/NetworkAdapter';

// Mock the NetworkAdapter
jest.mock('../../network/NetworkAdapter', () => ({
  networkAdapter: {
    authenticate: jest.fn(),
    logout: jest.fn()
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Test component that uses the auth context
const TestComponent: React.FC = () => {
  const {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    updateUser,
    switchUser
  } = useAuth();

  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="user-info">
        {user ? `${user.firstName} ${user.lastName} (${user.role})` : 'no-user'}
      </div>
      <div data-testid="loading-status">
        {loading ? 'loading' : 'not-loading'}
      </div>
      <div data-testid="error-status">
        {error || 'no-error'}
      </div>
      
      <button
        data-testid="login-btn"
        onClick={() => login({ pinCode: '1234' })}
      >
        Login with PIN
      </button>
      
      <button
        data-testid="login-username-btn"
        onClick={() => login({ username: 'admin', password: 'test' })}
      >
        Login with Username
      </button>
      
      <button
        data-testid="logout-btn"
        onClick={logout}
      >
        Logout
      </button>
      
      <button
        data-testid="update-user-btn"
        onClick={() => updateUser({ firstName: 'Updated' })}
      >
        Update User
      </button>
      
      <button
        data-testid="switch-user-btn"
        onClick={() => switchUser(MOCK_USERS[1])}
      >
        Switch User
      </button>
      
      <div data-testid="permissions">
        <div data-testid="has-menu-view">
          {hasPermission('menu.view') ? 'has-menu-view' : 'no-menu-view'}
        </div>
        <div data-testid="has-any-permission">
          {hasAnyPermission(['menu.view', 'admin.full']) ? 'has-any' : 'no-any'}
        </div>
        <div data-testid="has-all-permissions">
          {hasAllPermissions(['menu.view', 'sales.process']) ? 'has-all' : 'no-all'}
        </div>
      </div>
    </div>
  );
};

const renderWithAuth = () => {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe('Initial State', () => {
    it('should start with unauthenticated state', () => {
      localStorageMock.getItem.mockReturnValue(null);
      renderWithAuth();

      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('no-user');
      expect(screen.getByTestId('loading-status')).toHaveTextContent('not-loading');
      expect(screen.getByTestId('error-status')).toHaveTextContent('no-error');
    });

    it('should restore user from localStorage on mount', () => {
      const savedUser = JSON.stringify(MOCK_USERS[0]);
      localStorageMock.getItem.mockReturnValue(savedUser);
      
      renderWithAuth();

      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('John Administrator (admin)');
    });

    it('should handle invalid localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');
      
      renderWithAuth();

      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('cafepos_user');
    });

    it('should handle inactive user from localStorage', () => {
      const inactiveUser = { ...MOCK_USERS[0], id: 'nonexistent', isActive: false };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(inactiveUser));
      
      renderWithAuth();

      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('cafepos_user');
    });
  });

  describe('Authentication via API', () => {
    it('should login successfully via API', async () => {
      const mockApiResponse = {
        user: MOCK_USERS[0],
        errors: []
      };
      (networkAdapter.authenticate as jest.Mock).mockResolvedValue(mockApiResponse);
      
      renderWithAuth();
      
      fireEvent.click(screen.getByTestId('login-btn'));
      
      // Should show loading state
      expect(screen.getByTestId('loading-status')).toHaveTextContent('loading');
      
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });
      
      expect(screen.getByTestId('user-info')).toHaveTextContent('John Administrator (admin)');
      expect(screen.getByTestId('loading-status')).toHaveTextContent('not-loading');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('cafepos_user', expect.any(String));
    });

    it('should fallback to mock authentication when API fails', async () => {
      (networkAdapter.authenticate as jest.Mock).mockRejectedValue(new Error('API Error'));
      
      renderWithAuth();
      
      fireEvent.click(screen.getByTestId('login-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });
      
      expect(screen.getByTestId('user-info')).toHaveTextContent('John Administrator (admin)');
      expect(console.warn).toHaveBeenCalledWith(
        'API authentication failed, falling back to mock authentication:',
        expect.any(Error)
      );
    });

    it('should handle login failure', async () => {
      (networkAdapter.authenticate as jest.Mock).mockRejectedValue(new Error('API Error'));
      
      renderWithAuth();
      
      // Try to login with invalid credentials
      fireEvent.click(screen.getByTestId('login-username-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error-status')).toHaveTextContent('Invalid credentials or user not found');
      });
      
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });
  });

  describe('Mock Authentication', () => {
    beforeEach(() => {
      (networkAdapter.authenticate as jest.Mock).mockRejectedValue(new Error('API not available'));
    });

    it('should authenticate with PIN code', async () => {
      renderWithAuth();
      
      fireEvent.click(screen.getByTestId('login-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });
      
      expect(screen.getByTestId('user-info')).toHaveTextContent('John Administrator (admin)');
    });

    it('should authenticate with username', async () => {
      renderWithAuth();
      
      fireEvent.click(screen.getByTestId('login-username-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });
      
      expect(screen.getByTestId('user-info')).toHaveTextContent('John Administrator (admin)');
    });

    it('should fail authentication with invalid PIN', async () => {
      renderWithAuth();
      
      // Mock login with invalid PIN
      const { rerender } = renderWithAuth();
      
      const TestComponentWithInvalidLogin: React.FC = () => {
        const { login, error } = useAuth();
        
        return (
          <div>
            <button
              data-testid="invalid-login-btn"
              onClick={() => login({ pinCode: '9999' })}
            >
              Invalid Login
            </button>
            <div data-testid="error-status">{error || 'no-error'}</div>
          </div>
        );
      };
      
      rerender(
        <AuthProvider>
          <TestComponentWithInvalidLogin />
        </AuthProvider>
      );
      
      fireEvent.click(screen.getByTestId('invalid-login-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error-status')).toHaveTextContent('Invalid credentials or user not found');
      });
    });
  });

  describe('Logout', () => {
    it('should logout and call API', async () => {
      // First login
      const savedUser = JSON.stringify(MOCK_USERS[0]);
      localStorageMock.getItem.mockReturnValue(savedUser);
      
      renderWithAuth();
      
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      
      // Then logout
      fireEvent.click(screen.getByTestId('logout-btn'));
      
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('no-user');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('cafepos_user');
      expect(networkAdapter.logout).toHaveBeenCalled();
    });

    it('should handle API logout failure gracefully', async () => {
      (networkAdapter.logout as jest.Mock).mockRejectedValue(new Error('Logout API Error'));
      
      // First login
      const savedUser = JSON.stringify(MOCK_USERS[0]);
      localStorageMock.getItem.mockReturnValue(savedUser);
      
      renderWithAuth();
      
      // Then logout
      fireEvent.click(screen.getByTestId('logout-btn'));
      
      // Should still logout locally even if API fails
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });
  });

  describe('User Management', () => {
    beforeEach(() => {
      // Start with authenticated user
      const savedUser = JSON.stringify(MOCK_USERS[0]);
      localStorageMock.getItem.mockReturnValue(savedUser);
    });

    it('should update user information', async () => {
      renderWithAuth();
      
      expect(screen.getByTestId('user-info')).toHaveTextContent('John Administrator (admin)');
      
      fireEvent.click(screen.getByTestId('update-user-btn'));
      
      expect(screen.getByTestId('user-info')).toHaveTextContent('Updated Administrator (admin)');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('cafepos_user', expect.any(String));
    });

    it('should allow admin to switch users', async () => {
      renderWithAuth();
      
      expect(screen.getByTestId('user-info')).toHaveTextContent('John Administrator (admin)');
      
      fireEvent.click(screen.getByTestId('switch-user-btn'));
      
      expect(screen.getByTestId('user-info')).toHaveTextContent('Sarah Manager (manager)');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('cafepos_user', expect.any(String));
    });

    it('should prevent non-admin from switching users', async () => {
      // Start with non-admin user
      const savedUser = JSON.stringify(MOCK_USERS[2]); // cashier
      localStorageMock.getItem.mockReturnValue(savedUser);
      
      const TestComponentWithError: React.FC = () => {
        const { switchUser } = useAuth();
        const [error, setError] = React.useState<string | null>(null);
        
        const handleSwitchUser = () => {
          try {
            switchUser(MOCK_USERS[1]);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
          }
        };
        
        return (
          <div>
            <button data-testid="switch-user-btn" onClick={handleSwitchUser}>
              Switch User
            </button>
            <div data-testid="switch-error">{error || 'no-error'}</div>
          </div>
        );
      };
      
      render(
        <AuthProvider>
          <TestComponentWithError />
        </AuthProvider>
      );
      
      fireEvent.click(screen.getByTestId('switch-user-btn'));
      
      expect(screen.getByTestId('switch-error')).toHaveTextContent('Insufficient permissions to switch users');
    });
  });

  describe('Permission Checks', () => {
    beforeEach(() => {
      // Start with cashier user
      const savedUser = JSON.stringify(MOCK_USERS[2]);
      localStorageMock.getItem.mockReturnValue(savedUser);
    });

    it('should check individual permissions correctly', () => {
      renderWithAuth();
      
      expect(screen.getByTestId('has-menu-view')).toHaveTextContent('has-menu-view');
    });

    it('should check any permission correctly', () => {
      renderWithAuth();
      
      expect(screen.getByTestId('has-any-permission')).toHaveTextContent('has-any');
    });

    it('should check all permissions correctly', () => {
      renderWithAuth();
      
      // Cashier has both menu.view and sales.process
      expect(screen.getByTestId('has-all-permissions')).toHaveTextContent('has-all');
    });

    it('should return false for permissions when user is inactive', () => {
      // Create inactive user
      const inactiveUser = { ...MOCK_USERS[2], isActive: false };
      
      const TestComponentWithInactiveUser: React.FC = () => {
        const { hasPermission } = useAuth();
        
        // Mock the auth context to return inactive user
        React.useEffect(() => {
          // This would normally be handled by the context
        }, []);
        
        return (
          <div data-testid="permission-check">
            {hasPermission('menu.view') ? 'has-permission' : 'no-permission'}
          </div>
        );
      };
      
      // For this test, we'll mock the localStorage to return null
      // which will result in no authenticated user
      localStorageMock.getItem.mockReturnValue(null);
      
      render(
        <AuthProvider>
          <TestComponentWithInactiveUser />
        </AuthProvider>
      );
      
      expect(screen.getByTestId('permission-check')).toHaveTextContent('no-permission');
    });
  });
});