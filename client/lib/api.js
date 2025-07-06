const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Import endpoints
  async getApiEndpoints() {
    return this.request('/api/import/endpoints');
  }

  async startImport(urls) {
    return this.request('/api/import/start', {
      method: 'POST',
      body: JSON.stringify({ urls }),
    });
  }

  async startAutoImport() {
    return this.request('/api/import/auto', {
      method: 'POST',
    });
  }

  async getImportHistory(page = 1, limit = 10, source = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(source && { source }),
    });
    
    return this.request(`/api/import/history?${params}`);
  }

  async getImportLogDetails(id) {
    return this.request(`/api/import/history/${id}`);
  }

  async getQueueStatus() {
    return this.request('/api/import/queue/status');
  }

  // Job endpoints
  async getJobs(page = 1, limit = 10, filters = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    
    return this.request(`/api/jobs?${params}`);
  }

  async getJobById(id) {
    return this.request(`/api/jobs/${id}`);
  }

  async searchJobs(query, page = 1, limit = 10) {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      limit: limit.toString(),
    });
    
    return this.request(`/api/jobs/search?${params}`);
  }
}

const apiService = new ApiService();
export default apiService;