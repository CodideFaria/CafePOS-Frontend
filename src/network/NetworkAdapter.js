class NetworkAdapter {
    static #API_URL = 'http://localhost:8880';

    async #fetch(url, options) {
        return await fetch(url, options);
    }

    // Get authentication token from localStorage
    #getAuthToken() {
        const user = localStorage.getItem('cafepos_auth_state');
        if (user) {
            try {
                const userData = JSON.parse(user);
                return userData.token;
            } catch (error) {
                return null;
            }
        }
        return null;
    }

    async #request(method, endpoint, data = null, options = {}) {
        const url = new URL(endpoint, NetworkAdapter.#API_URL);
        const authToken = this.#getAuthToken();
        
        const fetchOptions = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
                ...options.headers,
            },
        };

        if (data) {
            if (method === 'GET') {
                Object.entries(data).forEach(([key, value]) => {
                    url.searchParams.append(key, value);
                });
            } else if (data instanceof FormData) {
                fetchOptions.body = data;
                delete fetchOptions.headers['Content-Type'];
            } else {
                fetchOptions.headers['Content-Type'] = 'application/json';
                fetchOptions.body = JSON.stringify(data);
            }
        }

        try {
            const response = await this.#fetch(url.toString(), fetchOptions);
            return await response.json();
        } catch (error) {
            return { data: {}, errors: [error.message] };
        }
    }

    get(endpoint, params = {}) {
        return this.#request('GET', endpoint, params);
    }

    post(endpoint, data = {}) {
        return this.#request('POST', endpoint, data);
    }

    put(endpoint, data = {}, options = {}) {
        return this.#request('PUT', endpoint, data, options);
    }

    delete(endpoint, data = null) {
        return this.#request('DELETE', endpoint, data);
    }

    patch(endpoint, data = {}) {
        return this.#request('PATCH', endpoint, data);
    }

    // Authentication and User Management APIs
    async authenticate(credentials) {
        return this.post('/auth/login', credentials);
    }

    async logout() {
        return this.post('/auth/logout');
    }

    async getCurrentUser() {
        return this.get('/auth/me');
    }

    async refreshToken() {
        return this.post('/auth/refresh');
    }

    // User Role Management APIs
    async getUsers() {
        return this.get('/users');
    }

    async getUser(userId) {
        return this.get(`/users/${userId}`);
    }

    async getUserRoles() {
        return this.get('/users/roles');
    }

    async getUserPermissions(userId) {
        return this.get(`/users/${userId}/permissions`);
    }

    async updateUserRole(userId, roleData) {
        return this.put(`/users/${userId}/role`, roleData);
    }

    async updateUserPermissions(userId, permissions) {
        return this.put(`/users/${userId}/permissions`, { permissions });
    }

    async createUser(userData) {
        return this.post('/users', userData);
    }

    async updateUser(userId, userData) {
        return this.put(`/users/${userId}`, userData);
    }

    async deactivateUser(userId) {
        return this.patch(`/users/${userId}/deactivate`);
    }

    async activateUser(userId) {
        return this.patch(`/users/${userId}/activate`);
    }

    // Role Management APIs
    async getRoles() {
        return this.get('/roles');
    }

    async getRole(roleId) {
        return this.get(`/roles/${roleId}`);
    }

    async createRole(roleData) {
        return this.post('/roles', roleData);
    }

    async updateRole(roleId, roleData) {
        return this.put(`/roles/${roleId}`, roleData);
    }

    async deleteRole(roleId) {
        return this.delete(`/roles/${roleId}`);
    }

    // Permission Management APIs
    async getPermissions() {
        return this.get('/permissions');
    }

    async getRolePermissions(role) {
        return this.get(`/permissions/role/${role}`);
    }

    // Security and Audit APIs
    async getAccessLog() {
        return this.get('/audit/access-log');
    }

    async getFailedLoginAttempts() {
        return this.get('/audit/failed-logins');
    }

    async reportSecurityIncident(incident) {
        return this.post('/security/incident', incident);
    }

    // Password Reset APIs
    async requestPasswordReset(email) {
        return this.post('/auth/password-reset-request', { email });
    }

    async validateResetToken(token) {
        return this.post('/auth/validate-reset-token', { token });
    }

    async confirmPasswordReset(token, newPassword) {
        return this.post('/auth/password-reset-confirm', { token, newPassword });
    }

    // Menu Management APIs
    async getMenuItems(params = {}) {
        return this.get('/menu_items', params);
    }

    async getMenuItem(itemId) {
        return this.get(`/menu_items/${itemId}`);
    }

    async createMenuItem(itemData) {
        return this.post('/menu_items', itemData);
    }

    async updateMenuItem(itemId, itemData) {
        return this.put(`/menu_items/${itemId}`, itemData);
    }

    async deleteMenuItem(itemId) {
        return this.delete(`/menu_items/${itemId}`);
    }

    async bulkImportMenu(formData) {
        return this.post('/menu_items/bulk-import', formData);
    }

    // Inventory Management APIs
    async getInventory() {
        return this.get('/inventory');
    }

    async getInventoryItem(itemId) {
        return this.get(`/inventory/${itemId}`);
    }

    async updateInventoryItem(itemId, itemData) {
        return this.put(`/inventory/${itemId}`, itemData);
    }

    async adjustInventoryStock(itemId, adjustmentData) {
        return this.post(`/inventory/${itemId}/adjust`, adjustmentData);
    }

    async exportInventory() {
        return this.get('/inventory/export');
    }

    // Orders and Sales APIs
    async createOrder(orderData) {
        return this.post('/orders', orderData);
    }

    async getOrders(params = {}) {
        return this.get('/orders', params);
    }

    async getOrder(orderId) {
        return this.get(`/orders/${orderId}`);
    }

    async refundOrder(orderId, refundData) {
        return this.post(`/orders/${orderId}/refund`, refundData);
    }

    async reprintReceipt(orderId) {
        return this.post(`/orders/${orderId}/reprint-receipt`);
    }

    // Reporting APIs
    async getSalesDashboard(params) {
        return this.get('/sales/dashboard', params);
    }

    async getDailySalesReport(date) {
        return this.get('/reports/daily-sales', { date });
    }

    async sendDailySalesEmail(emailData) {
        return this.post('/reports/email-daily-summary', emailData);
    }

    // Alerts APIs
    async getAlerts() {
        return this.get('/alerts');
    }

    async getAlert(alertId) {
        return this.get(`/alerts/${alertId}`);
    }

    async dismissAlert(alertId) {
        return this.patch(`/alerts/${alertId}/dismiss`);
    }

    // System APIs
    async getHealthStatus() {
        return this.get('/health');
    }

    async getSystemSettings() {
        return this.get('/settings');
    }

    async updateSystemSettings(settings) {
        return this.put('/settings', settings);
    }

    // Image Upload APIs
    async uploadMenuItemImage(formData) {
        return this.post('/upload/image', formData);
    }

    async uploadBulkImages(formData) {
        return this.post('/upload/bulk-images', formData);
    }

    async getImageManagement() {
        return this.get('/images/management');
    }

    async removeMenuItemImage(itemId) {
        return this.delete(`/images/management/${itemId}`);
    }
}

export const networkAdapter = new NetworkAdapter();