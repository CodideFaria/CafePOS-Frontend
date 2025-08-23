# CafePOS Backend API Specification

## Base Configuration

**Base URL**: `http://localhost:8880`  
**Content-Type**: `application/json`  
**Authentication**: Bearer token or user ID in headers  

### Standard Response Format
```json
{
  "data": {},
  "errors": [],
  "message": "Success message",
  "timestamp": "2025-01-20T10:30:00Z"
}
```

### Error Response Format
```json
{
  "data": {},
  "errors": ["Error message 1", "Error message 2"],
  "message": "Operation failed",
  "timestamp": "2025-01-20T10:30:00Z"
}
```

---

## 1. AUTHENTICATION ENDPOINTS

### POST /auth/login
**Purpose**: Authenticate user with username/password or PIN  
**Headers**: None required  

**Request Body**:
```json
{
  "username": "admin",           // Optional: for password login
  "password": "securepassword",  // Optional: for password login
  "pinCode": "1234",            // Optional: for PIN login
  "rememberMe": true            // Optional: extend session
}
```

**Success Response (200)**:
```json
{
  "data": {
    "user": {
      "id": "user-uuid-123",
      "username": "admin",
      "firstName": "John",
      "lastName": "Administrator",
      "email": "admin@cafepos.com",
      "role": "admin",
      "permissions": ["menu.view", "menu.create", "users.create"],
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "lastLogin": "2025-01-20T10:30:00Z",
      "shiftStartTime": null,
      "shiftEndTime": null
    },
    "token": "jwt-token-here",
    "sessionExpiry": "2025-01-20T18:30:00Z"
  },
  "errors": [],
  "message": "Login successful"
}
```

**Error Response (401)**:
```json
{
  "data": {},
  "errors": ["Invalid credentials"],
  "message": "Authentication failed"
}
```

**Error Response (423)** - Account Locked:
```json
{
  "data": {
    "lockoutUntil": "2025-01-20T10:45:00Z",
    "failedAttempts": 3
  },
  "errors": ["Account locked due to multiple failed attempts"],
  "message": "Account temporarily locked"
}
```

### POST /auth/logout
**Purpose**: Logout current user  
**Headers**: `Authorization: Bearer {token}` OR `X-User-ID: {userId}`  

**Request Body**: Empty `{}`

**Success Response (200)**:
```json
{
  "data": {},
  "errors": [],
  "message": "Logout successful"
}
```

### POST /auth/validate-session
**Purpose**: Validate current session token  
**Headers**: `Authorization: Bearer {token}`  

**Request Body**: Empty `{}`

**Success Response (200)**:
```json
{
  "data": {
    "user": { /* User object */ },
    "sessionValid": true,
    "sessionExpiry": "2025-01-20T18:30:00Z"
  },
  "errors": [],
  "message": "Session valid"
}
```

### POST /auth/password-reset-request
**Purpose**: Request password reset via email  

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Success Response (200)**:
```json
{
  "data": {
    "emailSent": true,
    "expiresIn": 3600
  },
  "errors": [],
  "message": "Password reset email sent"
}
```

### POST /auth/validate-reset-token
**Purpose**: Validate password reset token  

**Request Body**:
```json
{
  "token": "reset-token-uuid"
}
```

**Success Response (200)**:
```json
{
  "data": {
    "tokenValid": true,
    "expiresAt": "2025-01-20T11:30:00Z"
  },
  "errors": [],
  "message": "Token is valid"
}
```

### POST /auth/password-reset-confirm
**Purpose**: Confirm password reset with new password  

**Request Body**:
```json
{
  "token": "reset-token-uuid",
  "newPassword": "newSecurePassword123!"
}
```

**Success Response (200)**:
```json
{
  "data": {
    "passwordReset": true
  },
  "errors": [],
  "message": "Password reset successful"
}
```

---

## 2. MENU MANAGEMENT ENDPOINTS

### GET /menu_items
**Purpose**: Retrieve all menu items  
**Headers**: Optional authentication for admin features  

**Query Parameters**:
- `search`: string (optional) - Search term for fuzzy matching
- `category`: string (optional) - Filter by category
- `available`: boolean (optional) - Filter by availability

