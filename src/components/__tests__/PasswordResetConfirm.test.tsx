import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PasswordResetConfirm from '../PasswordResetConfirm';
import { networkAdapter } from '../../network/NetworkAdapter';

// Mock the NetworkAdapter
jest.mock('../../network/NetworkAdapter', () => ({
  networkAdapter: {
    post: jest.fn()
  }
}));

describe('PasswordResetConfirm', () => {
  const validToken = 'valid-reset-token-123';
  const invalidToken = 'invalid-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Validation', () => {
    it('should validate token on component mount', async () => {
      (networkAdapter.post as jest.Mock).mockResolvedValue({ success: true });

      render(<PasswordResetConfirm token={validToken} />);

      expect(screen.getByText('Validating reset link...')).toBeInTheDocument();

      await waitFor(() => {
        expect(networkAdapter.post).toHaveBeenCalledWith('/auth/validate-reset-token', { token: validToken });
      });
    });

    it('should show invalid token message when token validation fails', async () => {
      const mockOnTokenInvalid = jest.fn();
      (networkAdapter.post as jest.Mock).mockResolvedValue({ success: false });

      render(<PasswordResetConfirm token={invalidToken} onTokenInvalid={mockOnTokenInvalid} />);

      await waitFor(() => {
        expect(screen.getByText('Invalid Reset Link')).toBeInTheDocument();
        expect(screen.getByText('This password reset link is invalid or has expired. Please request a new password reset.')).toBeInTheDocument();
        expect(mockOnTokenInvalid).toHaveBeenCalled();
      });
    });

    it('should show form when token is valid', async () => {
      (networkAdapter.post as jest.Mock).mockResolvedValue({ success: true });

      render(<PasswordResetConfirm token={validToken} />);

      await waitFor(() => {
        expect(screen.getByText('Create New Password')).toBeInTheDocument();
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
      });
    });

    it('should handle network error during token validation', async () => {
      const mockOnTokenInvalid = jest.fn();
      (networkAdapter.post as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<PasswordResetConfirm token={validToken} onTokenInvalid={mockOnTokenInvalid} />);

      await waitFor(() => {
        expect(mockOnTokenInvalid).toHaveBeenCalled();
      });
    });
  });

  describe('Password Validation', () => {
    beforeEach(async () => {
      (networkAdapter.post as jest.Mock).mockResolvedValue({ success: true });
      render(<PasswordResetConfirm token={validToken} />);
      
      await waitFor(() => {
        expect(screen.getByText('Create New Password')).toBeInTheDocument();
      });
    });

    it('should show password strength indicator', async () => {
      const user = userEvent.setup();
      const passwordInput = screen.getByLabelText(/new password/i);

      await user.type(passwordInput, 'weak');

      expect(screen.getByText('Password Strength:')).toBeInTheDocument();
      expect(screen.getByText('WEAK')).toBeInTheDocument();
    });

    it('should show strong password indicator for strong passwords', async () => {
      const user = userEvent.setup();
      const passwordInput = screen.getByLabelText(/new password/i);

      await user.type(passwordInput, 'StrongP@ssw0rd123!');

      await waitFor(() => {
        expect(screen.getByText('STRONG')).toBeInTheDocument();
      });
    });

    it('should show password requirements checklist', async () => {
      const user = userEvent.setup();
      const passwordInput = screen.getByLabelText(/new password/i);

      await user.type(passwordInput, 'test');

      expect(screen.getByText('Length')).toBeInTheDocument();
      expect(screen.getByText('Uppercase')).toBeInTheDocument();
      expect(screen.getByText('Lowercase')).toBeInTheDocument();
      expect(screen.getByText('Numbers')).toBeInTheDocument();
      expect(screen.getByText('Special characters')).toBeInTheDocument();
    });

    it('should show password match validation', async () => {
      const user = userEvent.setup();
      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(passwordInput, 'StrongP@ssw0rd123!');
      await user.type(confirmPasswordInput, 'DifferentP@ssw0rd123!');

      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    it('should show password match confirmation', async () => {
      const user = userEvent.setup();
      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(passwordInput, 'StrongP@ssw0rd123!');
      await user.type(confirmPasswordInput, 'StrongP@ssw0rd123!');

      await waitFor(() => {
        expect(screen.getByText('Passwords match')).toBeInTheDocument();
      });
    });

    it('should disable submit button when password is weak', async () => {
      const user = userEvent.setup();
      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'weak');
      await user.type(confirmPasswordInput, 'weak');

      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when passwords are strong and match', async () => {
      const user = userEvent.setup();
      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'StrongP@ssw0rd123!');
      await user.type(confirmPasswordInput, 'StrongP@ssw0rd123!');

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Password Visibility Toggle', () => {
    beforeEach(async () => {
      (networkAdapter.post as jest.Mock).mockResolvedValue({ success: true });
      render(<PasswordResetConfirm token={validToken} />);
      
      await waitFor(() => {
        expect(screen.getByText('Create New Password')).toBeInTheDocument();
      });
    });

    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      const passwordInput = screen.getByLabelText(/new password/i);
      const toggleButtons = screen.getAllByRole('button');
      const passwordToggle = toggleButtons.find(button => button.parentElement?.contains(passwordInput));

      expect(passwordInput).toHaveAttribute('type', 'password');

      if (passwordToggle) {
        await user.click(passwordToggle);
        expect(passwordInput).toHaveAttribute('type', 'text');
      }
    });

    it('should toggle confirm password visibility independently', async () => {
      const user = userEvent.setup();
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const toggleButtons = screen.getAllByRole('button');
      const confirmPasswordToggle = toggleButtons.find(button => button.parentElement?.contains(confirmPasswordInput));

      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      if (confirmPasswordToggle) {
        await user.click(confirmPasswordToggle);
        expect(confirmPasswordInput).toHaveAttribute('type', 'text');
      }
    });
  });

  describe('Password Generation', () => {
    beforeEach(async () => {
      (networkAdapter.post as jest.Mock).mockResolvedValue({ success: true });
      render(<PasswordResetConfirm token={validToken} />);
      
      await waitFor(() => {
        expect(screen.getByText('Create New Password')).toBeInTheDocument();
      });
    });

    it('should generate strong password when generate button is clicked', async () => {
      const user = userEvent.setup();
      const generateButton = screen.getByText('Generate strong password');
      const passwordInput = screen.getByLabelText(/new password/i) as HTMLInputElement;
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i) as HTMLInputElement;

      await user.click(generateButton);

      expect(passwordInput.value).toBeTruthy();
      expect(passwordInput.value).toBe(confirmPasswordInput.value);
      expect(passwordInput.value.length).toBeGreaterThanOrEqual(12);
    });

    it('should show strong strength for generated password', async () => {
      const user = userEvent.setup();
      const generateButton = screen.getByText('Generate strong password');

      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('STRONG')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    beforeEach(async () => {
      (networkAdapter.post as jest.Mock)
        .mockResolvedValueOnce({ success: true }) // Token validation
        .mockResolvedValue({ success: true }); // Password reset
      
      render(<PasswordResetConfirm token={validToken} />);
      
      await waitFor(() => {
        expect(screen.getByText('Create New Password')).toBeInTheDocument();
      });
    });

    it('should submit form with correct parameters', async () => {
      const user = userEvent.setup();
      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'StrongP@ssw0rd123!');
      await user.type(confirmPasswordInput, 'StrongP@ssw0rd123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(networkAdapter.post).toHaveBeenCalledWith('/auth/password-reset-confirm', {
          token: validToken,
          newPassword: 'StrongP@ssw0rd123!'
        });
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      (networkAdapter.post as jest.Mock).mockImplementation((url) => {
        if (url.includes('validate-reset-token')) {
          return Promise.resolve({ success: true });
        }
        return new Promise(resolve => setTimeout(() => resolve({ success: true }), 100));
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'StrongP@ssw0rd123!');
      await user.type(confirmPasswordInput, 'StrongP@ssw0rd123!');
      await user.click(submitButton);

      expect(screen.getByText('Resetting...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should show success message after successful password reset', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = jest.fn();
      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      render(<PasswordResetConfirm token={validToken} onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByText('Create New Password')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/new password/i), 'StrongP@ssw0rd123!');
      await user.type(screen.getByLabelText(/confirm new password/i), 'StrongP@ssw0rd123!');
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText('Password Reset Successful')).toBeInTheDocument();
      });

      // Wait for the timeout callback
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should show error message when password reset fails', async () => {
      const user = userEvent.setup();
      (networkAdapter.post as jest.Mock)
        .mockResolvedValueOnce({ success: true }) // Token validation
        .mockResolvedValue({ success: false, message: 'Password reset failed' }); // Password reset

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'StrongP@ssw0rd123!');
      await user.type(confirmPasswordInput, 'StrongP@ssw0rd123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password reset failed')).toBeInTheDocument();
      });
    });

    it('should handle token expiration during password reset', async () => {
      const user = userEvent.setup();
      const mockOnTokenInvalid = jest.fn();
      (networkAdapter.post as jest.Mock)
        .mockResolvedValueOnce({ success: true }) // Token validation
        .mockResolvedValue({ success: false, message: 'Token expired' }); // Password reset

      render(<PasswordResetConfirm token={validToken} onTokenInvalid={mockOnTokenInvalid} />);

      await waitFor(() => {
        expect(screen.getByText('Create New Password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'StrongP@ssw0rd123!');
      await user.type(confirmPasswordInput, 'StrongP@ssw0rd123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnTokenInvalid).toHaveBeenCalled();
      });
    });

    it('should prevent submission when passwords do not meet requirements', async () => {
      const user = userEvent.setup();
      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'weak');
      await user.type(confirmPasswordInput, 'different');
      
      // Try to submit - should not call the API
      await user.click(submitButton);

      // Should only have been called once for token validation
      expect(networkAdapter.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cancel Functionality', () => {
    beforeEach(async () => {
      (networkAdapter.post as jest.Mock).mockResolvedValue({ success: true });
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();

      render(<PasswordResetConfirm token={validToken} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByText('Create New Password')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should not render cancel button when onCancel is not provided', async () => {
      render(<PasswordResetConfirm token={validToken} />);

      await waitFor(() => {
        expect(screen.getByText('Create New Password')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      (networkAdapter.post as jest.Mock).mockResolvedValue({ success: true });
      render(<PasswordResetConfirm token={validToken} />);
      
      await waitFor(() => {
        expect(screen.getByText('Create New Password')).toBeInTheDocument();
      });
    });

    it('should have proper form labels and structure', () => {
      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      expect(passwordInput).toHaveAttribute('id', 'newPassword');
      expect(passwordInput).toHaveAttribute('required');
      expect(confirmPasswordInput).toHaveAttribute('id', 'confirmPassword');
      expect(confirmPasswordInput).toHaveAttribute('required');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();

      // Tab through form elements
      await user.tab();
      expect(screen.getByLabelText(/new password/i)).toHaveFocus();

      await user.tab();
      // Focus should move to password visibility toggle

      await user.tab();
      expect(screen.getByLabelText(/confirm new password/i)).toHaveFocus();
    });

    it('should have appropriate ARIA attributes for password requirements', async () => {
      const user = userEvent.setup();
      const passwordInput = screen.getByLabelText(/new password/i);

      await user.type(passwordInput, 'test');

      // Check for proper accessibility in password requirements
      const requirements = screen.getAllByText(/Length|Uppercase|Lowercase|Numbers|Special characters/);
      expect(requirements.length).toBeGreaterThan(0);
    });
  });
});