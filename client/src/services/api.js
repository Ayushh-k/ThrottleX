const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('throttlex_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me'),
  updateProfile: (payload) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(payload) }),

  // Dashboard
  getDashboardData: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/dashboard${q ? `?${q}` : ''}`);
  },

  // Bikes
  getBikes: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/bikes${q ? `?${q}` : ''}`);
  },
  getBikeById: (id) => request(`/bikes/${id}`),
  createBike: (payload) => request('/bikes', { method: 'POST', body: JSON.stringify(payload) }),
  updateBike: (id, payload) => request(`/bikes/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteBike: (id) => request(`/bikes/${id}`, { method: 'DELETE' }),

  // Rentals
  checkAvailability: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/rentals/check-availability?${q}`);
  },
  getRentals: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/rentals${q ? `?${q}` : ''}`);
  },
  getRentalById: (id) => request(`/rentals/${id}`),
  createRental: (payload) => request('/rentals', { method: 'POST', body: JSON.stringify(payload) }),
  returnBike: (id, payload) => request(`/rentals/${id}/return`, { method: 'POST', body: JSON.stringify(payload) }),
  recordRentalPayment: (id, payload) => request(`/rentals/${id}/payment`, { method: 'POST', body: JSON.stringify(payload) }),
  cancelRental: (id) => request(`/rentals/${id}/cancel`, { method: 'POST' }),

  // Customers
  getCustomers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/customers${q ? `?${q}` : ''}`);
  },
  getCustomerById: (id) => request(`/customers/${id}`),
  createCustomer: (payload) => request('/customers', { method: 'POST', body: JSON.stringify(payload) }),
  updateCustomer: (id, payload) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE' }),

  // Expenses
  getExpenses: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/expenses${q ? `?${q}` : ''}`);
  },
  createExpense: (payload) => request('/expenses', { method: 'POST', body: JSON.stringify(payload) }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),

  // Fuel & Maintenance
  getFuelEntries: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/fuel${q ? `?${q}` : ''}`);
  },
  addFuelEntry: (payload) => request('/fuel', { method: 'POST', body: JSON.stringify(payload) }),
  getMaintenance: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/maintenance${q ? `?${q}` : ''}`);
  },
  addMaintenance: (payload) => request('/maintenance', { method: 'POST', body: JSON.stringify(payload) }),

  // Partners & Settlements
  getPartners: () => request('/partners'),
  getPartnerById: (id) => request(`/partners/${id}`),
  createPartner: (payload) => request('/partners', { method: 'POST', body: JSON.stringify(payload) }),
  updatePartner: (id, payload) => request(`/partners/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  getSettlements: () => request('/settlements'),
  recordSettlement: (payload) => request('/settlements', { method: 'POST', body: JSON.stringify(payload) }),

  // Ledger
  getTransactions: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/ledger${q ? `?${q}` : ''}`);
  },
  getAuditLogs: () => request('/ledger/audit-logs'),

  // Reports
  getReports: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reports${q ? `?${q}` : ''}`);
  },

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (payload) => request('/settings', { method: 'PUT', body: JSON.stringify(payload) }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markAsRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () => request('/notifications/mark-all-read', { method: 'PATCH' }),

  // Global Search
  globalSearch: (q) => request(`/search?q=${encodeURIComponent(q)}`)
};
