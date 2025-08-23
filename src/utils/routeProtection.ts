import { Permission, User, hasPermission, hasAnyPermission, hasAllPermissions } from '../types/auth';

export interface RouteConfig {
  path: string;
  component: string;
  requiredPermissions?: Permission[];
  requireAllPermissions?: boolean;
  allowedRoles?: string[];
  description?: string;
}

export interface RouteMiddlewareOptions {
  user: User | null;
  isAuthenticated: boolean;
  logAccess?: boolean;
}

export class RouteAccessManager {
  private static accessLog: Array<{
    timestamp: Date;
    userId: string;
    route: string;
    action: 'allowed' | 'denied';
    reason: string;
  }> = [];

  /**
   * Check if user has access to a specific route configuration
   */
  static hasRouteAccess(
    routeConfig: RouteConfig,
    options: RouteMiddlewareOptions
  ): { hasAccess: boolean; reason: string } {
    const { user, isAuthenticated, logAccess = true } = options;
    
    // Check authentication first
    if (!isAuthenticated || !user || !user.isActive) {
      const reason = 'User not authenticated or inactive';
      if (logAccess) {
        this.logAccess(user?.id || 'anonymous', routeConfig.path, 'denied', reason);
      }
      return { hasAccess: false, reason };
    }

    // Check role-based access if specified
    if (routeConfig.allowedRoles && routeConfig.allowedRoles.length > 0) {
      const hasRoleAccess = routeConfig.allowedRoles.includes(user.role);
      if (!hasRoleAccess) {
        const reason = `User role '${user.role}' not in allowed roles: ${routeConfig.allowedRoles.join(', ')}`;
        if (logAccess) {
          this.logAccess(user.id, routeConfig.path, 'denied', reason);
        }
        return { hasAccess: false, reason };
      }
    }

    // Check permission-based access if specified
    if (routeConfig.requiredPermissions && routeConfig.requiredPermissions.length > 0) {
      const hasPermissionAccess = routeConfig.requireAllPermissions
        ? hasAllPermissions(user, routeConfig.requiredPermissions)
        : hasAnyPermission(user, routeConfig.requiredPermissions);
        
      if (!hasPermissionAccess) {
        const missingPermissions = routeConfig.requiredPermissions.filter(
          permission => !hasPermission(user, permission)
        );
        const reason = `Missing required permissions: ${missingPermissions.join(', ')}`;
        if (logAccess) {
          this.logAccess(user.id, routeConfig.path, 'denied', reason);
        }
        return { hasAccess: false, reason };
      }
    }

    // Access granted
    const reason = 'Access granted';
    if (logAccess) {
      this.logAccess(user.id, routeConfig.path, 'allowed', reason);
    }
    return { hasAccess: true, reason };
  }

  /**
   * Get accessible routes for a user
   */
  static getAccessibleRoutes(
    routes: RouteConfig[],
    options: RouteMiddlewareOptions
  ): RouteConfig[] {
    return routes.filter(route => 
      this.hasRouteAccess(route, { ...options, logAccess: false }).hasAccess
    );
  }

  /**
   * Log access attempt
   */
  private static logAccess(
    userId: string,
    route: string,
    action: 'allowed' | 'denied',
    reason: string
  ): void {
    this.accessLog.push({
      timestamp: new Date(),
      userId,
      route,
      action,
      reason
    });

    // Keep only last 1000 entries to prevent memory issues
    if (this.accessLog.length > 1000) {
      this.accessLog = this.accessLog.slice(-1000);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Route Access: ${action.toUpperCase()} - User ${userId} attempting to access ${route}. Reason: ${reason}`);
    }
  }

  /**
   * Get access log (for debugging/audit purposes)
   */
  static getAccessLog(): typeof RouteAccessManager.accessLog {
    return [...this.accessLog];
  }

  /**
   * Get denied access attempts for a user
   */
  static getDeniedAttempts(userId: string): typeof RouteAccessManager.accessLog {
    return this.accessLog.filter(
      entry => entry.userId === userId && entry.action === 'denied'
    );
  }

  /**
   * Clear access log
   */
  static clearAccessLog(): void {
    this.accessLog = [];
  }
}

// Predefined route configurations for the CafePOS system
export const CAFEPOS_ROUTES: RouteConfig[] = [
  {
    path: '/menu',
    component: 'ProductMenu',
    requiredPermissions: ['menu.view'],
    description: 'View menu items for ordering'
  },
  {
    path: '/cart',
    component: 'Cart',
    requiredPermissions: ['sales.process'],
    description: 'Shopping cart for current order'
  },
  {
    path: '/checkout',
    component: 'Checkout', 
    requiredPermissions: ['sales.process'],
    description: 'Process payment for orders'
  },
  {
    path: '/admin',
    component: 'AdminPanel',
    requiredPermissions: ['menu.view', 'inventory.view', 'system.settings'],
    requireAllPermissions: false,
    description: 'Administrative functions'
  },
  {
    path: '/admin/menu',
    component: 'MenuManagement',
    requiredPermissions: ['menu.view'],
    description: 'Manage menu items'
  },
  {
    path: '/admin/inventory',
    component: 'InventoryManagement',
    requiredPermissions: ['inventory.view'],
    description: 'Manage inventory and stock'
  },
  {
    path: '/admin/import',
    component: 'CSVImport',
    requiredPermissions: ['menu.import'],
    description: 'Bulk import menu items'
  },
  {
    path: '/orders/history',
    component: 'OrderHistory',
    requiredPermissions: ['sales.view_history'],
    description: 'View order history'
  },
  {
    path: '/receipts/reprint',
    component: 'ReceiptReprint',
    requiredPermissions: ['receipts.reprint'],
    description: 'Reprint previous receipts'
  },
  {
    path: '/discounts',
    component: 'DiscountModal',
    requiredPermissions: ['sales.apply_discount'],
    description: 'Apply discounts to orders'
  }
];

/**
 * Higher-order function to create route middleware
 */
export const createRouteMiddleware = (routeConfig: RouteConfig) => {
  return (options: RouteMiddlewareOptions) => {
    return RouteAccessManager.hasRouteAccess(routeConfig, options);
  };
};

/**
 * Utility to check if current user can access admin features
 */
export const canAccessAdmin = (user: User | null): boolean => {
  if (!user || !user.isActive) return false;
  return hasAnyPermission(user, ['menu.view', 'inventory.view', 'system.settings']);
};

/**
 * Utility to check if current user can process sales
 */
export const canProcessSales = (user: User | null): boolean => {
  if (!user || !user.isActive) return false;
  return hasPermission(user, 'sales.process');
};

/**
 * Utility to check if current user can manage inventory
 */
export const canManageInventory = (user: User | null): boolean => {
  if (!user || !user.isActive) return false;
  return hasAnyPermission(user, ['inventory.edit', 'inventory.adjust_stock']);
};

/**
 * Get user's dashboard routes based on permissions
 */
export const getUserDashboardRoutes = (user: User | null): RouteConfig[] => {
  if (!user) return [];
  
  return CAFEPOS_ROUTES.filter(route => {
    const access = RouteAccessManager.hasRouteAccess(route, {
      user,
      isAuthenticated: true,
      logAccess: false
    });
    return access.hasAccess;
  });
};