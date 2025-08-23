# CafePOS Backend API Documentation

This document provides a comprehensive overview of the CafePOS backend API endpoints, including their methods, descriptions, request formats, and response structures.

**Base URL:** (Assumed to be the root of your Tornado application, e.g., `http://localhost:8880`)

---

## Users API

### 1. Get All Users

*   **Endpoint:** `/users`
*   **Method:** `GET`
*   **Description:** Retrieves a list of all users.
*   **Authentication:** Not explicitly implemented in the provided handlers, but typically would require authentication (e.g., admin access) in a production system.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
*   **Response (Success - 200 OK):**
    ```json
    {
        "amount": 10, // Example: total number of users
        "users": [
            {
                "id": "string (uuid)",
                "username": "string",
                "role_id": "string (uuid)",
                "pin": "string | null",
                "is_active": "boolean",
                "created_at": "string (ISO 8601 datetime)",
                "updated_at": "string (ISO 8601 datetime)"
            }
        ]
    }
    ```
*   **Response (Error):**
    *   No specific error responses defined in the handler for GET all users.

### 2. Create User

*   **Endpoint:** `/users`
*   **Method:** `POST`
*   **Description:** Creates a new user.
*   **Authentication:** Not explicitly implemented in the provided handlers, but typically would require authentication (e.g., admin access) in a production system.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Body:**
        ```json
        {
            "username": "string",
            "hashed_password": "string",
            "role_id": "string (uuid)",
            "pin": "string (optional, max 10 chars)"
        }
        ```
*   **Response (Success - 201 Created):**
    ```json
    {
        "id": "string (uuid)",
        "username": "string",
        "role_id": "string (uuid)",
        "pin": "string | null",
        "is_active": "boolean",
        "created_at": "string (ISO 8601 datetime)",
        "updated_at": "string (ISO 8601 datetime)"
    }
    ```
*   **Response (Error - 400 Bad Request):**
    ```json
    {
        "error": "Missing required user data"
    }
    ```

### 3. Get User by ID

*   **Endpoint:** `/users/{id}`
*   **Method:** `GET`
*   **Description:** Retrieves a single user by their ID.
*   **Authentication:** Not explicitly implemented in the provided handlers, but typically would require authentication in a production system.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
*   **Response (Success - 200 OK):**
    ```json
    {
        "id": "string (uuid)",
        "username": "string",
        "role_id": "string (uuid)",
        "pin": "string | null",
        "is_active": "boolean",
        "created_at": "string (ISO 8601 datetime)",
        "updated_at": "string (ISO 8601 datetime)"
    }
    ```
*   **Response (Error - 404 Not Found):**
    ```json
    {
        "error": "User not found"
    }
    ```

### 4. Update User by ID

*   **Endpoint:** `/users/{id}`
*   **Method:** `PUT`
*   **Description:** Updates an existing user's information by their ID.
*   **Authentication:** Not explicitly implemented in the provided handlers, but typically would require authentication (e.g., admin access or user updating their own profile) in a production system.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Body:**
        ```json
        {
            "username": "string (optional)",
            "hashed_password": "string (optional)",
            "role_id": "string (uuid, optional)",
            "pin": "string (optional, max 10 chars)",
            "is_active": "boolean (optional)"
        }
        ```
        *Note: Any field can be updated. `pin` and `is_active` can be set to `null` or `false` respectively if provided.*
*   **Response (Success - 200 OK):**
    ```json
    {
        "id": "string (uuid)",
        "username": "string",
        "role_id": "string (uuid)",
        "pin": "string | null",
        "is_active": "boolean",
        "created_at": "string (ISO 8601 datetime)",
        "updated_at": "string (ISO 8601 datetime)"
    }
    ```
*   **Response (Error - 404 Not Found):**
    ```json
    {
        "error": "User not found"
    }
    ```

### 5. Delete User by ID

*   **Endpoint:** `/users/{id}`
*   **Method:** `DELETE`
*   **Description:** Deletes a user by their ID.
*   **Authentication:** Not explicitly implemented in the provided handlers, but typically would require authentication (e.g., admin access) in a production system.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
*   **Response (Success - 204 No Content):**
    *   No content returned.
*   **Response (Error - 404 Not Found):**
    ```json
    {
        "error": "User not found"
    }
    ```

---

## Roles API

### 1. Get All Roles

