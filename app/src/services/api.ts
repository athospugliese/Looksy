import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for the API - update this with your backend URL
// For local development on a real device, you'll need your computer's local network IP
// For example: 'http://192.168.1.5:8000' instead of 'http://localhost:8000'
const API_BASE_URL = 'http://10.0.2.2:8000';

const API_KEY_STORAGE_KEY = 'GEMINI_USER_API_KEY';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Add a request interceptor to include the API key in headers
api.interceptors.request.use(
  async (config) => {
    try {
      const apiKey = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
      if (apiKey) {
        config.headers['X-API-Key'] = apiKey;
      }
    } catch (error) {
      console.error('Error retrieving API key:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API methods
export const ApiService = {
  // Outfit swap API
  outfitSwap: async (primaryImage: any, secondaryImage: any, prompt: string) => {
    const formData = new FormData();
    formData.append('primary_image', {
      uri: primaryImage.uri,
      name: 'primary_image.jpg',
      type: 'image/jpeg',
    } as any);
    
    formData.append('secondary_image', {
      uri: secondaryImage.uri,
      name: 'secondary_image.jpg',
      type: 'image/jpeg',
    } as any);
    
    formData.append('prompt', prompt);
    
    return api.post('/api/edit-image-dual', formData);
  },
  
  // Image generation API
  generateImage: async (prompt: string) => {
    const formData = new FormData();
    formData.append('prompt', prompt);
    
    return api.post('/api/generate-image/', formData);
  },
  
  // API key validation
  validateApiKey: async (apiKey: string) => {
    return api.post('/api/validate-key/', null, {
      headers: {
        'X-API-Key': apiKey,
      },
    });
  },
};

export default ApiService;