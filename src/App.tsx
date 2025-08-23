import { useState, useCallback } from 'react';
import burger from './assets/beef-burger.png';
import './App.css';
import ProductMenu from './components/ProductMenu';
import ProductSearch from './components/ProductSearch';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import button from './assets/button-21.mp3';
import Receipt from './components/Receipt';
import AdminPanel from './components/AdminPanel';
import DiscountModal from './components/DiscountModal';
import OrderHistory from './components/OrderHistory';
import LoginModal from './components/LoginModal';
import UserProfilePanel from './components/UserProfilePanel';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedWrapper from './components/RoleBasedWrapper';
import { useAuth } from './contexts/AuthContext';
import { CartItem, calculateCartTotals, Discount, PaymentData } from './types/cart';
import { MenuItem } from './utils/searchUtils';
import { Order } from './types/order';

function App() {
  const { user, isAuthenticated } = useAuth();
  const [searchKey, setSearchKey] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  const addToCart = useCallback((product: MenuItem) => {
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.product.id === product.id && item.product.size === product.size
      );

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const newItems = [...prevItems];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + 1
        };
        return newItems;
      } else {
        // Add new item to cart
        const newItem: CartItem = {
          id: `${product.id}-${product.size}-${Date.now()}`,
          product,
          quantity: 1,
          addedAt: new Date()
        };
        return [...prevItems, newItem];
      }
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setDiscount(null);
    const sound = new Audio();
    sound.src = button;
    sound.play();
  }, []);

  const handleApplyDiscount = useCallback((newDiscount: Discount) => {
    setDiscount(newDiscount);
    setShowDiscountModal(false);
  }, []);

  const handleRemoveDiscount = useCallback(() => {
    setDiscount(null);
  }, []);

  const handleOrderComplete = useCallback((paymentData: PaymentData) => {
    const orderTotals = calculateCartTotals(cartItems, discount);
    const newOrder: Order = {
      id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      items: [...cartItems],
      discount: discount ? { ...discount } : null,
      subtotal: orderTotals.subtotal,
      discountAmount: orderTotals.discountAmount,
      tax: orderTotals.tax,
      total: paymentData.total,
      paymentMethod: paymentData.cash > 0 ? 'cash' : 'card',
      cashReceived: paymentData.cash,
      change: paymentData.change,
      timestamp: new Date(),
      staffId: 'CURRENT_USER', // This would come from authentication
      status: 'completed',
      reprintCount: 0
    };

    setOrders(prevOrders => [newOrder, ...prevOrders]);
    setPaymentData(paymentData);
    setShowReceipt(true);
  }, [cartItems, discount]);

  const handleReprintReceipt = useCallback((order: Order) => {
    // Update reprint count
    setOrders(prevOrders => 
      prevOrders.map(o => 
        o.id === order.id 
          ? { ...o, reprintCount: o.reprintCount + 1, lastReprint: new Date() }
          : o
      )
    );

    // Show receipt with order data
    setPaymentData({
      cash: order.cashReceived,
      total: order.total,
      change: order.change
    });
    setCartItems([...order.items]);
    setDiscount(order.discount ? { ...order.discount } : null);
    setShowReceipt(true);
    setShowOrderHistory(false);
  }, []);

  const totals = calculateCartTotals(cartItems, discount);

  // Show login modal if not authenticated
  if (!isAuthenticated) {
    return <LoginModal isOpen={true} />;
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return '👑';
      case 'manager': return '👔';
      case 'cashier': return '💰';
      case 'trainee': return '📚';
      default: return '👤';
    }
  };

  return (
    <>
      <div className="hide-print flex flex-row h-screen antialiased text-blue-gray-800">
        <div className="flex flex-row w-auto flex-shrink-0 pl-4 pr-2 py-4">
          <div className="flex flex-col items-center py-4 flex-shrink-0 w-20 bg-orange-500 rounded-3xl space-y-4">
            {/* User Profile Button */}
            <button
              onClick={() => setShowUserProfile(true)}
              className="p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl transition-colors"
              title={`${user?.firstName} ${user?.lastName} (${user?.role})`}
            >
              <div className="text-white text-lg">
                {getRoleIcon(user?.role || '')}
              </div>
            </button>

            {/* Admin Panel Button */}
            <ProtectedRoute 
              requiredPermissions={['menu.view', 'inventory.view', 'system.settings']}
              showError={false}
            >
              <button
                onClick={() => setShowAdminPanel(true)}
                className="p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl transition-colors"
                title="Admin Panel"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </ProtectedRoute>

            {/* Order History Button */}
            <ProtectedRoute 
              requiredPermissions={['sales.view_history']}
              showError={false}
            >
              <button
                onClick={() => setShowOrderHistory(true)}
                className="p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl transition-colors"
                title="Order History"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </ProtectedRoute>
          </div>
        </div>
        <div className="flex-grow flex">
          <div className="flex flex-col bg-blue-gray-50 h-full w-full py-4">
            <ProductSearch onSearch={(searchKey: string) => {
              setSearchKey(searchKey);
            }} />
            <div className="h-full overflow-hidden mt-4">
              <ProductMenu searchKey={searchKey} onSelect={addToCart} />
            </div>
          </div>
          <div className="w-5/12 flex flex-col bg-blue-gray-50 h-full bg-white pr-4 pl-2 py-4">
            <div className="bg-white rounded-3xl flex flex-col h-full shadow">
              <div className="flex-1 flex flex-col overflow-auto">
                <div className="h-16 text-center flex justify-center">
                  {
                    cartItems.length !== 0 &&
                    <>
                      <div className="pl-8 text-left text-lg py-4 relative">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                        <div className="text-center absolute bg-orange-500 text-white w-5 h-5 text-xs p-0 leading-5 rounded-full -right-2 top-3">
                          {totals.itemCount}
                        </div>
                      </div>
                      <div className="flex-grow px-8 text-right text-lg py-4 relative">
                        <button onClick={clearCart} className="text-blue-gray-300 hover:text-pink-500 focus:outline-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                    </>
                  }
                </div>
                <Cart 
                  items={cartItems} 
                  discount={discount}
                  onCartUpdate={setCartItems}
                  onDiscountClick={user?.permissions.includes('sales.apply_discount') ? () => setShowDiscountModal(true) : undefined}
                  showTotals={false}
                />
              </div>
              <RoleBasedWrapper requiredPermissions={['sales.process']}>
                <Checkout 
                  items={cartItems} 
                  discount={discount}
                  onSubmit={handleOrderComplete}
                  onDiscountClick={user?.permissions.includes('sales.apply_discount') ? () => setShowDiscountModal(true) : undefined}
                />
              </RoleBasedWrapper>
            </div>
          </div>
        </div>
        {
          showReceipt && paymentData &&
          <Receipt 
            cash={paymentData.cash} 
            total={paymentData.total}
            change={paymentData.change}
            items={cartItems}
            discount={discount}
            paymentMethod={paymentData.cash > 0 ? 'cash' : 'card'}
            orderId={orders.length > 0 ? orders[0].id : undefined}
            onProceed={() => {
              const receiptContent: any = document.getElementById('receipt-content');
              const printArea: any = document.getElementById('print-area');
              printArea.innerHTML = receiptContent.innerHTML;
              window.print();
              printArea.innerHTML = '';
              setShowReceipt(false);
              setPaymentData(null);
              clearCart();
            }}
            onClose={() => {
              setShowReceipt(false);
              setPaymentData(null);
            }}
            />
        }

        {/* Discount Modal */}
        <ProtectedRoute requiredPermissions={['sales.apply_discount']} showError={false}>
          <DiscountModal
            isOpen={showDiscountModal}
            onClose={() => setShowDiscountModal(false)}
            onApplyDiscount={handleApplyDiscount}
            subtotal={totals.subtotal}
            currentDiscount={discount}
          />
        </ProtectedRoute>
        
        {/* Order History */}
        <ProtectedRoute requiredPermissions={['sales.view_history']} showError={false}>
          {showOrderHistory && (
            <OrderHistory
              orders={orders}
              onReprintReceipt={handleReprintReceipt}
              onClose={() => setShowOrderHistory(false)}
            />
          )}
        </ProtectedRoute>

        {/* Admin Panel Overlay */}
        <ProtectedRoute requiredPermissions={['menu.view', 'inventory.view', 'system.settings']} showError={false}>
          {showAdminPanel && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="max-w-full max-h-full overflow-auto">
                <AdminPanel onClose={() => setShowAdminPanel(false)} />
              </div>
            </div>
          )}
        </ProtectedRoute>

        {/* User Profile Panel */}
        <UserProfilePanel
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
        />
      </div>
      <div id="print-area" className="print-area"></div>
    </>
  );
}

export default App;