**Success Response (200)**:
```json
{
  "data": {
    "menu_items": [
      {
        "id": "item-uuid-123",
        "name": "Latte",
        "description": "Rich espresso with steamed milk",
        "category": "Coffee",
        "sizes": [
          {
            "id": "size-uuid-456",
            "name": "Small",
            "price": 4.50,
            "volume": "8oz"
          },
          {
            "id": "size-uuid-789",
            "name": "Large", 
            "price": 5.50,
            "volume": "12oz"
          }
        ],
        "image": "latte.jpg",
        "available": true,
        "allergens": ["milk"],
        "nutritionalInfo": {
          "calories": 150,
          "fat": 6,
          "sugar": 14
        },
        "preparationTime": 180,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2025-01-20T10:30:00Z"
      }
    ],
    "amount": 25,
    "categories": ["Coffee", "Tea", "Pastries", "Cold Drinks"]
  },
  "errors": [],
  "message": "Menu items retrieved successfully"
}
```

### POST /menu_items
**Purpose**: Create new menu item  
**Headers**: `Authorization: Bearer {token}` (requires `menu.create` permission)  

**Request Body**:
```json
{
  "name": "New Latte",
  "description": "Delicious coffee drink",
  "category": "Coffee",
  "sizes": [
    {
      "name": "Small",
      "price": 4.50,
      "volume": "8oz"
    }
  ],
  "image": "new-latte.jpg",
  "allergens": ["milk"],
  "nutritionalInfo": {
    "calories": 150,
    "fat": 6,
    "sugar": 14
  },
  "preparationTime": 180
}
```

**Success Response (201)**:
```json
{
  "data": {
    "menu_item": { /* Complete menu item object with ID */ }
  },
  "errors": [],
  "message": "Menu item created successfully"
}
```

### PUT /menu_items/{id}
**Purpose**: Update existing menu item  
**Headers**: `Authorization: Bearer {token}` (requires `menu.edit` permission)  

**Request Body**: Same as POST, all fields optional

**Success Response (200)**:
```json
{
  "data": {
    "menu_item": { /* Updated menu item object */ }
  },
  "errors": [],
  "message": "Menu item updated successfully"
}
```

### DELETE /menu_items/{id}
**Purpose**: Delete menu item  
**Headers**: `Authorization: Bearer {token}` (requires `menu.delete` permission)  

**Success Response (200)**:
```json
{
  "data": {
    "deleted": true,
    "id": "item-uuid-123"
  },
  "errors": [],
  "message": "Menu item deleted successfully"
}
```

### POST /menu_items/bulk-import
**Purpose**: Bulk import menu items from CSV  
**Headers**: `Authorization: Bearer {token}` (requires `menu.import` permission)  
**Content-Type**: `multipart/form-data`

**Form Data**:
- `file`: CSV file
- `skipDuplicates`: boolean (default: true)
- `updateExisting`: boolean (default: false)

**CSV Format Expected**:
```csv
name,description,category,size_name,size_price,size_volume,allergens,calories
Latte,Rich espresso,Coffee,Small,4.50,8oz,milk,150
Latte,Rich espresso,Coffee,Large,5.50,12oz,milk,180
```

**Success Response (200)**:
```json
{
  "data": {
    "imported": 15,
    "skipped": 3,
    "errors": 2,
    "details": [
      {
        "row": 5,
        "error": "Invalid price format",
        "data": "Espresso,Strong coffee,Coffee,Small,invalid,8oz,none,5"
      }
    ]
  },
  "errors": [],
  "message": "Bulk import completed"
}
```

---

## 3. INVENTORY MANAGEMENT ENDPOINTS

### GET /inventory
**Purpose**: Get inventory levels for all items  
**Headers**: `Authorization: Bearer {token}` (requires `inventory.view` permission)  

**Success Response (200)**:
```json
{
  "data": {
    "inventory": [
      {
        "id": "inv-uuid-123",
        "menuItemId": "item-uuid-123",
        "menuItemName": "Latte",
        "currentStock": 150,
        "minimumStock": 20,
        "maximumStock": 200,
        "unit": "servings",
        "costPerUnit": 2.50,
        "supplierId": "supplier-uuid-456",
        "supplierName": "Coffee Beans Ltd",
        "lastRestocked": "2025-01-18T14:30:00Z",
        "expiryDate": "2025-02-15T00:00:00Z",
        "isLowStock": false,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2025-01-18T14:30:00Z"
      }
    ],
    "lowStockItems": 3,
    "totalItems": 25
  },
  "errors": [],
  "message": "Inventory retrieved successfully"
}
```

