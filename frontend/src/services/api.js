// API Service Utility for Authentication Endpoints

const API_BASE = ''; // Relies on Vite proxy configuration or absolute URL fallback

/**
 * Common fetch wrapper with error handling and JSON parsing
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('oj_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err.message);
    throw err;
  }
}

export const authAPI = {
  /**
   * Register a new user
   * @param {Object} userData { full_name, username, email, password }
   */
  async register(userData) {
    return request('/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  /**
   * Login user
   * @param {Object} credentials { username, password }
   */
  async login(credentials) {
    return request('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  /**
   * Get user profile details
   */
  async getProfile() {
    return request('/profile', {
      method: 'GET',
    });
  },
};
