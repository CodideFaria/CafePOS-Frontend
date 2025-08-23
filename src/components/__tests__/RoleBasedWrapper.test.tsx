import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RoleBasedWrapper from '../RoleBasedWrapper';
import { AuthProvider } from '../../contexts/AuthContext';
import { User, ROLE_PERMISSIONS } from '../../types/auth';

// Mock user data for testing
const mockUsers: Record<string, User> = {
  admin: {
    id: 'admin-001',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@test.com',
    role: 'admin',
    permissions: ROLE_PERMISSIONS.admin,
    isActive: true,
    createdAt: new Date(),
    lastLogin: new Date()
  },
  manager: {
    id: 'manager-001',
    username: 'manager',
    firstName: 'Manager',
    lastName: 'User',
    email: 'manager@test.com',
    role: 'manager',
    permissions: ROLE_PERMISSIONS.manager,
    isActive: true,
    createdAt: new Date(),
    lastLogin: new Date()
  },
  cashier: {
    id: 'cashier-001',
    username: 'cashier',
    firstName: 'Cashier',
    lastName: 'User',
    email: 'cashier@test.com',
    role: 'cashier',
    permissions: ROLE_PERMISSIONS.cashier,
    isActive: true,
    createdAt: new Date(),
    lastLogin: new Date()
  },
  trainee: {
    id: 'trainee-001',
    username: 'trainee',
    firstName: 'Trainee',
    lastName: 'User',
    email: 'trainee@test.com',
    role: 'trainee',
    permissions: ROLE_PERMISSIONS.trainee,
    isActive: true,
    createdAt: new Date(),
    lastLogin: new Date()
  },
  inactive: {
    id: 'inactive-001',
    username: 'inactive',
    firstName: 'Inactive',
    lastName: 'User',
    email: 'inactive@test.com',
    role: 'cashier',
    permissions: ROLE_PERMISSIONS.cashier,
    isActive: false,
    createdAt: new Date(),
    lastLogin: new Date()
  }
};

// Mock AuthContext
const mockAuthContext = (user: User | null) => ({
  isAuthenticated: !!user,
  user,
  loading: false,
  error: null,
  login: jest.fn(),
  logout: jest.fn(),
  hasPermission: jest.fn((permission) => user?.permissions.includes(permission) || false),
  hasAnyPermission: jest.fn((permissions) => 
    permissions.some((permission: string) => user?.permissions.includes(permission as any)) || false
  ),
  hasAllPermissions: jest.fn((permissions) => 
    permissions.every((permission: string) => user?.permissions.includes(permission as any)) || false
  ),
  updateUser: jest.fn(),
  switchUser: jest.fn()
});

// Custom render function that wraps component with AuthProvider
const renderWithAuth = (component: React.ReactElement, user: User | null = null) => {
  // Mock the useAuth hook
  const mockContext = mockAuthContext(user);
  jest.doMock('../../contexts/AuthContext', () => ({
    useAuth: () => mockContext
  }));

  return render(component);
};

