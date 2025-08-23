export type UserRole = 'admin' | 'manager' | 'cashier' | 'trainee';

export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
  pinCode?: string;
  shiftStartTime?: Date;
  shiftEndTime?: Date;
}

export type Permission = 
  // Menu Management
  | 'menu.view'
  | 'menu.create'
  | 'menu.edit'
  | 'menu.delete'
  | 'menu.import'
  
  // Inventory Management
  | 'inventory.view'
  | 'inventory.edit'
  | 'inventory.adjust_stock'
  | 'inventory.export'
  | 'inventory.view_costs'
  
  // Sales & Orders
  | 'sales.process'
  | 'sales.refund'
  | 'sales.view_history'
  | 'sales.apply_discount'
  | 'sales.override_price'
  
  // Receipts
  | 'receipts.print'
  | 'receipts.reprint'
  | 'receipts.email'
  
  // Reporting
  | 'reports.view'
  | 'reports.export'
  | 'reports.financial'
  
  // User Management
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'users.reset_password'
  
  // System Administration
  | 'system.settings'
  | 'system.backup'
  | 'system.logs'
  | 'system.maintenance';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  failedAttempts: number;
  lockoutUntil: Date | null;
  lastActivity: Date | null;
  sessionExpiry: Date | null;
}

export interface LoginCredentials {
  username?: string;
  password?: string;
  pinCode?: string;
  rememberMe?: boolean;
}

export interface AuthConfiguration {
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
  sessionTimeoutMinutes: number;
  pinLength: number;
  requireStrongPasswords: boolean;
}

export interface ShiftSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  cashDrawerStart: number;
  cashDrawerEnd?: number;
  totalSales?: number;
  transactionCount?: number;
  status: 'active' | 'completed' | 'abandoned';
}

// Role-based permission sets
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // Full access to everything
    'menu.view', 'menu.create', 'menu.edit', 'menu.delete', 'menu.import',
    'inventory.view', 'inventory.edit', 'inventory.adjust_stock', 'inventory.export', 'inventory.view_costs',
    'sales.process', 'sales.refund', 'sales.view_history', 'sales.apply_discount', 'sales.override_price',
    'receipts.print', 'receipts.reprint', 'receipts.email',
    'reports.view', 'reports.export', 'reports.financial',
    'users.view', 'users.create', 'users.edit', 'users.delete', 'users.reset_password',
    'system.settings', 'system.backup', 'system.logs', 'system.maintenance'
  ],
  
  manager: [
    // Management level access
    'menu.view', 'menu.create', 'menu.edit', 'menu.delete', 'menu.import',
    'inventory.view', 'inventory.edit', 'inventory.adjust_stock', 'inventory.export', 'inventory.view_costs',
    'sales.process', 'sales.refund', 'sales.view_history', 'sales.apply_discount', 'sales.override_price',
    'receipts.print', 'receipts.reprint', 'receipts.email',
    'reports.view', 'reports.export', 'reports.financial',
    'users.view', 'users.edit',
    'system.settings'
  ],
  
  cashier: [
    // Standard cashier access
    'menu.view',
    'inventory.view',
    'sales.process', 'sales.apply_discount', 'sales.view_history',
    'receipts.print', 'receipts.reprint',
    'reports.view'
  ],
  
  trainee: [
    // Limited access for trainees
    'menu.view',
    'inventory.view',
    'sales.process',
    'receipts.print'
  ]
};

// Helper functions
export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user || !user.isActive) return false;
  return user.permissions.includes(permission);
};

export const hasAnyPermission = (user: User | null, permissions: Permission[]): boolean => {
  if (!user || !user.isActive) return false;
  return permissions.some(permission => user.permissions.includes(permission));
};

export const hasAllPermissions = (user: User | null, permissions: Permission[]): boolean => {
  if (!user || !user.isActive) return false;
  return permissions.every(permission => user.permissions.includes(permission));
};

export const canAccessRoute = (user: User | null, requiredPermissions: Permission[]): boolean => {
  if (!user || !user.isActive) return false;
  return hasAnyPermission(user, requiredPermissions);
};

export const getUserPermissions = (role: UserRole): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'admin';
};

export const isManager = (user: User | null): boolean => {
  return user?.role === 'manager' || isAdmin(user);
};

export const canManageUsers = (user: User | null): boolean => {
  return hasAnyPermission(user, ['users.view', 'users.create', 'users.edit']);
};

export const canManageInventory = (user: User | null): boolean => {
  return hasAnyPermission(user, ['inventory.edit', 'inventory.adjust_stock']);
};

export const canViewReports = (user: User | null): boolean => {
  return hasPermission(user, 'reports.view');
};

export const canProcessRefunds = (user: User | null): boolean => {
  return hasPermission(user, 'sales.refund');
};

// Authentication configuration
export const DEFAULT_AUTH_CONFIG: AuthConfiguration = {
  maxFailedAttempts: 3,
  lockoutDurationMinutes: 15,
  sessionTimeoutMinutes: 480, // 8 hours
  pinLength: 4,
  requireStrongPasswords: false
};