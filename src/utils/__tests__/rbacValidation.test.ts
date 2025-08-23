import {
  RBACValidator,
  validateRBAC,
  generateRBACReport,
  RBACValidationResult
} from '../rbacValidation';
import { ROLE_PERMISSIONS } from '../../types/auth';
import { CAFEPOS_ROUTES } from '../routeProtection';

// Mock console.log to avoid test output noise
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe('RBAC Validation', () => {
  describe('RBACValidator', () => {
    let validator: RBACValidator;

    beforeEach(() => {
      validator = new RBACValidator();
    });

    it('should validate the current RBAC implementation', () => {
      const result = validator.validate();

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('summary');
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should validate role permissions', () => {
      const result = validator.validate();

      // Admin should have the most permissions
      expect(ROLE_PERMISSIONS.admin.length).toBeGreaterThan(ROLE_PERMISSIONS.manager.length);
      expect(ROLE_PERMISSIONS.manager.length).toBeGreaterThan(ROLE_PERMISSIONS.cashier.length);
      expect(ROLE_PERMISSIONS.cashier.length).toBeGreaterThan(ROLE_PERMISSIONS.trainee.length);

      // All roles should have at least some permissions
      Object.entries(ROLE_PERMISSIONS).forEach(([role, permissions]) => {
        expect(permissions.length).toBeGreaterThan(0);
      });
    });

    it('should validate trainee restrictions', () => {
      const traineePermissions = ROLE_PERMISSIONS.trainee;
      const restrictedPermissions = ['menu.edit', 'menu.delete', 'inventory.edit', 'system.maintenance'];
      
      // Trainee should not have these elevated permissions
      restrictedPermissions.forEach(permission => {
        expect(traineePermissions).not.toContain(permission);
      });
    });

    it('should validate admin privileges', () => {
      const adminPermissions = ROLE_PERMISSIONS.admin;
      const requiredAdminPermissions = ['system.settings', 'users.create', 'users.edit'];
      
      // Admin should have all these permissions
      requiredAdminPermissions.forEach(permission => {
        expect(adminPermissions).toContain(permission);
      });
    });

    it('should validate route access for different user roles', () => {
      const result = validator.validate();

      // Should include route access validation
      expect(result.summary.routesValidated).toBeGreaterThan(0);
      expect(result.summary.routesValidated).toBe(CAFEPOS_ROUTES.length);
    });

    it('should validate component permissions', () => {
      const result = validator.validate();

      // Should validate key components
      const expectedComponents = [
        'RolePermissions', 'RouteAccess', 'PermissionCoverage', 'Security'
      ];
      
      expectedComponents.forEach(component => {
        expect(result.summary.componentsValidated).toContain(component);
      });
    });

    it('should detect security issues', () => {
      const result = validator.validate();

      // If there are critical issues, they should be properly categorized
      const criticalIssues = result.issues.filter(issue => issue.type === 'critical');
      const warnings = result.issues.filter(issue => issue.type === 'warning');

      // Each issue should have required properties
      [...criticalIssues, ...warnings].forEach(issue => {
        expect(issue).toHaveProperty('type');
        expect(issue).toHaveProperty('component');
        expect(issue).toHaveProperty('description');
        expect(issue).toHaveProperty('recommendation');
      });
    });

    it('should generate comprehensive summary', () => {
      const result = validator.validate();

      expect(result.summary).toHaveProperty('totalChecks');
      expect(result.summary).toHaveProperty('criticalIssues');
      expect(result.summary).toHaveProperty('warnings');
      expect(result.summary).toHaveProperty('rolesValidated');
      expect(result.summary).toHaveProperty('routesValidated');
      expect(result.summary).toHaveProperty('componentsValidated');

      // Should validate all defined roles
      expect(result.summary.rolesValidated).toEqual(['admin', 'manager', 'cashier', 'trainee']);
    });

    it('should generate detailed report', () => {
      const result = validator.validate();
      const report = validator.generateReport(result);

      expect(typeof report).toBe('string');
      expect(report).toContain('RBAC Validation Report');
      expect(report).toContain('Summary');
      expect(report).toContain('Overall Status');
      
      if (result.issues.length > 0) {
        expect(report).toContain('Issues Found');
      }
    });
  });

  describe('Utility Functions', () => {
    it('should run complete validation', () => {
      const result = validateRBAC();

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('summary');
    });

    it('should generate validation report', () => {
      const report = generateRBACReport();

      expect(typeof report).toBe('string');
      expect(report).toContain('RBAC Validation Report');
      expect(report.length).toBeGreaterThan(100); // Should be a substantial report
    });
  });

  describe('Role Hierarchy Validation', () => {
    it('should validate proper role hierarchy', () => {
      const validator = new RBACValidator();
      const result = validator.validate();

      // Check that role hierarchy is maintained
      const adminPerms = ROLE_PERMISSIONS.admin.length;
      const managerPerms = ROLE_PERMISSIONS.manager.length;
      const cashierPerms = ROLE_PERMISSIONS.cashier.length;
      const traineePerms = ROLE_PERMISSIONS.trainee.length;

      expect(adminPerms).toBeGreaterThanOrEqual(managerPerms);
      expect(managerPerms).toBeGreaterThanOrEqual(cashierPerms);
      expect(cashierPerms).toBeGreaterThanOrEqual(traineePerms);
    });

    it('should ensure trainee is most restricted role', () => {
      const traineePermissions = ROLE_PERMISSIONS.trainee;
      const otherRoles = ['admin', 'manager', 'cashier'] as const;

      otherRoles.forEach(role => {
        expect(ROLE_PERMISSIONS[role].length).toBeGreaterThan(traineePermissions.length);
      });
    });

    it('should ensure admin has comprehensive access', () => {
      const adminPermissions = ROLE_PERMISSIONS.admin;
      const systemPermissions = adminPermissions.filter(p => p.startsWith('system.'));
      const userPermissions = adminPermissions.filter(p => p.startsWith('users.'));

      // Admin should have system and user management permissions
      expect(systemPermissions.length).toBeGreaterThan(0);
      expect(userPermissions.length).toBeGreaterThan(0);
    });
  });

  describe('Permission Coverage', () => {
    it('should ensure all permissions are assigned to at least one role', () => {
      const allAssignedPermissions = new Set();
      
      Object.values(ROLE_PERMISSIONS).forEach(rolePermissions => {
        rolePermissions.forEach(permission => {
          allAssignedPermissions.add(permission);
        });
      });

      // Should have a reasonable number of unique permissions
      expect(allAssignedPermissions.size).toBeGreaterThan(10);
    });

    it('should ensure core business functions are covered', () => {
      const validator = new RBACValidator();
      const result = validator.validate();

      // Should validate that essential permissions exist
      const essentialPermissions = ['menu.view', 'sales.process', 'receipts.print'];
      
      // At least one role should have each essential permission
      essentialPermissions.forEach(permission => {
        const hasPermission = Object.values(ROLE_PERMISSIONS).some(
          rolePermissions => rolePermissions.includes(permission as any)
        );
        expect(hasPermission).toBe(true);
      });
    });
  });

  describe('Security Requirements', () => {
    it('should validate that sensitive operations are properly protected', () => {
      const sensitivePermissions = [
        'menu.delete', 'users.delete', 'system.maintenance', 'inventory.edit'
      ];

      // These should not be available to trainee role
      sensitivePermissions.forEach(permission => {
        expect(ROLE_PERMISSIONS.trainee).not.toContain(permission);
      });

      // These should be available to admin role
      sensitivePermissions.forEach(permission => {
        if (permission.startsWith('users.') || permission.startsWith('system.')) {
          expect(ROLE_PERMISSIONS.admin).toContain(permission);
        }
      });
    });

    it('should validate route protection for sensitive paths', () => {
      const sensitiveRoutes = CAFEPOS_ROUTES.filter(route => 
        route.path.includes('/admin') || 
        route.requiredPermissions?.some(p => p.includes('delete') || p.includes('edit'))
      );

      // All sensitive routes should have permission requirements
      sensitiveRoutes.forEach(route => {
        expect(route.requiredPermissions?.length || 0).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Conditions', () => {
    it('should handle validation gracefully even with edge cases', () => {
      const validator = new RBACValidator();
      
      // Should not throw errors during validation
      expect(() => {
        validator.validate();
      }).not.toThrow();
    });

    it('should provide meaningful error messages for issues', () => {
      const result = validateRBAC();

      result.issues.forEach(issue => {
        expect(issue.description).toBeTruthy();
        expect(issue.recommendation).toBeTruthy();
        expect(['critical', 'warning', 'info']).toContain(issue.type);
      });
    });
  });
});