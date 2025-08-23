class NetworkAdapter {
    static #API_URL = 'http://localhost:8880';

    async #fetch(url, options) {
        return await fetch(url, options);
    }

    // Get authentication token from localStorage
    #getAuthToken() {
        const user = localStorage.getItem('cafepos_user');
        if (user) {
            try {
                const userData = JSON.parse(user);
                return userData.id; // Using user ID as token for demo
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
}

export const networkAdapter = new NetworkAdapter();