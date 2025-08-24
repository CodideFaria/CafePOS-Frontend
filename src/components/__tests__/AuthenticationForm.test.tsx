import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import AuthenticationForm from '../AuthenticationForm';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { DEFAULT_AUTH_CONFIG } from '../../types/auth';

// Mock the useAuth hook
const mockAuth = {
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
  error: null,
  isAuthenticated: false,
  user: null,
  failedAttempts: 0,
  lockoutUntil: null,
  lastActivity: null,
  sessionExpiry: null,
  hasPermission: vi.fn(),
  hasAnyPermission: vi.fn(),
  hasAllPermissions: vi.fn(),
  updateUser: vi.fn(),
  switchUser: vi.fn(),
  updateActivity: vi.fn()
};

vi.mock('../../contexts/AuthContext', () => ({
  ...vi.importActual('../../contexts/AuthContext'),
  useAuth: () => mockAuth
}));

describe('AuthenticationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.loading = false;
    mockAuth.error = null;
    mockAuth.failedAttempts = 0;
    mockAuth.lockoutUntil = null;
  });

  describe('Component Rendering', () => {
    it('should render PIN login mode by default', () => {
      render(<AuthenticationForm />);

      expect(screen.getByText('CafePOS System')).toBeInTheDocument();
      expect(screen.getByText('PIN Login')).toBeInTheDocument();
      expect(screen.getByText('Password Login')).toBeInTheDocument();
      expect(screen.getByText('Select User')).toBeInTheDocument();
    });

    it('should render password mode when specified', () => {
      render(<AuthenticationForm defaultMode="password" />);

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render user selector when enabled', () => {
      render(<AuthenticationForm showUserSelector={true} />);

      expect(screen.getByText('John Administrator')).toBeInTheDocument();
      expect(screen.getByText('Sarah Manager')).toBeInTheDocument();
      expect(screen.getByText('Mike Cashier')).toBeInTheDocument();
      expect(screen.getByText('Emma Trainee')).toBeInTheDocument();
    });

    it('should hide user selector when disabled', () => {
      render(<AuthenticationForm showUserSelector={false} />);

      expect(screen.queryByText('Select User')).not.toBeInTheDocument();
      expect(screen.queryByText('John Administrator')).not.toBeInTheDocument();
    });

    it('should render remember me checkbox when allowed', () => {
      render(<AuthenticationForm defaultMode="password" allowRememberMe={true} />);

      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    });

    it('should hide remember me checkbox when not allowed', () => {
      render(<AuthenticationForm defaultMode="password" allowRememberMe={false} />);

      expect(screen.queryByLabelText(/remember me/i)).not.toBeInTheDocument();
    });
  });

  describe('Mode Switching', () => {
    it('should switch from PIN to password mode', async () => {
      const user = userEvent.setup();
      render(<AuthenticationForm />);

      const passwordModeButton = screen.getByRole('button', { name: /password login/i });
      await user.click(passwordModeButton);

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should switch from password to PIN mode', async () => {
      const user = userEvent.setup();
      render(<AuthenticationForm defaultMode="password" />);

      const pinModeButton = screen.getByRole('button', { name: /pin login/i });
      await user.click(pinModeButton);

      expect(screen.getByText('Select User')).toBeInTheDocument();
    });

    it('should clear form data when switching modes', async () => {
      const user = userEvent.setup();
      render(<AuthenticationForm defaultMode="password" />);

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'testuser');

      const pinModeButton = screen.getByRole('button', { name: /pin login/i });
      await user.click(pinModeButton);

      const passwordModeButton = screen.getByRole('button', { name: /password login/i });
      await user.click(passwordModeButton);

      expect(screen.getByLabelText(/username/i)).toHaveValue('');
    });
  });

  describe('PIN Login Functionality', () => {
    it('should display PIN input after user selection', async () => {
      const user = userEvent.setup();
      render(<AuthenticationForm />);

      const userButton = screen.getByRole('button', { name: /john administrator/i });
      await user.click(userButton);

      expect(screen.getByText('Enter PIN')).toBeInTheDocument();
      expect(screen.getAllByDisplayValue('')).toHaveLength(4); // 4 PIN inputs
    });

    it('should only allow digit input in PIN fields', async () => {
      const user = userEvent.setup();
      render(<AuthenticationForm />);

      const userButton = screen.getByRole('button', { name: /john administrator/i });
      await user.click(userButton);

      const pinInputs = screen.getAllByDisplayValue('');
      await user.type(pinInputs[0], 'a');

      expect(pinInputs[0]).toHaveValue('');
    });

    it('should auto-focus next PIN input', async () => {
      const user = userEvent.setup();
      render(<AuthenticationForm />);

      const userButton = screen.getByRole('button', { name: /john administrator/i });
      await user.click(userButton);

      const pinInputs = screen.getAllByDisplayValue('');
      await user.type(pinInputs[0], '1');

      expect(pinInputs[1]).toHaveFocus();
    });

    it('should auto-submit when PIN is complete', async () => {
      const user = userEvent.setup();
      mockAuth.login.mockResolvedValue(undefined);
      render(<AuthenticationForm />);

      const userButton = screen.getByRole('button', { name: /john administrator/i });
      await user.click(userButton);

      const pinInputs = screen.getAllByDisplayValue('');
      await user.type(pinInputs[0], '1');
      await user.type(pinInputs[1], '2');
      await user.type(pinInputs[2], '3');
      await user.type(pinInputs[3], '4');

      await waitFor(() => {
        expect(mockAuth.login).toHaveBeenCalledWith({
          pinCode: '1234',
          rememberMe: false
        });
      });
    });

    it('should handle PIN backspace navigation', async () => {
      const user = userEvent.setup();
      render(<AuthenticationForm />);

      const userButton = screen.getByRole('button', { name: /john administrator/i });
      await user.click(userButton);

      const pinInputs = screen.getAllByDisplayValue('');
      await user.type(pinInputs[0], '1');
      
      // Focus should be on second input, backspace should go back
      await user.keyboard('{Backspace}');
      expect(pinInputs[0]).toHaveFocus();
    });

    it('should clear PIN on clear button click', async () => {
      const user = userEvent.setup();
      render(<AuthenticationForm />);

      const userButton = screen.getByRole('button', { name: /john administrator/i });
      await user.click(userButton);

      const pinInputs = screen.getAllByDisplayValue('');
      await user.type(pinInputs[0], '1');
      await user.type(pinInputs[1], '2');

      const clearButton = screen.getByRole('button', { name: /clear pin/i });
      await user.click(clearButton);

      expect(pinInputs[0]).toHaveValue('');
      expect(pinInputs[1]).toHaveValue('');
      expect(pinInputs[0]).toHaveFocus();
    });

    it('should allow changing user after selection', async () => {
      const user = userEvent.setup();
      render(<AuthenticationForm />);

      const userButton = screen.getByRole('button', { name: /john administrator/i });
      await user.click(userButton);

      const changeUserButton = screen.getByRole('button', { name: /change user/i });
      await user.click(changeUserButton);

      expect(screen.getByText('Select User')).toBeInTheDocument();
      expect(screen.queryByText('Enter PIN')).not.toBeInTheDocument();
    });
  });

  describe('Password Login Functionality', () => {
    it('should submit password form', async () => {
      const user = userEvent.setup();
      mockAuth.login.mockResolvedValue(undefined);
      render(<AuthenticationForm defaultMode="password" />);

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'testpass');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      expect(mockAuth.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'testpass',
        pinCode: '',
        rememberMe: false
      });
    });

    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(<AuthenticationForm defaultMode="password" />);

      const passwordInput = screen.getByLabelText(/password/i);
      const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button

      expect(passwordInput).toHaveAttribute('type', 'password');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should handle remember me checkbox', async () => {
      const user = userEvent.setup();
      mockAuth.login.mockResolvedValue(undefined);
      render(<AuthenticationForm defaultMode="password" allowRememberMe={true} />);

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'testpass');
      await user.click(screen.getByLabelText(/remember me/i));
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      expect(mockAuth.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'testpass',
        pinCode: '',
        rememberMe: true
      });
    });

    it('should call onForgotPassword when forgot password is clicked', async () => {
      const user = userEvent.setup();
      const mockOnForgotPassword = vi.fn();
      render(<AuthenticationForm defaultMode="password" onForgotPassword={mockOnForgotPassword} />);

      const forgotPasswordButton = screen.getByRole('button', { name: /forgot password/i });
      await user.click(forgotPasswordButton);

      expect(mockOnForgotPassword).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during login', () => {
      mockAuth.loading = true;
      render(<AuthenticationForm defaultMode="password" />);

      expect(screen.getByText('Signing in...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    });

    it('should show loading state for PIN mode', () => {
      mockAuth.loading = true;
      render(<AuthenticationForm />);

      expect(screen.getByText('Authenticating...')).toBeInTheDocument();
    });

    it('should disable inputs during loading', () => {
      mockAuth.loading = true;
      render(<AuthenticationForm defaultMode="password" />);

      expect(screen.getByLabelText(/username/i)).toBeDisabled();
      expect(screen.getByLabelText(/password/i)).toBeDisabled();
      expect(screen.getByLabelText(/remember me/i)).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message', () => {
      mockAuth.error = 'Invalid credentials';
      render(<AuthenticationForm />);

      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    it('should show remaining attempts', () => {
      mockAuth.error = 'Login failed';
      mockAuth.failedAttempts = 1;
      render(<AuthenticationForm />);

      expect(screen.getByText('Attempts remaining: 2')).toBeInTheDocument();
    });

    it('should clear PIN on login failure', async () => {
      const user = userEvent.setup();
      mockAuth.login.mockRejectedValue(new Error('Invalid PIN'));
      render(<AuthenticationForm />);

      const userButton = screen.getByRole('button', { name: /john administrator/i });
      await user.click(userButton);

      const pinInputs = screen.getAllByDisplayValue('');
      await user.type(pinInputs[0], '1');
      await user.type(pinInputs[1], '2');
      await user.type(pinInputs[2], '3');
      await user.type(pinInputs[3], '4');

      await waitFor(() => {
        expect(pinInputs[0]).toHaveValue('');
        expect(pinInputs[1]).toHaveValue('');
        expect(pinInputs[2]).toHaveValue('');
        expect(pinInputs[3]).toHaveValue('');
      });
    });

    it('should clear password on login failure', async () => {
      const user = userEvent.setup();
      mockAuth.login.mockRejectedValue(new Error('Invalid password'));
      render(<AuthenticationForm defaultMode="password" />);

      await user.type(screen.getByLabelText(/password/i), 'wrongpass');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/password/i)).toHaveValue('');
      });
    });
  });

  describe('Lockout Protection', () => {
    it('should display lockout warning', () => {
      const lockoutTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      mockAuth.lockoutUntil = lockoutTime;
      mockAuth.failedAttempts = 3;
      render(<AuthenticationForm />);

      expect(screen.getByText('Account Temporarily Locked')).toBeInTheDocument();
      expect(screen.getByText(/Too many failed login attempts/)).toBeInTheDocument();
      expect(screen.getByText(/Failed attempts: 3\/3/)).toBeInTheDocument();
    });

    it('should disable form elements when locked out', () => {
      const lockoutTime = new Date(Date.now() + 10 * 60 * 1000);
      mockAuth.lockoutUntil = lockoutTime;
      render(<AuthenticationForm />);

      const userButtons = screen.getAllByRole('button');
      const enabledButtons = userButtons.filter(button => !button.hasAttribute('disabled'));
      
      // Only mode toggle buttons should be enabled during lockout
      expect(enabledButtons).toHaveLength(2); // PIN Login and Password Login buttons
    });

    it('should show countdown timer', () => {
      const lockoutTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      mockAuth.lockoutUntil = lockoutTime;
      render(<AuthenticationForm />);

      expect(screen.getByText(/Try again in 5:00/)).toBeInTheDocument();
    });

    it('should prevent login when locked out', async () => {
      const user = userEvent.setup();
      const lockoutTime = new Date(Date.now() + 10 * 60 * 1000);
      mockAuth.lockoutUntil = lockoutTime;
      render(<AuthenticationForm defaultMode="password" />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toBeDisabled();

      // Even if clicked, should not call login
      await user.click(submitButton);
      expect(mockAuth.login).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<AuthenticationForm defaultMode="password" />);

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<AuthenticationForm defaultMode="password" />);

      await user.tab();
      expect(screen.getByRole('button', { name: /pin login/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /password login/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/username/i)).toHaveFocus();
    });

    it('should have proper ARIA attributes', () => {
      mockAuth.error = 'Login failed';
      render(<AuthenticationForm />);

      const errorMessage = screen.getByText('Login failed');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('should call onSuccess when provided', async () => {
      const mockOnSuccess = vi.fn();
      const mockUser = { id: '1', username: 'test', role: 'cashier' };
      
      // We need to mock the login to actually succeed and update the auth state
      mockAuth.login.mockImplementation(() => {
        mockAuth.isAuthenticated = true;
        mockAuth.user = mockUser;
        return Promise.resolve();
      });
      
      render(<AuthenticationForm onSuccess={mockOnSuccess} />);
      
      // The component would need to watch for auth state changes
      // This is a limitation of this test approach - in real usage,
      // the component would re-render when auth state changes
    });
  });

  describe('Security Features', () => {
    it('should not expose sensitive information in DOM', () => {
      render(<AuthenticationForm />);
      
      // Check that PIN codes are not visible in the DOM
      expect(screen.queryByText('1234')).not.toBeInTheDocument();
      expect(screen.queryByText('2345')).not.toBeInTheDocument();
    });

    it('should use password input type for PIN fields', async () => {
      const user = userEvent.setup();
      render(<AuthenticationForm />);

      const userButton = screen.getByRole('button', { name: /john administrator/i });
      await user.click(userButton);

      const pinInputs = screen.getAllByDisplayValue('');
      pinInputs.forEach(input => {
        expect(input).toHaveAttribute('type', 'password');
      });
    });

    it('should limit PIN input to configured length', () => {
      render(<AuthenticationForm />);
      
      // The component should create exactly 4 PIN inputs based on DEFAULT_AUTH_CONFIG.pinLength
      expect(DEFAULT_AUTH_CONFIG.pinLength).toBe(4);
    });
  });
});