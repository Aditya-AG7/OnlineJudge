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
      if (response.status === 401) {
        localStorage.removeItem('oj_token');
        localStorage.removeItem('oj_user');
      }
      const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      throw err;
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

export const adminAPI = {
  /**
   * Fetch all registered users (Admin only)
   */
  async getUsers() {
    return request('/admin/users', {
      method: 'GET',
    });
  },

  /**
   * Update a user's role (Admin only)
   * @param {string} userId 
   * @param {string} role ('user' | 'problem_setter' | 'admin')
   */
  async updateUserRole(userId, role) {
    return request(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ type: role }),
    });
  },
};

export const problemAPI = {
  /**
   * Fetch all non-deleted problems (GET /problems)
   */
  async getProblems() {
    return request('/problems', {
      method: 'GET',
    });
  },

  /**
   * Fetch problem by ID with sample test cases (GET /problems/:id)
   */
  async getProblemById(id) {
    return request(`/problems/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Create a new problem (POST /problems)
   * @param {Object} problemData { title, statement, constraints, difficulty, tags, time_limit_ms, memory_limit_kb }
   */
  async createProblem(problemData) {
    return request('/problems', {
      method: 'POST',
      body: JSON.stringify(problemData),
    });
  },

  /**
   * Add a testcase to a problem (POST /problems/:id/testcases)
   * @param {string} problemId
   * @param {Object} testCaseData { input, output, is_sample }
   */
  async addTestCase(problemId, testCaseData) {
    return request(`/problems/${problemId}/testcases`, {
      method: 'POST',
      body: JSON.stringify(testCaseData),
    });
  },
};

export const compileAPI = {
  /**
   * Execute C++ code against input (POST /run)
   * @param {Object} data { source_code, input }
   */
  async runCode(data) {
    return request('/run', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const submissionAPI = {
  /**
   * Submit code for problem evaluation (POST /submissions)
   * @param {Object} data { problem_id, source_code }
   */
  async submitCode(data) {
    return request('/submissions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Fetch submission by ID with results (GET /submissions/:id)
   * @param {string} id
   */
  async getSubmissionById(id) {
    return request(`/submissions/${id}`, {
      method: 'GET',
    });
  },
};