### PUT /inventory/{id}
**Purpose**: Update inventory item  
**Headers**: `Authorization: Bearer {token}` (requires `inventory.edit` permission)  

**Request Body**:
```json
{
  "currentStock": 180,
  "minimumStock": 25,
  "maximumStock": 250,
  "costPerUnit": 2.75,
  "supplierId": "supplier-uuid-789",
  "expiryDate": "2025-03-01T00:00:00Z"
}
```

### POST /inventory/{id}/adjust
**Purpose**: Adjust inventory stock (restock/usage)  
**Headers**: `Authorization: Bearer {token}` (requires `inventory.adjust_stock` permission)  

**Request Body**:
```json
{
  "adjustment": 50,        // Positive for restock, negative for usage
  "reason": "RESTOCK",     // RESTOCK, SALE, WASTE, ADJUSTMENT
  "notes": "Weekly delivery from supplier",
  "reference": "PO-2025-001"
}
```

**Success Response (200)**:
```json
{
  "data": {
    "inventory": { /* Updated inventory object */ },
    "adjustment": {
      "id": "adj-uuid-123",
      "previousStock": 100,
      "newStock": 150,
      "adjustment": 50,
      "reason": "RESTOCK",
      "timestamp": "2025-01-20T10:30:00Z"
    }
  },
  "errors": [],
  "message": "Stock adjusted successfully"
}
```

### GET /inventory/export
**Purpose**: Export inventory data as CSV  
**Headers**: `Authorization: Bearer {token}` (requires `inventory.export` permission)  

**Success Response (200)**:
```
Content-Type: text/csv
Content-Disposition: attachment; filename="inventory-export-20250120.csv"

Item ID,Name,Current Stock,Minimum Stock,Cost Per Unit,Last Updated
item-uuid-123,Latte,150,20,2.50,2025-01-18T14:30:00Z
```

---

## 4. SALES & ORDERS ENDPOINTS

### POST /orders
**Purpose**: Create new order  
**Headers**: `Authorization: Bearer {token}` (requires `sales.process` permission)  

**Request Body**:
```json
{
  "items": [
    {
      "menuItemId": "item-uuid-123",
      "sizeId": "size-uuid-456",
      "quantity": 2,
      "unitPrice": 4.50,
      "customizations": ["extra shot", "oat milk"]
    }
  ],
  "subtotal": 9.00,
  "taxAmount": 1.35,
  "discountAmount": 0.50,
  "discountReason": "Student discount",
  "discountAppliedBy": "user-uuid-456",
  "total": 9.85,
  "paymentMethod": "CASH",
  "amountPaid": 10.00,
  "changeGiven": 0.15,
  "customerName": "John Doe",
  "orderNotes": "Extra hot"
}
```

**Success Response (201)**:
```json
{
  "data": {
    "order": {
      "id": "order-uuid-123",
      "orderNumber": "ORD-2025-001234",
      "items": [ /* Array of order items with full details */ ],
      "subtotal": 9.00,
      "taxAmount": 1.35,
      "discountAmount": 0.50,
      "total": 9.85,
      "paymentMethod": "CASH",
      "amountPaid": 10.00,
      "changeGiven": 0.15,
      "status": "PAID",
      "customerName": "John Doe",
      "orderNotes": "Extra hot",
      "createdBy": "user-uuid-789",
      "createdAt": "2025-01-20T10:30:00Z",
      "completedAt": "2025-01-20T10:30:00Z"
    },
    "inventoryUpdated": true,
    "receiptGenerated": true
  },
  "errors": [],
  "message": "Order created successfully"
}
```

### GET /orders
**Purpose**: Get order history  
**Headers**: `Authorization: Bearer {token}` (requires `sales.view_history` permission)  

**Query Parameters**:
- `limit`: number (default: 50, max: 200)
- `offset`: number (default: 0)
- `status`: string (optional) - Filter by status
- `date_from`: ISO date string (optional)
- `date_to`: ISO date string (optional)
- `payment_method`: string (optional)

