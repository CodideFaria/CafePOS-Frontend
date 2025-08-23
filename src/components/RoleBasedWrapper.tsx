import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Permission, UserRole } from '../types/auth';

interface RoleBasedWrapperProps {
  children: ReactNode;
  
  // Permission-based access
  requiredPermissions?: Permission[];
  requireAllPermissions?: boolean; // If true, user must have ALL permissions. If false, user needs ANY permission
  
  // Role-based access (alternative to permissions)
  allowedRoles?: UserRole[];
  
  // Fallback content when access is denied
  fallback?: ReactNode;
  
  // Whether to show error message or just hide content
  showError?: boolean;
  
  // Custom error message
  errorMessage?: string;
  
  // Custom validation function
  customValidator?: (user: any) => boolean;
  
  // Inverse logic - hide content if user HAS these permissions/roles
  inverse?: boolean;
}

/**
 * RoleBasedWrapper - A flexible component for implementing role-based access control
 * 
 * This component wraps other components and conditionally renders them based on:
 * - User permissions
 * - User roles
 * - Custom validation logic
 * 
 * Examples:
 * 
 * // Show only to users with specific permissions
 * <RoleBasedWrapper requiredPermissions={['menu.edit', 'menu.delete']}>
 *   <MenuEditButton />
 * </RoleBasedWrapper>
 * 
 * // Show only to admin and manager roles
 * <RoleBasedWrapper allowedRoles={['admin', 'manager']}>
 *   <AdminPanel />
 * </RoleBasedWrapper>
 * 
 * // Hide from trainee users
 * <RoleBasedWrapper allowedRoles={['trainee']} inverse={true}>
 *   <AdvancedFeatures />
 * </RoleBasedWrapper>
 * 
 * // Custom validation with fallback
 * <RoleBasedWrapper 
 *   customValidator={(user) => user.shiftStartTime && !user.shiftEndTime}
 *   fallback={<div>Please clock in to access this feature</div>}
 * >
 *   <CashierTools />
 * </RoleBasedWrapper>
 */
const RoleBasedWrapper: React.FC<RoleBasedWrapperProps> = ({
  children,
  requiredPermissions = [],
  requireAllPermissions = false,
  allowedRoles = [],
  fallback,
  showError = false,
  errorMessage,
  customValidator,
  inverse = false
}) => {
  const { user, hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  // If no user is authenticated, deny access
  if (!user || !user.isActive) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return showError ? (
      <div className="flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-red-600 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-800 font-semibold">Authentication Required</p>
          <p className="text-red-600 text-sm">Please log in to access this feature</p>
        </div>
      </div>
    ) : null;
  }

  let hasAccess = false;

  // Check custom validator first
  if (customValidator) {
    hasAccess = customValidator(user);
  } 
  // Check role-based access
  else if (allowedRoles.length > 0) {
    hasAccess = allowedRoles.includes(user.role);
  }
  // Check permission-based access
  else if (requiredPermissions.length > 0) {
    hasAccess = requireAllPermissions 
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);
  }
  // If no restrictions specified, allow access
  else {
    hasAccess = true;
  }

  // Apply inverse logic if specified
  if (inverse) {
    hasAccess = !hasAccess;
  }

  // If access is denied
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h3>
            <p className="text-red-600 text-sm mb-4">
              {errorMessage || "You don't have the required permissions to access this feature."}
            </p>
            <div className="text-xs text-red-500 bg-red-100 p-3 rounded">
              <p className="font-semibold mb-2">Access Requirements:</p>
              {requiredPermissions.length > 0 && (
                <div className="mb-2">
                  <p className="mb-1">Required permissions {requireAllPermissions ? '(ALL)' : '(ANY)'}:</p>
                  <div className="space-y-1">
                    {requiredPermissions.map(permission => (
                      <div key={permission} className="flex items-center justify-between text-xs">
                        <span className="font-mono bg-red-200 px-2 py-1 rounded">
                          {permission}
                        </span>
                        <span className={`ml-2 ${hasPermission(permission) ? 'text-green-600' : 'text-red-600'}`}>
                          {hasPermission(permission) ? '✓' : '✗'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {allowedRoles.length > 0 && (
                <div className="mb-2">
                  <p className="mb-1">Allowed roles:</p>
                  <div className="flex flex-wrap gap-1">
                    {allowedRoles.map(role => (
                      <span key={role} className="font-mono bg-red-200 px-2 py-1 rounded text-xs">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <p className="mt-2 pt-2 border-t border-red-300">
                Your role: <span className="font-semibold">{user.role}</span>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  // Access granted - render children
  return <>{children}</>;
};

export default RoleBasedWrapper;