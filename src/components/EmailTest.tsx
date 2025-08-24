import React, { useState } from 'react';
import { networkAdapter } from '../network/NetworkAdapter';

interface EmailTestProps {
  onClose: () => void;
}

interface EmailTestState {
  recipients: string;
  loading: boolean;
  result: any;
  error: string;
}

const EmailTest: React.FC<EmailTestProps> = ({ onClose }) => {
  const [state, setState] = useState<EmailTestState>({
    recipients: 'cd80ocd@bolton.ac.uk',
    loading: false,
    result: null,
    error: ''
  });

  const handleSendTestEmail = async () => {
    if (!state.recipients.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter at least one email address' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: '', result: null }));

    try {
      const recipientList = state.recipients.split(',').map(email => email.trim()).filter(email => email);
      
      const result = await networkAdapter.post('/reports/test-email', {
        recipients: recipientList
      });

      if (result.errors && result.errors.length > 0) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: result.errors.join(', ') 
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          result: result.data 
        }));
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: `Failed to send test email: ${error}` 
      }));
    }
  };

  const handleManualTestEmail = async () => {
    if (!state.recipients.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter at least one email address' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: '', result: null }));

    try {
      const recipientList = state.recipients.split(',').map(email => email.trim()).filter(email => email);
      
      const result = await networkAdapter.post('/reports/email-daily-summary', {
        recipients: recipientList,
        date: new Date().toISOString().split('T')[0],
        includeDetails: true
      });

      if (result.errors && result.errors.length > 0) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: result.errors.join(', ') 
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          result: result.data 
        }));
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: `Failed to send manual email: ${error}` 
      }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📧 Email System Test</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 p-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Recipients (comma-separated)
          </label>
          <textarea
            value={state.recipients}
            onChange={(e) => setState(prev => ({ ...prev, recipients: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            rows={3}
            placeholder="Enter email addresses separated by commas"
          />
          <p className="text-sm text-gray-600 mt-1">
            Example: john@example.com, jane@example.com
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={handleSendTestEmail}
            disabled={state.loading}
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {state.loading ? (
              <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
            Send Test Email
          </button>

          <button
            onClick={handleManualTestEmail}
            disabled={state.loading}
            className="flex items-center justify-center px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {state.loading ? (
              <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
            Send Manual Report
          </button>
        </div>

        <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
          <p><strong>Test Email:</strong> Uses scheduler service with mock data</p>
          <p><strong>Manual Report:</strong> Uses reports API with today's data</p>
          <p><strong>Daily Schedule:</strong> Automated emails sent at 7:00 AM daily</p>
        </div>

        {state.error && (
          <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 font-medium">Error</p>
            </div>
            <p className="text-red-600 mt-1">{state.error}</p>
          </div>
        )}

        {state.result && (
          <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-700 font-medium">Success!</p>
            </div>
            <div className="text-green-600 text-sm">
              <p>Email sent successfully to {state.result.recipients?.length || 0} recipients</p>
              {state.result.mock && (
                <p className="mt-1 text-yellow-600">
                  ⚠️ <strong>Mock Mode:</strong> Email was logged but not actually sent (check server logs)
                </p>
              )}
              <p className="mt-1">Timestamp: {new Date(state.result.timestamp).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailTest;