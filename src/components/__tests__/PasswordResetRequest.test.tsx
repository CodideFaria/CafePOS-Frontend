import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PasswordResetRequest from '../PasswordResetRequest';
import { networkAdapter } from '../../network/NetworkAdapter';

// Mock the NetworkAdapter
jest.mock('../../network/NetworkAdapter', () => ({
  networkAdapter: {
    post: jest.fn()
  }
}));

describe('PasswordResetRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the password reset request form', () => {
      render(<PasswordResetRequest />);

      expect(screen.getByText('Reset Password')).toBeInTheDocument();
      expect(screen.getByText('Enter your email address and we\'ll send you a link to reset your password.')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /email address/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });

    it('should render cancel button when onCancel prop is provided', () => {
      const mockOnCancel = jest.fn();
      render(<PasswordResetRequest onCancel={mockOnCancel} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should not render cancel button when onCancel prop is not provided', () => {
      render(<PasswordResetRequest />);

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });
  });

  describe('Email Validation', () => {
    it('should show error for invalid email format', async () => {
      const user = userEvent.setup();
      render(<PasswordResetRequest />);

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      await user.type(emailInput, 'invalid-email');

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('should show error for empty email', async () => {
      const user = userEvent.setup();
      render(<PasswordResetRequest />);

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      await user.type(emailInput, 'test@example.com');
      await user.clear(emailInput);

      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    it('should not show error for valid email', async () => {
      const user = userEvent.setup();
      render(<PasswordResetRequest />);

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      await user.type(emailInput, 'valid@example.com');

      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
    });

    it('should disable submit button when email is invalid', async () => {
      const user = userEvent.setup();
      render(<PasswordResetRequest />);

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'invalid-email');

      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when email is valid', async () => {
      const user = userEvent.setup();
      render(<PasswordResetRequest />);

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'valid@example.com');

      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('should call networkAdapter.post with correct parameters', async () => {
      const user = userEvent.setup();
      (networkAdapter.post as jest.Mock).mockResolvedValue({ success: true, message: 'Reset link sent' });

      render(<PasswordResetRequest />);

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      expect(networkAdapter.post).toHaveBeenCalledWith('/auth/password-reset-request', {
        email: 'test@example.com'
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      (networkAdapter.post as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<PasswordResetRequest />);

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      expect(screen.getByText('Sending...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      expect(emailInput).toBeDisabled();
    });

    it('should call onSuccess callback when request succeeds', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = jest.fn();
      (networkAdapter.post as jest.Mock).mockResolvedValue({ success: true, message: 'Reset link sent' });

      render(<PasswordResetRequest onSuccess={mockOnSuccess} />);

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith('test@example.com');
      });
    });

    it('should show success message after successful submission', async () => {
      const user = userEvent.setup();
      (networkAdapter.post as jest.Mock).mockResolvedValue({ success: true, message: 'Reset link sent' });

      render(<PasswordResetRequest />);

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument();
        expect(screen.getByText(/We've sent a password reset link to/)).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
      });
    });

    it('should show error message when request fails', async () => {
      const user = userEvent.setup();
      (networkAdapter.post as jest.Mock).mockResolvedValue({ success: false, message: 'Email not found' });

      render(<PasswordResetRequest />);

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email not found')).toBeInTheDocument();
      });
    });

    it('should show generic error message when network request throws', async () => {
      const user = userEvent.setup();
      (networkAdapter.post as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<PasswordResetRequest />);

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Unable to process password reset request. Please try again later.')).toBeInTheDocument();
      });
    });

    it('should trim and lowercase email before submission', async () => {
      const user = userEvent.setup();
      (networkAdapter.post as jest.Mock).mockResolvedValue({ success: true });

      render(<PasswordResetRequest />);

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, '  TEST@EXAMPLE.COM  ');
      await user.click(submitButton);

      expect(networkAdapter.post).toHaveBeenCalledWith('/auth/password-reset-request', {
        email: 'test@example.com'
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();

      render(<PasswordResetRequest onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should call onCancel from success screen when back to login is clicked', async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();
      (networkAdapter.post as jest.Mock).mockResolvedValue({ success: true });

      render(<PasswordResetRequest onCancel={mockOnCancel} />);

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /back to login/i });
      await user.click(backButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<PasswordResetRequest />);

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      expect(emailInput).toHaveAttribute('id', 'email');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<PasswordResetRequest onCancel={() => {}} />);

      // Tab through form elements
      await user.tab();
      expect(screen.getByRole('textbox', { name: /email address/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /send reset link/i })).toHaveFocus();
    });
  });

  describe('Email Sanitization', () => {
    it('should handle special characters in email', async () => {
      const user = userEvent.setup();
      (networkAdapter.post as jest.Mock).mockResolvedValue({ success: true });

      render(<PasswordResetRequest />);

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      await user.type(emailInput, 'user+test@example.com');

      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
    });

    it('should handle international domain names', async () => {
      const user = userEvent.setup();
      (networkAdapter.post as jest.Mock).mockResolvedValue({ success: true });

      render(<PasswordResetRequest />);

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      await user.type(emailInput, 'test@example.co.uk');

      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
    });
  });
});