*   **Endpoint:** `/roles`
*   **Method:** `GET`
*   **Description:** Retrieves a list of all roles.
*   **Authentication:** Not explicitly implemented in the provided handlers, but typically would require authentication (e.g., admin access) in a production system.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
*   **Response (Success - 200 OK):**
    ```json
    {
        "amount": 3, // Example: total number of roles
        "roles": [
            {
                "id": "string (uuid)",
                "name": "string",
                "description": "string | null"
            }
        ]
    }
    ```
*   **Response (Error):**
    *   No specific error responses defined in the handler for GET all roles.

### 2. Create Role

*   **Endpoint:** `/roles`
*   **Method:** `POST`
*   **Description:** Creates a new role.
*   **Authentication:** Not explicitly implemented in the provided handlers, but typically would require authentication (e.g., admin access) in a production system.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Body:**
        ```json
        {
            "name": "string",
            "description": "string (optional)"
        }
        ```
*   **Response (Success - 201 Created):**
    ```json
    {
        "id": "string (uuid)",
        "name": "string",
        "description": "string | null"
    }
    ```
*   **Response (Error - 400 Bad Request):**
    ```json
    {
        "error": "Name is required"
    }
    ```

### 3. Get Role by ID

*   **Endpoint:** `/roles/{id}`
*   **Method:** `GET`
*   **Description:** Retrieves a single role by its ID.
*   **Authentication:** Not explicitly implemented in the provided handlers, but typically would require authentication in a production system.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
*   **Response (Success - 200 OK):**
    ```json
    {
        "id": "string (uuid)",
        "name": "string",
        "description": "string | null"
    }
    ```
*   **Response (Error - 404 Not Found):**
    ```json
    {
        "error": "Role not found"
    }
    ```

### 4. Update Role by ID

*   **Endpoint:** `/roles/{id}`
*   **Method:** `PUT`
*   **Description:** Updates an existing role's information by its ID.
*   **Authentication:** Not explicitly implemented in the provided handlers, but typically would require authentication (e.g., admin access) in a production system.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Body:**
        ```json
        {
            "name": "string (optional)",
            "description": "string (optional)"
        }
        ```
*   **Response (Success - 200 OK):**
    ```json
    {
        "id": "string (uuid)",
        "name": "string",
        "description": "string | null"
    }
    ```
*   **Response (Error - 404 Not Found):**
    ```json
    {
        "error": "Role not found"
    }
    ```

### 5. Delete Role by ID

*   **Endpoint:** `/roles/{id}`
*   **Method:** `DELETE`
*   **Description:** Deletes a role by its ID.
*   **Authentication:** Not explicitly implemented in the provided handlers, but typically would require authentication (e.g., admin access) in a production system.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
*   **Response (Success - 204 No Content):**
    *   No content returned.
*   **Response (Error - 404 Not Found):**
    ```json
    {
        "error": "Role not found"
    }
    ```

---

## Menu API

### 1. Get All Menu Items

*   **Endpoint:** `/menu_items`
*   **Method:** `GET`
*   **Description:** Retrieves a list of all menu items.
*   **Authentication:** Not explicitly implemented in the provided handlers.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
*   **Response (Success - 200 OK):**
    ```json
    {
        "amount": 50, // Example: total number of menu items
        "menu_items": [
            {
                "id": "string (uuid)",
                "name": "string",
                "size": "string",
                "price": "float",
                "is_active": "boolean",
                "created_at": "string (ISO 8601 datetime)",
                "updated_at": "string (ISO 8601 datetime)"
            }
        ]
    }
    ```
*   **Response (Error):**
    *   No specific error responses defined in the handler for GET all menu items.

### 2. Create Menu Item

*   **Endpoint:** `/menu_items`
*   **Method:** `POST`
*   **Description:** Creates a new menu item.
*   **Authentication:** Not explicitly implemented in the provided handlers, but likely requires authentication (e.g., admin/manager access) in a production system.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Body:**
        ```json
        {
            "name": "string",
            "size": "string",
            "price": "float"
        }
        ```
*   **Response (Success - 201 Created):**
    ```json
    {
        "id": "string (uuid)",
        "name": "string",
        "size": "string",
        "price": "float",
        "is_active": "boolean",
        "created_at": "string (ISO 8601 datetime)",
        "updated_at": "string (ISO 8601 datetime)"
    }
    ```
