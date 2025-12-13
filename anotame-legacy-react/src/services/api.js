import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Update with your backend URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Client endpoints
export const clientAPI = {
  create: (clientData) => api.post('/clientes', clientData),
  search: (query) => api.get(`/clientes/search?query=${query}`),
};

// Garment endpoints
export const garmentAPI = {
  create: (garmentData) => api.post('/prendas', garmentData),
  getTypes: () => api.get('/tipo-prendas'),
  getRepairs: () => api.get('/arreglos'),
};

// Note endpoints
export const noteAPI = {
  create: (noteData) => api.post('/notas', noteData),
  createNoteGarment: (noteId, garmentData) => api.post(`/notas/${noteId}/prendas`, garmentData),
};

// Authentication
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
};

export default api;