**Success Response (200)**:
```json
{
  "data": {
    "orders": [ /* Array of order objects */ ],
    "pagination": {
      "total": 1250,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  },
  "errors": [],
  "message": "Orders retrieved successfully"
}
```

### POST /orders/{id}/refund
**Purpose**: Process order refund  
**Headers**: `Authorization: Bearer {token}` (requires `sales.refund` permission)  

**Request Body**:
```json
{
  "amount": 9.85,
  "reason": "Customer complaint",
  "refundMethod": "CASH",
  "items": ["all"] // or specific item IDs for partial refund
}
```

### POST /orders/{id}/reprint-receipt
**Purpose**: Reprint order receipt  
**Headers**: `Authorization: Bearer {token}` (requires `receipts.reprint` permission)  

**Request Body**: Empty `{}`

**Success Response (200)**:
```json
{
  "data": {
    "reprinted": true,
    "originalOrderDate": "2025-01-20T10:30:00Z",
    "reprintAllowed": true,
    "reprintCount": 1
  },
  "errors": [],
  "message": "Receipt reprinted successfully"
}
```

---

## 5. REPORTING & DASHBOARD ENDPOINTS

### GET /sales/dashboard
**Purpose**: Get sales dashboard data  
**Headers**: `Authorization: Bearer {token}` (requires `reports.view` permission)  

**Query Parameters**:
- `start_date`: ISO date string (required)
- `end_date`: ISO date string (required)
- `payment_method`: string (optional) - "all", "cash", "card"
- `category`: string (optional) - Filter by product category

**Success Response (200)**:
```json
{
  "data": {
    "metrics": {
      "totalRevenue": 15750.50,
      "dailyRevenue": 850.25,
      "weeklyRevenue": 5500.75,
      "monthlyRevenue": 15750.50,
      "totalTransactions": 245,
      "dailyTransactions": 18,
      "averageOrderValue": 64.29,
      "totalCustomers": 180,
      "returningCustomers": 108,
      "newCustomers": 72
    },
    "chartData": [
      {
        "date": "2025-01-01",
        "revenue": 800.50,
        "transactions": 15,
        "averageOrderValue": 53.37
      }
    ],
    "topProducts": [
      {
        "id": "item-uuid-123",
        "name": "Latte",
        "category": "Coffee",
        "quantitySold": 45,
        "revenue": 202.50,
        "profitMargin": 65.0
      }
    ],
    "categoryBreakdown": [
      {
        "category": "Coffee",
        "revenue": 10000.00,
        "percentage": 63.5,
        "transactions": 150,
        "averageOrderValue": 66.67,
        "color": "#8B4513"
      }
    ],
    "hourlyBreakdown": [
      {
        "hour": 8,
        "revenue": 450.00,
        "transactions": 8,
        "label": "08:00"
      }
    ],
    "comparisonData": {
      "previousPeriod": {
        "revenue": 14250.00,
        "transactions": 220,
        "averageOrderValue": 64.77
      },
      "percentageChange": {
        "revenue": 10.5,
        "transactions": 11.4,
        "averageOrderValue": -0.7
      }
    }
  },
  "errors": [],
  "message": "Dashboard data retrieved successfully"
}
```

### GET /reports/daily-sales
**Purpose**: Get daily sales summary  
**Headers**: `Authorization: Bearer {token}` (requires `reports.view` permission)  

**Query Parameters**:
- `date`: ISO date string (optional, defaults to today)

**Success Response (200)**:
```json
{
  "data": {
    "date": "2025-01-20",
    "summary": {
      "totalRevenue": 1250.75,
      "totalTransactions": 28,
      "averageOrderValue": 44.67,
      "taxCollected": 187.61,
      "discountsGiven": 35.50,
      "refundsProcessed": 12.00,
      "paymentMethods": {
        "cash": 750.25,
        "card": 500.50
      }
    },
    "hourlyBreakdown": [ /* Hourly sales data */ ],
    "topSellingItems": [ /* Top items for the day */ ],
    "staffPerformance": [
      {
        "userId": "user-uuid-123",
        "name": "John Cashier",
        "transactions": 15,
        "revenue": 675.50,
        "averageOrderValue": 45.03
      }
    ]
  },
  "errors": [],
  "message": "Daily sales report retrieved successfully"
}
```

