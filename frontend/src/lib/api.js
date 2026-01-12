import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const glpiApi = {
  // Test connection
  testConnection: async () => {
    const response = await apiClient.get('/glpi/test-connection');
    return response.data;
  },

  // Dashboard stats
  getStats: async () => {
    const response = await apiClient.get('/glpi/stats');
    return response.data;
  },

  // Computers
  getComputers: async (offset = 0, limit = 50) => {
    const response = await apiClient.get('/glpi/computers', {
      params: { offset, limit }
    });
    return response.data;
  },

  getComputerDetails: async (id) => {
    const response = await apiClient.get(`/glpi/computers/${id}`);
    return response.data;
  },

  // Software
  getSoftware: async (offset = 0, limit = 50) => {
    const response = await apiClient.get('/glpi/software', {
      params: { offset, limit }
    });
    return response.data;
  },

  // Monitors
  getMonitors: async () => {
    const response = await apiClient.get('/glpi/monitors');
    return response.data;
  },

  // Printers
  getPrinters: async () => {
    const response = await apiClient.get('/glpi/printers');
    return response.data;
  },

  // Network equipment
  getNetworkEquipment: async () => {
    const response = await apiClient.get('/glpi/network');
    return response.data;
  },

  // Phones
  getPhones: async () => {
    const response = await apiClient.get('/glpi/phones');
    return response.data;
  },

  // Agent config
  generateAgentConfig: async (config) => {
    const response = await apiClient.post('/glpi/agent-config', config);
    return response.data;
  },

  getAgentDownloadLinks: async () => {
    const response = await apiClient.get('/glpi/agent-download');
    return response.data;
  },
};

export default apiClient;
