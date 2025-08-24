import React, { useState } from 'react';
import MenuManagement from './MenuManagement';
import CSVImport from './CSVImport';
import InventoryManagement from './InventoryManagement';
import SalesDashboard from './SalesDashboard';
import EmailTest from './EmailTest';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { networkAdapter } from '../network/NetworkAdapter';

type AdminView = 'menu' | 'import' | 'inventory' | 'dashboard' | 'email' | null;

interface AdminPanelProps {
  initialView?: AdminView;
  onClose?: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ initialView = null, onClose }) => {
  const [currentView, setCurrentView] = useState<AdminView>(initialView);
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const { hasPermission, hasAnyPermission, user } = useAuth();

  const handleMenuRefresh = () => {
    // This will trigger a refresh in the menu management component
    setCurrentView('menu');
  };

  const handleCloseDayEmail = async () => {
    setEmailSending(true);
    setEmailResult(null);

    try {
      // Get today's date for the report
      const today = new Date().toISOString().split('T')[0];
      
      // Default recipients for daily sales reports
      const recipients = ['cd80ocd@bolton.ac.uk'];
      
      const result = await networkAdapter.post('/reports/email-daily-summary', {
        recipients: recipients,
        date: today,
        includeDetails: true
      });

      if (result.errors && result.errors.length > 0) {
        setEmailResult({
          type: 'error',
          message: result.errors.join(', ')
        });
      } else {
        setEmailResult({
          type: 'success',
          message: `Day closed successfully! Sales report sent to ${recipients.length} recipient(s). ${result.data?.mock ? '(Mock mode - check server logs)' : ''}`
        });
      }
    } catch (error) {
      setEmailResult({
        type: 'error',
        message: `Failed to close day: ${error}`
      });
    } finally {
      setEmailSending(false);
      
      // Clear result after 7 seconds
      setTimeout(() => {
        setEmailResult(null);
      }, 7000);
    }
  };

  if (currentView === 'menu') {
    return (
      <ProtectedRoute requiredPermissions={['menu.view']}>
        <MenuManagement 
          onClose={() => setCurrentView(null)} 
        />
      </ProtectedRoute>
    );
  }

  if (currentView === 'import') {
    return (
      <ProtectedRoute requiredPermissions={['menu.import']}>
        <CSVImport 
          onImportComplete={handleMenuRefresh}
          onClose={() => setCurrentView(null)} 
        />
      </ProtectedRoute>
    );
  }

  if (currentView === 'inventory') {
    return (
      <ProtectedRoute requiredPermissions={['inventory.view']}>
        <InventoryManagement 
          onClose={() => setCurrentView(null)} 
        />
      </ProtectedRoute>
    );
  }

  if (currentView === 'dashboard') {
    return (
      <ProtectedRoute requiredPermissions={['reports.view']}>
        <SalesDashboard 
          onClose={() => setCurrentView(null)} 
        />
      </ProtectedRoute>
    );
  }

  if (currentView === 'email') {
    return (
      <ProtectedRoute requiredPermissions={['reports.send_email']}>
        <EmailTest 
          onClose={() => setCurrentView(null)} 
        />
      </ProtectedRoute>
    );
  }

  // Main admin panel view
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Manager & Admin Actions - Close the Day */}
      {hasPermission('reports.send_email') && (user?.role === 'admin' || user?.role === 'manager') && (
        <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Close the Day</h3>
                <p className="text-sm text-gray-600">Send today's sales summary report to management</p>
              </div>
            </div>
            <button
              onClick={handleCloseDayEmail}
              disabled={emailSending}
              className="flex items-center px-6 py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              {emailSending ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Closing Day...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Close the Day
                </>
              )}
            </button>
          </div>
          
          {/* Email Result Notification */}
          {emailResult && (
            <div className={`mt-4 p-3 rounded-lg flex items-center ${
              emailResult.type === 'success' 
                ? 'bg-green-100 border border-green-300' 
                : 'bg-red-100 border border-red-300'
            }`}>
              <svg 
                className={`w-5 h-5 mr-2 ${
                  emailResult.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {emailResult.type === 'success' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              <span className={`text-sm font-medium ${
                emailResult.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {emailResult.message}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Menu Management Card */}
        {hasPermission('menu.view') && (
          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => setCurrentView('menu')}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="ml-3 text-xl font-semibold text-gray-800">Menu Management</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Add, edit, and delete menu items. Manage pricing and availability for all products.
            </p>
            <div className="flex items-center text-orange-600 font-medium">
              <span>Manage Items</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        )}

        {/* Inventory Management Card */}
        {hasPermission('inventory.view') && (
          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => setCurrentView('inventory')}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="ml-3 text-xl font-semibold text-gray-800">Inventory</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Monitor stock levels, track inventory movements, and manage supplier information.
            </p>
            <div className="flex items-center text-green-600 font-medium">
              <span>Manage Stock</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        )}

        {/* Sales Dashboard Card */}
        {hasPermission('reports.view') && (
          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => setCurrentView('dashboard')}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="ml-3 text-xl font-semibold text-gray-800">Sales Dashboard</h2>
            </div>
            <p className="text-gray-600 mb-4">
              View detailed sales analytics, revenue trends, and performance metrics.
            </p>
            <div className="flex items-center text-purple-600 font-medium">
              <span>View Analytics</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        )}

        {/* CSV Import Card */}
        {hasPermission('menu.import') && (
          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => setCurrentView('import')}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h2 className="ml-3 text-xl font-semibold text-gray-800">Bulk Import</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Import multiple menu items from a CSV file. Download template and validate data before import.
            </p>
            <div className="flex items-center text-blue-600 font-medium">
              <span>Import CSV</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        )}

        {/* Email Test Card */}
        {hasPermission('reports.send_email') && (
          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => setCurrentView('email')}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="ml-3 text-xl font-semibold text-gray-800">Email Testing</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Test daily sales email functionality and send manual reports to configured recipients.
            </p>
            <div className="flex items-center text-red-600 font-medium">
              <span>Test Email</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Quick Access</h3>
        <div className="flex flex-wrap gap-2">
          {hasPermission('reports.view') && (
            <button
              onClick={() => setCurrentView('dashboard')}
              className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              📊 Sales Dashboard
            </button>
          )}
          {hasPermission('menu.view') && (
            <button
              onClick={() => setCurrentView('menu')}
              className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              🍽️ View All Items
            </button>
          )}
          {hasPermission('inventory.view') && (
            <button
              onClick={() => setCurrentView('inventory')}
              className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              📦 Check Inventory
            </button>
          )}
          {hasPermission('menu.import') && (
            <button
              onClick={() => setCurrentView('import')}
              className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              📤 Bulk Import
            </button>
          )}
          {hasPermission('reports.send_email') && (
            <button
              onClick={() => setCurrentView('email')}
              className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              📧 Test Email
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;