describe('RoleBasedWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe('Authentication Requirements', () => {
    it('should render content when user is authenticated and no specific permissions required', () => {
      renderWithAuth(
        <RoleBasedWrapper>
          <div data-testid="protected-content">Protected Content</div>
        </RoleBasedWrapper>,
        mockUsers.cashier
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render content when user is not authenticated', () => {
      renderWithAuth(
        <RoleBasedWrapper>
          <div data-testid="protected-content">Protected Content</div>
        </RoleBasedWrapper>,
        null
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should not render content when user is inactive', () => {
      renderWithAuth(
        <RoleBasedWrapper>
          <div data-testid="protected-content">Protected Content</div>
        </RoleBasedWrapper>,
        mockUsers.inactive
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should show error message when user is not authenticated and showError is true', () => {
      renderWithAuth(
        <RoleBasedWrapper showError={true}>
          <div data-testid="protected-content">Protected Content</div>
        </RoleBasedWrapper>,
        null
      );

      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Please log in to access this feature')).toBeInTheDocument();
    });
  });

  describe('Permission-based Access Control', () => {
    it('should render content when user has required permission', () => {
      renderWithAuth(
        <RoleBasedWrapper requiredPermissions={['menu.view']}>
          <div data-testid="protected-content">Menu Content</div>
        </RoleBasedWrapper>,
        mockUsers.cashier
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render content when user lacks required permission', () => {
      renderWithAuth(
        <RoleBasedWrapper requiredPermissions={['menu.edit']}>
          <div data-testid="protected-content">Menu Edit Content</div>
        </RoleBasedWrapper>,
        mockUsers.trainee
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render content when user has ANY of the required permissions', () => {
      renderWithAuth(
        <RoleBasedWrapper 
          requiredPermissions={['menu.edit', 'inventory.view']}
          requireAllPermissions={false}
        >
          <div data-testid="protected-content">Admin Content</div>
        </RoleBasedWrapper>,
        mockUsers.cashier // has inventory.view but not menu.edit
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render content when user lacks ALL required permissions', () => {
      renderWithAuth(
        <RoleBasedWrapper 
          requiredPermissions={['menu.edit', 'inventory.edit']}
          requireAllPermissions={true}
        >
          <div data-testid="protected-content">Full Admin Content</div>
        </RoleBasedWrapper>,
        mockUsers.cashier // has neither permission
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render content when user has ALL required permissions', () => {
      renderWithAuth(
        <RoleBasedWrapper 
          requiredPermissions={['menu.view', 'inventory.view']}
          requireAllPermissions={true}
        >
          <div data-testid="protected-content">Manager Content</div>
        </RoleBasedWrapper>,
        mockUsers.manager
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should show detailed error with permission requirements', () => {
      renderWithAuth(
        <RoleBasedWrapper 
          requiredPermissions={['menu.edit', 'menu.delete']}
          showError={true}
        >
          <div data-testid="protected-content">Menu Management</div>
        </RoleBasedWrapper>,
        mockUsers.cashier
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText('menu.edit')).toBeInTheDocument();
      expect(screen.getByText('menu.delete')).toBeInTheDocument();
      expect(screen.getByText('cashier')).toBeInTheDocument();
    });
  });

  describe('Role-based Access Control', () => {
    it('should render content when user has allowed role', () => {
      renderWithAuth(
        <RoleBasedWrapper allowedRoles={['admin', 'manager']}>
          <div data-testid="protected-content">Management Content</div>
        </RoleBasedWrapper>,
        mockUsers.manager
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render content when user lacks allowed role', () => {
      renderWithAuth(
        <RoleBasedWrapper allowedRoles={['admin']}>
          <div data-testid="protected-content">Admin Only Content</div>
        </RoleBasedWrapper>,
        mockUsers.manager
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should show error with role requirements', () => {
      renderWithAuth(
        <RoleBasedWrapper 
          allowedRoles={['admin', 'manager']}
          showError={true}
        >
          <div data-testid="protected-content">Management Content</div>
        </RoleBasedWrapper>,
        mockUsers.trainee
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('manager')).toBeInTheDocument();
    });
  });

  describe('Custom Validation', () => {
    it('should render content when custom validator returns true', () => {
      const customValidator = jest.fn(() => true);
      
      renderWithAuth(
        <RoleBasedWrapper customValidator={customValidator}>
          <div data-testid="protected-content">Custom Content</div>
        </RoleBasedWrapper>,
        mockUsers.cashier
      );

      expect(customValidator).toHaveBeenCalledWith(mockUsers.cashier);
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render content when custom validator returns false', () => {
      const customValidator = jest.fn(() => false);
      
      renderWithAuth(
        <RoleBasedWrapper customValidator={customValidator}>
          <div data-testid="protected-content">Custom Content</div>
        </RoleBasedWrapper>,
        mockUsers.cashier
      );

      expect(customValidator).toHaveBeenCalledWith(mockUsers.cashier);
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Inverse Logic', () => {
    it('should hide content when inverse is true and condition is met', () => {
      renderWithAuth(
        <RoleBasedWrapper allowedRoles={['trainee']} inverse={true}>
          <div data-testid="protected-content">Advanced Features</div>
        </RoleBasedWrapper>,
        mockUsers.trainee
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should show content when inverse is true and condition is not met', () => {
      renderWithAuth(
        <RoleBasedWrapper allowedRoles={['trainee']} inverse={true}>
          <div data-testid="protected-content">Advanced Features</div>
        </RoleBasedWrapper>,
        mockUsers.manager
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Fallback Content', () => {
    it('should render fallback content when access is denied', () => {
      renderWithAuth(
        <RoleBasedWrapper 
          requiredPermissions={['system.maintenance']}
          fallback={<div data-testid="fallback-content">Access Restricted</div>}
        >
          <div data-testid="protected-content">System Maintenance</div>
        </RoleBasedWrapper>,
        mockUsers.cashier
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
    });

    it('should render original content when access is granted despite having fallback', () => {
      renderWithAuth(
        <RoleBasedWrapper 
          requiredPermissions={['menu.view']}
          fallback={<div data-testid="fallback-content">Access Restricted</div>}
        >
          <div data-testid="protected-content">Menu Content</div>
        </RoleBasedWrapper>,
        mockUsers.cashier
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByTestId('fallback-content')).not.toBeInTheDocument();
    });
  });

  describe('Custom Error Messages', () => {
    it('should display custom error message', () => {
      renderWithAuth(
        <RoleBasedWrapper 
          requiredPermissions={['system.maintenance']}
          showError={true}
          errorMessage="This feature requires system administrator privileges."
        >
          <div data-testid="protected-content">System Tools</div>
        </RoleBasedWrapper>,
        mockUsers.cashier
      );

      expect(screen.getByText('This feature requires system administrator privileges.')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should render content when no restrictions are specified', () => {
      renderWithAuth(
        <RoleBasedWrapper>
          <div data-testid="protected-content">Public Content</div>
        </RoleBasedWrapper>,
        mockUsers.cashier
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should handle empty permission arrays gracefully', () => {
      renderWithAuth(
        <RoleBasedWrapper requiredPermissions={[]}>
          <div data-testid="protected-content">Content</div>
        </RoleBasedWrapper>,
        mockUsers.cashier
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should handle empty role arrays gracefully', () => {
      renderWithAuth(
        <RoleBasedWrapper allowedRoles={[]}>
          <div data-testid="protected-content">Content</div>
        </RoleBasedWrapper>,
        mockUsers.cashier
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });
});