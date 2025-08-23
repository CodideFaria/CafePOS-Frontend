import React, { ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth, MOCK_USERS } from '../AuthContext';
import { DEFAULT_AUTH_CONFIG } from '../../types/auth';
import { networkAdapter } from '../../network/NetworkAdapter';

// Mock NetworkAdapter
jest.mock('../../network/NetworkAdapter', () => ({
  networkAdapter: {
    authenticate: jest.fn(),
    logout: jest.fn().mockResolvedValue({})
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Helper to create wrapper
const createWrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    localStorageMock.clear();
  });

  describe('Lockout Protection', () => {
    it('should lockout user after maximum failed attempts', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper });
      
      // Simulate failed login attempts
      for (let i = 0; i < DEFAULT_AUTH_CONFIG.maxFailedAttempts; i++) {
        try {
          await act(async () => {
            await result.current.login({ pinCode: 'wrong' });
          });
        } catch (error) {
          // Expected to fail
        }
      }

      expect(result.current.failedAttempts).toBe(DEFAULT_AUTH_CONFIG.maxFailedAttempts);
      expect(result.current.lockoutUntil).toBeTruthy();
      expect(result.current.lockoutUntil! > new Date()).toBe(true);
    });

    it('should prevent login when locked out', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper });

      // Set lockout state
      const futureTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      
      // Trigger lockout by failing attempts
      for (let i = 0; i < DEFAULT_AUTH_CONFIG.maxFailedAttempts; i++) {
        try {
          await act(async () => {
            await result.current.login({ pinCode: 'wrong' });
          });
        } catch (error) {
          // Expected to fail
        }
      }

      // Now try to login with correct credentials
      await expect(act(async () => {
        await result.current.login({ pinCode: '1234' });
      })).rejects.toThrow(/Account locked/);
    });

    it('should clear lockout after expiration time', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper });

      // Trigger lockout
      for (let i = 0; i < DEFAULT_AUTH_CONFIG.maxFailedAttempts; i++) {
        try {
          await act(async () => {
            await result.current.login({ pinCode: 'wrong' });
          });
        } catch (error) {
          // Expected to fail
        }
      }

      expect(result.current.lockoutUntil).toBeTruthy();

      // Fast-forward time past lockout duration
      act(() => {
        jest.advanceTimersByTime((DEFAULT_AUTH_CONFIG.lockoutDurationMinutes + 1) * 60 * 1000);
      });

      // Should be able to login now
      await act(async () => {
        await result.current.login({ pinCode: '1234' });
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.failedAttempts).toBe(0);
      expect(result.current.lockoutUntil).toBeNull();
    });

    it('should persist lockout state across browser sessions', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper });
      
      // Mock localStorage to simulate existing lockout state
      const lockoutTime = new Date(Date.now() + 10 * 60 * 1000);
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'cafepos_auth_state') {
          return JSON.stringify({
            failedAttempts: 3,
            lockoutUntil: lockoutTime.toISOString(),
            lastActivity: null,
            sessionExpiry: null
          });
        }
        return null;
      });

      // Re-render to trigger useEffect
      const { result: newResult } = renderHook(() => useAuth(), { wrapper: createWrapper });

      expect(newResult.current.lockoutUntil).toBeTruthy();
    });
  });

  describe('Session Management', () => {
    it('should create session with expiry time on login', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper });

      await act(async () => {
        await result.current.login({ pinCode: '1234' });
      });

      expect(result.current.sessionExpiry).toBeTruthy();
      expect(result.current.lastActivity).toBeTruthy();
      
      const expectedExpiry = new Date(Date.now() + DEFAULT_AUTH_CONFIG.sessionTimeoutMinutes * 60 * 1000);
      const actualExpiry = new Date(result.current.sessionExpiry!);
      
      // Allow 1 second tolerance
      expect(Math.abs(actualExpiry.getTime() - expectedExpiry.getTime())).toBeLessThan(1000);
    });

    it('should expire session after timeout', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper });

      await act(async () => {
        await result.current.login({ pinCode: '1234' });
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Fast-forward past session timeout
      act(() => {
        jest.advanceTimersByTime((DEFAULT_AUTH_CONFIG.sessionTimeoutMinutes + 1) * 60 * 1000);
      });

      // The session check runs every minute, so advance a bit more
      act(() => {
        jest.advanceTimersByTime(60 * 1000);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toContain('Session expired');
    });

    it('should extend session on activity update', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper });

      await act(async () => {
        await result.current.login({ pinCode: '1234' });
      });

      const initialExpiry = result.current.sessionExpiry;

      // Advance time slightly
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000); // 5 minutes
      });

      // Update activity
      act(() => {
        result.current.updateActivity();
      });

      expect(result.current.sessionExpiry).toBeTruthy();
      expect(new Date(result.current.sessionExpiry!) > new Date(initialExpiry!)).toBe(true);
    });

    it('should restore valid session from localStorage', () => {
      const user = MOCK_USERS[0];
      const sessionExpiry = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours from now
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'cafepos_user') {
          return JSON.stringify(user);
        }
        if (key === 'cafepos_auth_state') {
          return JSON.stringify({
            failedAttempts: 0,
            lockoutUntil: null,
            lastActivity: new Date().toISOString(),
            sessionExpiry: sessionExpiry.toISOString()
          });
        }
        return null;
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.id).toBe(user.id);
    });

    it('should reject expired session from localStorage', () => {
      const user = MOCK_USERS[0];
      const expiredSessionExpiry = new Date(Date.now() - 60 * 1000); // 1 minute ago
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'cafepos_user') {
          return JSON.stringify(user);
        }
        if (key === 'cafepos_auth_state') {
          return JSON.stringify({
            failedAttempts: 0,
            lockoutUntil: null,
            lastActivity: new Date().toISOString(),
            sessionExpiry: expiredSessionExpiry.toISOString()
          });
        }
        return null;
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toContain('Session expired');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('cafepos_user');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('cafepos_auth_state');
    });
  });

  describe('PIN Security', () => {
    it('should only accept 4-digit PIN codes', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper });

      // Test correct PIN
      await act(async () => {
        await result.current.login({ pinCode: '1234' });
      });
      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      // Test invalid PIN lengths (should fail)
      const invalidPins = ['123', '12345', '', 'abc1'];
      
      for (const pin of invalidPins) {
        try {
          await act(async () => {
            await result.current.login({ pinCode: pin });
          });
          // If we get here, the login shouldn't have succeeded for invalid PINs
          if (pin !== '123' && pin !== '12345' && pin !== '' && pin !== 'abc1') {
            expect(result.current.isAuthenticated).toBe(true);
          } else {
            expect(result.current.isAuthenticated).toBe(false);
          }
        } catch (error) {
          // Expected for invalid PINs
          expect(result.current.isAuthenticated).toBe(false);
        }
      }
    });

    it('should not expose PIN codes in any form', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper });

      await act(async () => {
        await result.current.login({ pinCode: '1234' });
      });

      // Check that PIN is not stored in user object or state
      expect(result.current.user?.pinCode).toBeTruthy(); // PIN exists for mock user
      expect(JSON.stringify(result.current)).not.toContain('1234'); // But input PIN not stored
    });

    it('should validate PIN against user database', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper });

      // Test each user's PIN
      for (const user of MOCK_USERS) {
        await act(async () => {
          await result.current.login({ pinCode: user.pinCode });
        });
        
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user?.id).toBe(user.id);
        
        act(() => {
          result.current.logout();
        });
      }
    });
  });

  describe('User State Security', () => {
    it('should only allow admin users to switch users', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper });

      // Login as non-admin user
      await act(async () => {
        await result.current.login({ pinCode: '3456' }); // Cashier
      });

      expect(result.current.user?.role).toBe('cashier');

      // Try to switch to admin user (should fail)
      const adminUser = MOCK_USERS.find(u => u.role === 'admin')!;
      
      expect(() => {
        act(() => {
          result.current.switchUser(adminUser);
        });
      }).toThrow('Insufficient permissions to switch users');
    });

    it('should allow admin users to switch users', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper });

      // Login as admin
      await act(async () => {
        await result.current.login({ pinCode: '1234' }); // Admin
      });

      expect(result.current.user?.role).toBe('admin');

      // Switch to cashier user (should succeed)
      const cashierUser = MOCK_USERS.find(u => u.role === 'cashier')!;
      
      act(() => {
        result.current.switchUser(cashierUser);
      });

      expect(result.current.user?.id).toBe(cashierUser.id);
      expect(result.current.user?.role).toBe('cashier');
    });

    it('should not allow inactive users to login', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper });

      // Mock an inactive user
      const inactiveUser = { ...MOCK_USERS[0], isActive: false };
      const originalMockUsers = [...MOCK_USERS];
      MOCK_USERS.splice(0, 1, inactiveUser);

      try {
        await act(async () => {
          await result.current.login({ pinCode: '1234' });
        });
        expect(result.current.isAuthenticated).toBe(false);
      } catch (error) {
        expect(error).toBeTruthy();
        expect(result.current.isAuthenticated).toBe(false);
      }

      // Restore original mock users
      MOCK_USERS.splice(0, 1, originalMockUsers[0]);
    });

    it('should clear all sensitive data on logout', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper });

      await act(async () => {
        await result.current.login({ pinCode: '1234' });
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toBeTruthy();
      expect(result.current.sessionExpiry).toBeTruthy();

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.sessionExpiry).toBeNull();
      expect(result.current.lastActivity).toBeNull();
      expect(result.current.error).toBeNull();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('cafepos_user');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('cafepos_auth_state');
    });
  });

  describe('Permission System Security', () => {
    it('should not grant permissions to unauthenticated users', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper });

      expect(result.current.hasPermission('menu.view')).toBe(false);
      expect(result.current.hasAnyPermission(['menu.view', 'sales.process'])).toBe(false);
      expect(result.current.hasAllPermissions(['menu.view'])).toBe(false);
    });

    it('should not grant permissions to inactive users', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper });

      await act(async () => {
        await result.current.login({ pinCode: '1234' });
      });

      // Manually set user as inactive (simulating external deactivation)
      act(() => {
        result.current.updateUser({ isActive: false });
      });

      expect(result.current.hasPermission('menu.view')).toBe(false);
      expect(result.current.hasAnyPermission(['menu.view', 'sales.process'])).toBe(false);
      expect(result.current.hasAllPermissions(['menu.view'])).toBe(false);
    });

    it('should enforce role-based permissions correctly', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper });

      // Test trainee permissions (most restrictive)
      await act(async () => {
        await result.current.login({ pinCode: '4567' }); // Trainee
      });

      expect(result.current.hasPermission('menu.view')).toBe(true);
      expect(result.current.hasPermission('sales.process')).toBe(true);
      expect(result.current.hasPermission('menu.create')).toBe(false);
      expect(result.current.hasPermission('users.create')).toBe(false);
      expect(result.current.hasPermission('system.settings')).toBe(false);

      act(() => {
        result.current.logout();
      });

      // Test admin permissions (least restrictive)
      await act(async () => {
        await result.current.login({ pinCode: '1234' }); // Admin
      });

      expect(result.current.hasPermission('menu.view')).toBe(true);
      expect(result.current.hasPermission('menu.create')).toBe(true);
      expect(result.current.hasPermission('users.create')).toBe(true);
      expect(result.current.hasPermission('system.settings')).toBe(true);
    });
  });

  describe('Data Persistence Security', () => {
    it('should not store sensitive data in localStorage', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper });

      await act(async () => {
        await result.current.login({ pinCode: '1234' });
      });

      // Check that localStorage doesn't contain sensitive information
      const setItemCalls = localStorageMock.setItem.mock.calls;
      const storedData = setItemCalls.map(call => call[1]).join('');
      
      expect(storedData).not.toContain('1234'); // PIN not stored
      expect(storedData).not.toContain('password'); // No passwords stored
    });

    it('should validate stored data integrity', () => {
      // Mock corrupted localStorage data
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'cafepos_user') {
          return 'invalid json {';
        }
        return null;
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper });

      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('cafepos_user');
    });

    it('should handle localStorage unavailability gracefully', () => {
      // Mock localStorage throwing errors
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper });

      // Should still work even if localStorage fails
      expect(() => {
        act(() => {
          result.current.updateActivity();
        });
      }).not.toThrow();
    });
  });

  describe('Timing Attack Protection', () => {
    it('should have consistent response times for failed logins', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper });

      const startTime1 = Date.now();
      try {
        await act(async () => {
          await result.current.login({ pinCode: 'wrong' });
        });
      } catch (error) {
        // Expected
      }
      const endTime1 = Date.now();

      const startTime2 = Date.now();
      try {
        await act(async () => {
          await result.current.login({ pinCode: 'different' });
        });
      } catch (error) {
        // Expected
      }
      const endTime2 = Date.now();

      // Response times should be similar (within 100ms)
      const timeDiff = Math.abs((endTime1 - startTime1) - (endTime2 - startTime2));
      expect(timeDiff).toBeLessThan(100);
    });
  });
});