*   **Response (Error - 400 Bad Request):**
    ```json
    {
        "error": "Invalid data" // Occurs if name, size, price are missing or price <= 0
    }
    ```

### 3. Get Menu Item by ID

*   **Endpoint:** `/menu_items/{id}`
*   **Method:** `GET`
*   **Description:** Retrieves a single menu item by its ID.
*   **Authentication:** Not explicitly implemented in the provided handlers.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
*   **Response (Success - 200 OK):**
    ```json
    {
        "id": "string (uuid)",
        "name": "string",
        "size": "string",
        "price": "float",
        "is_active": "boolean",
        "created_at": "string (ISO 8601 datetime)",
        "updated_at": "string (ISO 8601 datetime)"
    }
    ```
*   **Response (Error - 404 Not Found):**
    ```json
    {
        "error": "Menu item not found"
    }
    ```

### 4. Update Menu Item by ID

*   **Endpoint:** `/menu_items/{id}`
*   **Method:** `PUT`
*   **Description:** Updates an existing menu item's information by its ID.
*   **Authentication:** Not explicitly implemented in the provided handlers, but likely requires authentication (e.g., admin/manager access) in a production system.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Body:**
        ```json
        {
            "name": "string (optional)",
            "size": "string (optional)",
            "price": "float (optional)",
            "is_active": "boolean (optional)"
        }
        ```
*   **Response (Success - 200 OK):**
    ```json
    {
        "id": "string (uuid)",
        "name": "string",
        "size": "string",
        "price": "float",
        "is_active": "boolean",
        "created_at": "string (ISO 8601 datetime)",
        "updated_at": "string (ISO 8601 datetime)"
    }
    ```
*   **Response (Error - 404 Not Found):**
    ```json
    {
        "error": "Menu item not found"
    }
    ```

### 5. Delete Menu Item by ID

*   **Endpoint:** `/menu_items/{id}`
*   **Method:** `DELETE`
*   **Description:** Deletes a menu item by its ID.
*   **Authentication:** Not explicitly implemented in the provided handlers, but likely requires authentication (e.g., admin/manager access) in a production system.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
*   **Response (Success - 204 No Content):**
    *   No content returned.
*   **Response (Error - 404 Not Found):**
    ```json
    {
        "error": "Menu item not found"
    }
    ```

---

## Inventory API

### 1. Get All Inventory Items

*   **Endpoint:** `/inventory_items`
*   **Method:** `GET`
*   **Description:** Retrieves a list of all inventory items.
*   **Authentication:** Not explicitly implemented in the provided handlers.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
*   **Response (Success - 200 OK):**
    ```json
    {
        "amount": 25, // Example: total number of inventory items
        "inventory_items": [
            {
                "id": "string (uuid)",
                "menu_item_id": "string (uuid)",
                "quantity": "integer",
                "low_stock_threshold": "integer",
                "last_updated": "string (ISO 8601 datetime)"
            }
        ]
    }
    ```
*   **Response (Error):**
    *   No specific error responses defined in the handler for GET all inventory items.

### 2. Create Inventory Item

*   **Endpoint:** `/inventory_items`
*   **Method:** `POST`
*   **Description:** Creates a new inventory item.
*   **Authentication:** Not explicitly implemented in the provided handlers, but likely requires authentication (e.g., admin/manager access) in a production system.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Body:**
        ```json
        {
            "menu_item_id": "string (uuid)",
            "quantity": "integer",
            "low_stock_threshold": "integer (optional, default: 10)"
        }
        ```
*   **Response (Success - 201 Created):**
    ```json
    {
        "id": "string (uuid)",
        "menu_item_id": "string (uuid)",
        "quantity": "integer",
        "low_stock_threshold": "integer",
        "last_updated": "string (ISO 8601 datetime)"
    }
    ```
*   **Response (Error - 400 Bad Request):**
    ```json
    {
        "error": "Invalid data" // Occurs if menu_item_id or quantity is missing
    }
    ```

### 3. Get Inventory Item by ID

*   **Endpoint:** `/inventory_items/{id}`
*   **Method:** `GET`
*   **Description:** Retrieves a single inventory item by its ID.
*   **Authentication:** Not explicitly implemented in the provided handlers.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
*   **Response (Success - 200 OK):**
    ```json
    {
        "id": "string (uuid)",
        "menu_item_id": "string (uuid)",
        "quantity": "integer",
        "low_stock_threshold": "integer",
        "last_updated": "string (ISO 8601 datetime)"
    }
    ```
