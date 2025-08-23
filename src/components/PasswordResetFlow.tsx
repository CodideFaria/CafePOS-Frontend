import React, { useState, useCallback } from 'react';
import PasswordResetRequest from './PasswordResetRequest';
import PasswordResetConfirm from './PasswordResetConfirm';

interface PasswordResetFlowProps {
  initialStep?: 'request' | 'confirm';
  token?: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

type ResetStep = 'request' | 'confirm' | 'expired';

const PasswordResetFlow: React.FC<PasswordResetFlowProps> = ({
  initialStep = 'request',
  token,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<ResetStep>(
    token ? 'confirm' : initialStep
  );
  const [resetToken, setResetToken] = useState<string>(token || '');
  const [requestedEmail, setRequestedEmail] = useState<string>('');

  const handleRequestSuccess = useCallback((email: string) => {
    setRequestedEmail(email);
    // Stay on request step to show success message
    // The user will click the link in their email to proceed to confirm step
  }, []);

  const handleConfirmSuccess = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  const handleTokenInvalid = useCallback(() => {
    setCurrentStep('expired');
  }, []);

  const handleBackToRequest = useCallback(() => {
    setCurrentStep('request');
    setResetToken('');
    setRequestedEmail('');
  }, []);

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'request':
        return (
          <PasswordResetRequest
            onSuccess={handleRequestSuccess}
            onCancel={onCancel}
          />
        );

      case 'confirm':
        return (
          <PasswordResetConfirm
            token={resetToken}
            onSuccess={handleConfirmSuccess}
            onCancel={onCancel}
            onTokenInvalid={handleTokenInvalid}
          />
        );

      case 'expired':
        return (
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Link Expired</h2>
              <p className="text-gray-600 mb-6">
                This password reset link has expired. Please request a new one to reset your password.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleBackToRequest}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Request New Link
                </button>
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Back to Login
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-orange-600 p-3 rounded-full">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>
        <h1 className="text-center text-2xl font-bold text-gray-900 mb-8">
          CafePOS System
        </h1>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {renderCurrentStep()}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          Need help? Contact your system administrator.
        </p>
      </div>
    </div>
  );
};

export default PasswordResetFlow;