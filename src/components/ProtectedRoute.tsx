import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Permission } from '../types/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: Permission[];
  requireAll?: boolean; // If true, user must have ALL permissions. If false, user needs ANY permission
  fallback?: ReactNode;
  showError?: boolean;
}

const ProtectedRoute = ({
  children,
  requiredPermissions = [],
  requireAll = false,
  fallback,
  showError = true
}: ProtectedRouteProps): React.ReactElement | null => {
  const { user, hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  // If no permissions required, just check if user is authenticated
  if (requiredPermissions.length === 0) {
    return user ? <>{children}</> : (fallback ? <>{fallback}</> : null);
  }

  // Check permissions
  const hasAccess = requireAll 
    ? hasAllPermissions(requiredPermissions)
    : hasAnyPermission(requiredPermissions);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h3>
            <p className="text-red-600 text-sm mb-4">
              You don't have the required permissions to access this feature.
            </p>
            <div className="text-xs text-red-500">
              <p>Required permissions:</p>
              <ul className="mt-1 space-y-1">
                {requiredPermissions.map(permission => (
                  <li key={permission} className="font-mono bg-red-100 px-2 py-1 rounded">
                    {permission}
                  </li>
                ))}
              </ul>
              <p className="mt-2">
                Current role: <span className="font-semibold">{user?.role || 'None'}</span>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;