*   **Response (Error - 404 Not Found):**
    ```json
    {
        "error": "Inventory item not found"
    }
    ```

### 4. Update Inventory Item by ID

*   **Endpoint:** `/inventory_items/{id}`
*   **Method:** `PUT`
*   **Description:** Updates an existing inventory item's information by its ID.
*   **Authentication:** Not explicitly implemented in the provided handlers, but likely requires authentication (e.g., admin/manager access) in a production system.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Body:**
        ```json
        {
            "menu_item_id": "string (uuid, optional)",
            "quantity": "integer (optional)",
            "low_stock_threshold": "integer (optional)"
        }
        ```
*   **Response (Success - 200 OK):**
    ```json
    {
        "id": "string (uuid)",
        "menu_item_id": "string (uuid)",
        "quantity": "integer",
        "low_stock_threshold": "integer",
        "last_updated": "string (ISO 8601 datetime)"
    }
    ```
*   **Response (Error - 404 Not Found):**
    ```json
    {
        "error": "Inventory item not found"
    }
    ```

### 5. Delete Inventory Item by ID

*   **Endpoint:** `/inventory_items/{id}`
*   **Method:** `DELETE`
*   **Description:** Deletes an inventory item by its ID.
*   **Authentication:** Not explicitly implemented in the provided handlers, but likely requires authentication (e.g., admin/manager access) in a production system.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
*   **Response (Success - 204 No Content):**
    *   No content returned.
*   **Response (Error - 404 Not Found):**
    ```json
    {
        "error": "Inventory item not found"
    }
    ```

---

## Orders API

### 1. Get All Orders

*   **Endpoint:** `/orders`
*   **Method:** `GET`
*   **Description:** Retrieves a list of all orders.
*   **Authentication:** Not explicitly implemented in the provided handlers.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
*   **Response (Success - 200 OK):**
    ```json
    {
        "amount": 100, // Example: total number of orders
        "orders": [
            {
                "id": "string (uuid)",
                "user_id": "string (uuid)",
                "order_time": "string (ISO 8601 datetime)",
                "subtotal": "float",
                "tax": "float",
                "total": "float",
                "discount_amount": "float",
                "discount_reason": "string | null",
                "status": "string"
            }
        ]
    }
    ```
*   **Response (Error):**
    *   No specific error responses defined in the handler for GET all orders.

### 2. Create Order

*   **Endpoint:** `/orders`
*   **Method:** `POST`
*   **Description:** Creates a new order.
*   **Authentication:** Not explicitly implemented in the provided handlers, but likely requires authentication.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Body:**
        ```json
        {
            "user_id": "string (uuid)",
            "subtotal": "float",
            "tax": "float",
            "total": "float",
            "discount_amount": "float (optional, default: 0.0)",
            "discount_reason": "string (optional)",
            "status": "string (optional, default: \"PAID\")"
        }
        ```
*   **Response (Success - 201 Created):**
    ```json
    {
        "id": "string (uuid)",
        "user_id": "string (uuid)",
        "order_time": "string (ISO 8601 datetime)",
        "subtotal": "float",
        "tax": "float",
        "total": "float",
        "discount_amount": "float",
        "discount_reason": "string | null",
        "status": "string"
    }
    ```
*   **Response (Error - 400 Bad Request):**
    ```json
    {
        "error": "Missing required order data" // Occurs if user_id, subtotal, tax, or total are missing
    }
    ```

### 3. Get Order by ID

*   **Endpoint:** `/orders/{id}`
*   **Method:** `GET`
*   **Description:** Retrieves a single order by its ID.
*   **Authentication:** Not explicitly implemented in the provided handlers.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
*   **Response (Success - 200 OK):**
    ```json
    {
        "id": "string (uuid)",
        "user_id": "string (uuid)",
        "order_time": "string (ISO 8601 datetime)",
        "subtotal": "float",
        "tax": "float",
        "total": "float",
        "discount_amount": "float",
        "discount_reason": "string | null",
        "status": "string"
    }
    ```
*   **Response (Error - 404 Not Found):**
    ```json
    {
        "error": "Order not found"
    }
    ```

### 4. Update Order by ID

