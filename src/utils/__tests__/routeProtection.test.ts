import {
  RouteAccessManager,
  CAFEPOS_ROUTES,
  canAccessAdmin,
  canProcessSales,
  canManageInventory,
  getUserDashboardRoutes,
  createRouteMiddleware
} from '../routeProtection';
import { User, ROLE_PERMISSIONS } from '../../types/auth';

// Mock users for testing
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

// Mock console.log to avoid test output noise
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe('RouteAccessManager', () => {
  beforeEach(() => {
    RouteAccessManager.clearAccessLog();
  });

  describe('hasRouteAccess', () => {
    it('should deny access when user is not authenticated', () => {
      const routeConfig = {
        path: '/test',
        component: 'TestComponent',
        requiredPermissions: ['menu.view' as const]
      };

      const result = RouteAccessManager.hasRouteAccess(routeConfig, {
        user: null,
        isAuthenticated: false
      });

      expect(result.hasAccess).toBe(false);
      expect(result.reason).toContain('not authenticated');
    });

    it('should deny access when user is inactive', () => {
      const routeConfig = {
        path: '/test',
        component: 'TestComponent',
        requiredPermissions: ['menu.view' as const]
      };

      const result = RouteAccessManager.hasRouteAccess(routeConfig, {
        user: mockUsers.inactive,
        isAuthenticated: true
      });

      expect(result.hasAccess).toBe(false);
      expect(result.reason).toContain('inactive');
    });

    it('should grant access when user has required permissions', () => {
      const routeConfig = {
        path: '/menu',
        component: 'ProductMenu',
        requiredPermissions: ['menu.view' as const]
      };

      const result = RouteAccessManager.hasRouteAccess(routeConfig, {
        user: mockUsers.cashier,
        isAuthenticated: true
      });

      expect(result.hasAccess).toBe(true);
      expect(result.reason).toBe('Access granted');
    });

    it('should deny access when user lacks required permissions', () => {
      const routeConfig = {
        path: '/admin/menu',
        component: 'MenuManagement',
        requiredPermissions: ['menu.edit' as const, 'menu.delete' as const],
        requireAllPermissions: true
      };

      const result = RouteAccessManager.hasRouteAccess(routeConfig, {
        user: mockUsers.cashier,
        isAuthenticated: true
      });

      expect(result.hasAccess).toBe(false);
      expect(result.reason).toContain('Missing required permissions');
    });

    it('should grant access based on ANY permission when requireAllPermissions is false', () => {
      const routeConfig = {
        path: '/admin',
        component: 'AdminPanel',
        requiredPermissions: ['menu.edit' as const, 'inventory.view' as const],
        requireAllPermissions: false
      };

      const result = RouteAccessManager.hasRouteAccess(routeConfig, {
        user: mockUsers.cashier, // has inventory.view but not menu.edit
        isAuthenticated: true
      });

      expect(result.hasAccess).toBe(true);
    });

    it('should grant access based on allowed roles', () => {
      const routeConfig = {
        path: '/admin',
        component: 'AdminPanel',
        allowedRoles: ['admin', 'manager']
      };

      const result = RouteAccessManager.hasRouteAccess(routeConfig, {
        user: mockUsers.manager,
        isAuthenticated: true
      });

      expect(result.hasAccess).toBe(true);
    });

    it('should deny access when user role is not in allowed roles', () => {
      const routeConfig = {
        path: '/system',
        component: 'SystemPanel',
        allowedRoles: ['admin']
      };

      const result = RouteAccessManager.hasRouteAccess(routeConfig, {
        user: mockUsers.manager,
        isAuthenticated: true
      });

      expect(result.hasAccess).toBe(false);
      expect(result.reason).toContain('not in allowed roles');
    });

    it('should grant access when no restrictions are specified', () => {
      const routeConfig = {
        path: '/public',
        component: 'PublicComponent'
      };

      const result = RouteAccessManager.hasRouteAccess(routeConfig, {
        user: mockUsers.trainee,
        isAuthenticated: true
      });

      expect(result.hasAccess).toBe(true);
    });
  });

  describe('getAccessibleRoutes', () => {
    it('should return only accessible routes for admin user', () => {
      const accessibleRoutes = RouteAccessManager.getAccessibleRoutes(CAFEPOS_ROUTES, {
        user: mockUsers.admin,
        isAuthenticated: true
      });

      // Admin should have access to all routes
      expect(accessibleRoutes.length).toBe(CAFEPOS_ROUTES.length);
    });

    it('should return limited routes for trainee user', () => {
      const accessibleRoutes = RouteAccessManager.getAccessibleRoutes(CAFEPOS_ROUTES, {
        user: mockUsers.trainee,
        isAuthenticated: true
      });

      // Trainee has limited permissions
      expect(accessibleRoutes.length).toBeLessThan(CAFEPOS_ROUTES.length);
      
      // Should have access to menu and basic sales
      const menuRoute = accessibleRoutes.find(route => route.path === '/menu');
      const cartRoute = accessibleRoutes.find(route => route.path === '/cart');
      
      expect(menuRoute).toBeDefined();
      expect(cartRoute).toBeDefined();
      
      // Should not have access to admin routes
      const adminRoute = accessibleRoutes.find(route => route.path === '/admin');
      expect(adminRoute).toBeUndefined();
    });

    it('should return no routes for unauthenticated user', () => {
      const accessibleRoutes = RouteAccessManager.getAccessibleRoutes(CAFEPOS_ROUTES, {
        user: null,
        isAuthenticated: false
      });

      expect(accessibleRoutes.length).toBe(0);
    });
  });

  describe('Access Logging', () => {
    it('should log access attempts when logAccess is true', () => {
      const routeConfig = {
        path: '/test',
        component: 'TestComponent',
        requiredPermissions: ['menu.view' as const]
      };

      RouteAccessManager.hasRouteAccess(routeConfig, {
        user: mockUsers.cashier,
        isAuthenticated: true,
        logAccess: true
      });

      const accessLog = RouteAccessManager.getAccessLog();
      expect(accessLog.length).toBe(1);
      expect(accessLog[0].userId).toBe(mockUsers.cashier.id);
      expect(accessLog[0].route).toBe('/test');
      expect(accessLog[0].action).toBe('allowed');
    });

    it('should not log access attempts when logAccess is false', () => {
      const routeConfig = {
        path: '/test',
        component: 'TestComponent',
        requiredPermissions: ['menu.view' as const]
      };

      RouteAccessManager.hasRouteAccess(routeConfig, {
        user: mockUsers.cashier,
        isAuthenticated: true,
        logAccess: false
      });

      const accessLog = RouteAccessManager.getAccessLog();
      expect(accessLog.length).toBe(0);
    });

    it('should log denied access attempts', () => {
      const routeConfig = {
        path: '/admin',
        component: 'AdminPanel',
        requiredPermissions: ['system.maintenance' as const]
      };

      RouteAccessManager.hasRouteAccess(routeConfig, {
        user: mockUsers.cashier,
        isAuthenticated: true,
        logAccess: true
      });

      const accessLog = RouteAccessManager.getAccessLog();
      expect(accessLog.length).toBe(1);
      expect(accessLog[0].action).toBe('denied');
      expect(accessLog[0].reason).toContain('Missing required permissions');
    });

    it('should return denied attempts for specific user', () => {
      const routeConfig = {
        path: '/admin',
        component: 'AdminPanel',
        requiredPermissions: ['system.maintenance' as const]
      };

      // Create a denied attempt
      RouteAccessManager.hasRouteAccess(routeConfig, {
        user: mockUsers.cashier,
        isAuthenticated: true,
        logAccess: true
      });

      const deniedAttempts = RouteAccessManager.getDeniedAttempts(mockUsers.cashier.id);
      expect(deniedAttempts.length).toBe(1);
      expect(deniedAttempts[0].action).toBe('denied');
    });

    it('should clear access log', () => {
      const routeConfig = {
        path: '/test',
        component: 'TestComponent'
      };

      // Create log entry
      RouteAccessManager.hasRouteAccess(routeConfig, {
        user: mockUsers.cashier,
        isAuthenticated: true,
        logAccess: true
      });

      expect(RouteAccessManager.getAccessLog().length).toBe(1);

      RouteAccessManager.clearAccessLog();
      expect(RouteAccessManager.getAccessLog().length).toBe(0);
    });
  });

  describe('Utility Functions', () => {
    describe('canAccessAdmin', () => {
      it('should return true for users with admin permissions', () => {
        expect(canAccessAdmin(mockUsers.admin)).toBe(true);
        expect(canAccessAdmin(mockUsers.manager)).toBe(true);
      });

      it('should return false for users without admin permissions', () => {
        expect(canAccessAdmin(mockUsers.trainee)).toBe(false);
      });

      it('should return false for null or inactive users', () => {
        expect(canAccessAdmin(null)).toBe(false);
        expect(canAccessAdmin(mockUsers.inactive)).toBe(false);
      });
    });

    describe('canProcessSales', () => {
      it('should return true for users with sales.process permission', () => {
        expect(canProcessSales(mockUsers.cashier)).toBe(true);
        expect(canProcessSales(mockUsers.admin)).toBe(true);
      });

      it('should return true for trainee users', () => {
        expect(canProcessSales(mockUsers.trainee)).toBe(true);
      });

      it('should return false for null or inactive users', () => {
        expect(canProcessSales(null)).toBe(false);
        expect(canProcessSales(mockUsers.inactive)).toBe(false);
      });
    });

    describe('canManageInventory', () => {
      it('should return true for users with inventory management permissions', () => {
        expect(canManageInventory(mockUsers.admin)).toBe(true);
        expect(canManageInventory(mockUsers.manager)).toBe(true);
      });

      it('should return false for users without inventory permissions', () => {
        expect(canManageInventory(mockUsers.cashier)).toBe(false);
        expect(canManageInventory(mockUsers.trainee)).toBe(false);
      });

      it('should return false for null or inactive users', () => {
        expect(canManageInventory(null)).toBe(false);
        expect(canManageInventory(mockUsers.inactive)).toBe(false);
      });
    });

    describe('getUserDashboardRoutes', () => {
      it('should return appropriate routes for different user roles', () => {
        const adminRoutes = getUserDashboardRoutes(mockUsers.admin);
        const traineeRoutes = getUserDashboardRoutes(mockUsers.trainee);

        expect(adminRoutes.length).toBeGreaterThan(traineeRoutes.length);

        // Admin should have admin routes
        const adminRoute = adminRoutes.find(route => route.path === '/admin');
        expect(adminRoute).toBeDefined();

        // Trainee should not have admin routes
        const traineeAdminRoute = traineeRoutes.find(route => route.path === '/admin');
        expect(traineeAdminRoute).toBeUndefined();
      });

      it('should return empty array for null user', () => {
        const routes = getUserDashboardRoutes(null);
        expect(routes).toEqual([]);
      });
    });
  });

  describe('createRouteMiddleware', () => {
    it('should create middleware function that checks route access', () => {
      const routeConfig = {
        path: '/test',
        component: 'TestComponent',
        requiredPermissions: ['menu.view' as const]
      };

      const middleware = createRouteMiddleware(routeConfig);
      const result = middleware({
        user: mockUsers.cashier,
        isAuthenticated: true
      });

      expect(result.hasAccess).toBe(true);
    });
  });
});