import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:5080/api',
  timeout: 10000,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, remove it and redirect to login
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      // Navigation will be handled by the auth context
    }
    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },
  loadUser: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const user = await AsyncStorage.getItem('user');
      if (token && user) {
        return {
          token,
          user: JSON.parse(user),
          isAuthenticated: true,
          isLoading: false
        };
      }
      return {
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false
      };
    } catch (error) {
      return {
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false
      };
    }
  }
};

export const paymentsAPI = {
  getPaymentHistory: async () => {
    const response = await api.get('/payments/history');
    return response.data;
  },
  makePayment: async (paymentData) => {
    const response = await api.post('/payments', paymentData);
    return response.data;
  },
  getPaymentCategories: async () => {
    const response = await api.get('/payments/categories');
    return response.data;
  }
};

export const announcementsAPI = {
  getAnnouncements: async () => {
    const response = await api.get('/announcements');
    return response.data;
  },
  getAnnouncementById: async (id) => {
    const response = await api.get(`/announcements/${id}`);
    return response.data;
  }
};

export const profileAPI = {
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },
  updateProfile: async (profileData) => {
    const response = await api.put('/profile', profileData);
    return response.data;
  }
};

// Context provider for API
export const APIProvider = ({ children }) => {
  return (
    // This will be expanded to include auth context logic
    <>{children}</>
  );
};