*   **Endpoint:** `/orders/{id}`
*   **Method:** `PUT`
*   **Description:** Updates an existing order's information by its ID.
*   **Authentication:** Not explicitly implemented in the provided handlers, but likely requires authentication.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Body:**
        ```json
        {
            "user_id": "string (uuid, optional)",
            "subtotal": "float (optional)",
            "tax": "float (optional)",
            "total": "float (optional)",
            "discount_amount": "float (optional)",
            "discount_reason": "string (optional)",
            "status": "string (optional)"
        }
        ```
*   **Response (Success - 200 OK):**
    ```json
    {
        "id": "string (uuid)",
        "user_id": "string (uuid)",
        "order_time": "string (ISO 8601 datetime)",
        "subtotal": "float",
        "tax": "float",
        "total": "float",
        "discount_amount": "float",
        "discount_reason": "string | null",
        "status": "string"
    }
    ```
*   **Response (Error - 404 Not Found):**
    ```json
    {
        "error": "Order not found"
    }
    ```

### 5. Delete Order by ID

*   **Endpoint:** `/orders/{id}`
*   **Method:** `DELETE`
*   **Description:** Deletes an order by its ID.
*   **Authentication:** Not explicitly implemented in the provided handlers, but likely requires authentication.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
*   **Response (Success - 204 No Content):**
    *   No content returned.
*   **Response (Error - 404 Not Found):**
    ```json
    {
        "error": "Order not found"
    }
    ```

---

## Order Items API

### 1. Get All Order Items

*   **Endpoint:** `/order_items`
*   **Method:** `GET`
*   **Description:** Retrieves a list of all order items.
*   **Authentication:** Not explicitly implemented in the provided handlers.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
*   **Response (Success - 200 OK):**
    ```json
    {
        "amount": 200, // Example: total number of order items
        "order_items": [
            {
                "id": "string (uuid)",
                "order_id": "string (uuid)",
                "menu_item_id": "string (uuid)",
                "quantity": "integer",
                "price_at_time_of_sale": "float"
            }
        ]
    }
    ```
*   **Response (Error):**
    *   No specific error responses defined in the handler for GET all order items.

### 2. Create Order Item

*   **Endpoint:** `/order_items`
*   **Method:** `POST`
*   **Description:** Creates a new order item.
*   **Authentication:** Not explicitly implemented in the provided handlers, but likely requires authentication.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Body:**
        ```json
        {
            "order_id": "string (uuid)",
            "menu_item_id": "string (uuid)",
            "quantity": "integer",
            "price_at_time_of_sale": "float"
        }
        ```
*   **Response (Success - 201 Created):**
    ```json
    {
        "id": "string (uuid)",
        "order_id": "string (uuid)",
        "menu_item_id": "string (uuid)",
        "quantity": "integer",
        "price_at_time_of_sale": "float"
    }
    ```
*   **Response (Error - 400 Bad Request):**
    ```json
    {
        "error": "Missing required order item data" // Occurs if order_id, menu_item_id, quantity, or price_at_time_of_sale are missing
    }
    ```

### 3. Get Order Item by ID

*   **Endpoint:** `/order_items/{id}`
*   **Method:** `GET`
*   **Description:** Retrieves a single order item by its ID.
*   **Authentication:** Not explicitly implemented in the provided handlers.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
*   **Response (Success - 200 OK):**
    ```json
    {
        "id": "string (uuid)",
        "order_id": "string (uuid)",
        "menu_item_id": "string (uuid)",
        "quantity": "integer",
        "price_at_time_of_sale": "float"
    }
    ```
*   **Response (Error - 404 Not Found):**
    ```json
    {
        "error": "Order item not found"
    }
    ```

### 4. Update Order Item by ID

*   **Endpoint:** `/order_items/{id}`
*   **Method:** `PUT`
*   **Description:** Updates an existing order item's information by its ID.
*   **Authentication:** Not explicitly implemented in the provided handlers, but likely requires authentication.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Body:**
        ```json
        {
            "order_id": "string (uuid, optional)",
            "menu_item_id": "string (uuid, optional)",
            "quantity": "integer (optional)",
            "price_at_time_of_sale": "float (optional)"
        }
        ```
*   **Response (Success - 200 OK):**
    ```json
    {
        "id": "string (uuid)",
        "order_id": "string (uuid)",
        "menu_item_id": "string (uuid)",
        "quantity": "integer",
        "price_at_time_of_sale": "float"
    }
    ```
