import { Capacitor } from '@capacitor/core';

// On native Android app, point to production Vercel API; on web, use relative '/api'
const API_BASE = (
  Capacitor.isNativePlatform()
    ? (import.meta.env.VITE_API_URL || 'https://throttlex-nine.vercel.app/api')
    : '/api'
).replace(/\/+$/, '');

// In-memory Fast API Cache for GET requests (instant navigation, zero flicker)
const requestCache = new Map();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds TTL

export function clearApiCache() {
  requestCache.clear();
}

function getAuthHeader() {
  const token = localStorage.getItem('throttlex_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const isGet = !options.method || options.method.toUpperCase() === 'GET';

  // Return instantly from in-memory cache if available
  if (isGet && !options.skipCache) {
    const cached = requestCache.get(url);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      return cached.data;
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  };

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (netErr) {
    throw new Error('Unable to connect to the backend server. Please verify your connection.');
  }

  let data = {};
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => ({}));
  } else {
    const rawText = await response.text().catch(() => '');
    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        // Plain text or HTML error
        if (response.status === 500) {
          data = {
            message: 'Server error (500). If deployed on Vercel, please verify MONGODB_URI in Vercel Environment Variables and MongoDB Atlas IP access (0.0.0.0/0).'
          };
        } else {
          data = { message: `Request failed (${response.status})` };
        }
      }
    }
  }

  if (!response.ok) {
    const errorMsg =
      data.message ||
      (response.status === 500
        ? 'Server error (500). Please check your database connection or MONGODB_URI.'
        : `Request failed with status ${response.status}`);
    throw new Error(errorMsg);
  }

  // Cache GET responses; flush cache on any mutation (POST, PUT, DELETE, PATCH)
  if (isGet) {
    requestCache.set(url, { data, timestamp: Date.now() });
  } else {
    requestCache.clear();
  }

  return data;
}

export const api = {
  clearCache: clearApiCache,
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
  getRentalAgreement: (id) => request(`/rentals/${id}/agreement`),
  createRental: (payload) => request('/rentals', { method: 'POST', body: JSON.stringify(payload) }),
  recordHandoverInspection: (id, payload) => request(`/rentals/${id}/handover`, { method: 'POST', body: JSON.stringify(payload) }),
  recordReturnInspection: (id, payload) => request(`/rentals/${id}/return-inspection`, { method: 'POST', body: JSON.stringify(payload) }),
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
  getPartnerWallet: (id) => request(`/partners/${id}/wallet`),
  createPartner: (payload) => request('/partners', { method: 'POST', body: JSON.stringify(payload) }),
  updatePartner: (id, payload) => request(`/partners/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  setPartnerLoginAccess: (id, payload) => request(`/partners/${id}/login-access`, { method: 'POST', body: JSON.stringify(payload) }),

  // Capital & Investment Tracking
  getCapital: () => request('/capital'),
  createInvestment: (payload) => request('/capital', { method: 'POST', body: JSON.stringify(payload) }),
  syncOwnershipToShare: () => request('/capital/sync-ownership', { method: 'POST' }),
  deleteInvestment: (id) => request(`/capital/${id}`, { method: 'DELETE' }),

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