### POST /reports/email-daily-summary
**Purpose**: Send daily sales summary via email  
**Headers**: `Authorization: Bearer {token}` (requires `reports.export` permission)  

**Request Body**:
```json
{
  "date": "2025-01-20",
  "recipients": ["manager@cafepos.com", "owner@cafepos.com"],
  "includeDetails": true
}
```

**Success Response (200)**:
```json
{
  "data": {
    "emailSent": true,
    "recipients": ["manager@cafepos.com", "owner@cafepos.com"],
    "timestamp": "2025-01-20T07:00:00Z"
  },
  "errors": [],
  "message": "Daily summary email sent successfully"
}
```

---

## 6. USER MANAGEMENT ENDPOINTS

### GET /users
**Purpose**: Get all users  
**Headers**: `Authorization: Bearer {token}` (requires `users.view` permission)  

**Success Response (200)**:
```json
{
  "data": {
    "users": [
      {
        "id": "user-uuid-123",
        "username": "admin",
        "firstName": "John",
        "lastName": "Administrator", 
        "email": "admin@cafepos.com",
        "role": "admin",
        "permissions": ["menu.view", "menu.create"],
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00Z",
        "lastLogin": "2025-01-20T10:30:00Z"
      }
    ]
  },
  "errors": [],
  "message": "Users retrieved successfully"
}
```

### POST /users
**Purpose**: Create new user  
**Headers**: `Authorization: Bearer {token}` (requires `users.create` permission)  

**Request Body**:
```json
{
  "username": "newuser",
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@cafepos.com",
  "role": "cashier",
  "pinCode": "5678",
  "password": "temporaryPassword123!",
  "permissions": ["menu.view", "sales.process"]
}
```

### PUT /users/{id}
**Purpose**: Update user  
**Headers**: `Authorization: Bearer {token}` (requires `users.edit` permission)  

### DELETE /users/{id}
**Purpose**: Delete/deactivate user  
**Headers**: `Authorization: Bearer {token}` (requires `users.delete` permission)  

---

## 7. SYSTEM ENDPOINTS

### GET /health
**Purpose**: Health check endpoint  
**Headers**: None required  

**Success Response (200)**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T10:30:00Z",
  "services": {
    "database": "connected",
    "printer": "ready",
    "email": "configured"
  },
  "version": "1.0.0"
}
```

### GET /settings
**Purpose**: Get system settings  
**Headers**: `Authorization: Bearer {token}` (requires `system.settings` permission)  

### PUT /settings
**Purpose**: Update system settings  
**Headers**: `Authorization: Bearer {token}` (requires `system.settings` permission)  

---

## 8. ERROR CODES REFERENCE

| HTTP Code | Error Type | Description |
|-----------|------------|-------------|
| 400 | Bad Request | Invalid request format or missing required fields |
| 401 | Unauthorized | Invalid credentials or missing authentication |
| 403 | Forbidden | Insufficient permissions for the requested action |
| 404 | Not Found | Requested resource does not exist |
| 409 | Conflict | Resource already exists (e.g., duplicate menu item) |
| 422 | Unprocessable Entity | Valid format but business logic validation failed |
| 423 | Locked | Account locked due to security reasons |
| 429 | Too Many Requests | Rate limiting triggered |
| 500 | Internal Server Error | Unexpected server error |

---

## 9. RATE LIMITING

**Authentication endpoints**: 5 requests per minute per IP  
**General API**: 100 requests per minute per user  
**Bulk operations**: 10 requests per minute per user  

## 10. PAGINATION

All list endpoints support pagination:
- `limit`: Maximum items per page (default: 50, max: 200)
- `offset`: Number of items to skip (default: 0)

## 11. WEBSOCKET ENDPOINTS (Future Enhancement)

**Connection**: `ws://localhost:8880/ws`  
**Purpose**: Real-time updates for dashboard, inventory alerts, and order status  

**Message Types**:
- `inventory_alert`: Low stock notifications
- `dashboard_update`: Real-time metrics updates
- `order_update`: Order status changes