*   **Response (Error - 404 Not Found):**
    ```json
    {
        "error": "Order item not found"
    }
    ```

### 5. Delete Order Item by ID

*   **Endpoint:** `/order_items/{id}`
*   **Method:** `DELETE`
*   **Description:** Deletes an order item by its ID.
*   **Authentication:** Not explicitly implemented in the provided handlers, but likely requires authentication.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
*   **Response (Success - 204 No Content):**
    *   No content returned.
*   **Response (Error - 404 Not Found):**
    ```json
    {
        "error": "Order item not found"
    }
    ```

---

## Alerts API

### 1. Get All Alerts

*   **Endpoint:** `/alerts`
*   **Method:** `GET`
*   **Description:** Retrieves a list of all alerts.
*   **Authentication:** Not explicitly implemented in the provided handlers.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
*   **Response (Success - 200 OK):**
    ```json
    {
        "amount": 5, // Example: total number of alerts
        "alerts": [
            {
                "id": "string (uuid)",
                "inventory_item_id": "string (uuid)",
                "alert_time": "string (ISO 8601 datetime)",
                "alert_type": "string",
                "notification_sent": "boolean",
                "notification_method": "string | null"
            }
        ]
    }
    ```
*   **Response (Error):**
    *   No specific error responses defined in the handler for GET all alerts.

### 2. Create Alert

*   **Endpoint:** `/alerts`
*   **Method:** `POST`
*   **Description:** Creates a new alert.
*   **Authentication:** Not explicitly implemented in the provided handlers, but likely requires authentication.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Body:**
        ```json
        {
            "inventory_item_id": "string (uuid)",
            "alert_type": "string",
            "notification_sent": "boolean (optional, default: false)",
            "notification_method": "string (optional)"
        }
        ```
*   **Response (Success - 201 Created):**
    ```json
    {
        "id": "string (uuid)",
        "inventory_item_id": "string (uuid)",
        "alert_time": "string (ISO 8601 datetime)",
        "alert_type": "string",
        "notification_sent": "boolean",
        "notification_method": "string | null"
    }
    ```
*   **Response (Error - 400 Bad Request):**
    ```json
    {
        "error": "Missing required alert data" // Occurs if inventory_item_id or alert_type are missing
    }
    ```

### 3. Get Alert by ID

*   **Endpoint:** `/alerts/{id}`
*   **Method:** `GET`
*   **Description:** Retrieves a single alert by its ID.
*   **Authentication:** Not explicitly implemented in the provided handlers.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
*   **Response (Success - 200 OK):**
    ```json
    {
        "id": "string (uuid)",
        "inventory_item_id": "string (uuid)",
        "alert_time": "string (ISO 8601 datetime)",
        "alert_type": "string",
        "notification_sent": "boolean",
        "notification_method": "string | null"
    }
    ```
*   **Response (Error - 404 Not Found):**
    ```json
    {
        "error": "Alert not found"
    }
    ```

### 4. Update Alert by ID

*   **Endpoint:** `/alerts/{id}`
*   **Method:** `PUT`
*   **Description:** Updates an existing alert's information by its ID.
*   **Authentication:** Not explicitly implemented in the provided handlers, but likely requires authentication.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Body:**
        ```json
        {
            "inventory_item_id": "string (uuid, optional)",
            "alert_type": "string (optional)",
            "notification_sent": "boolean (optional)",
            "notification_method": "string (optional)"
        }
        ```
*   **Response (Success - 200 OK):**
    ```json
    {
        "id": "string (uuid)",
        "inventory_item_id": "string (uuid)",
        "alert_time": "string (ISO 8601 datetime)",
        "alert_type": "string",
        "notification_sent": "boolean",
        "notification_method": "string | null"
    }
    ```
*   **Response (Error - 404 Not Found):**
    ```json
    {
        "error": "Alert not found"
    }
    ```

### 5. Delete Alert by ID

*   **Endpoint:** `/alerts/{id}`
*   **Method:** `DELETE`
*   **Description:** Deletes an alert by its ID.
*   **Authentication:** Not explicitly implemented in the provided handlers, but likely requires authentication.
*   **Request:**
    *   **Headers:**
        *   `Content-Type: application/json`
*   **Response (Success - 204 No Content):**
    *   No content returned.
*   **Response (Error - 404 Not Found):**
    ```json
    {
        "error": "Alert not found"
    }
    ```
