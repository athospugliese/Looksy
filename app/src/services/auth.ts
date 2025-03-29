import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../contexts/AuthContext';
import * as WebBrowser from 'expo-web-browser';

// Base URL para a API
const API_BASE_URL = 'http://10.0.2.2:8000';
// Para iOS em dispositivos físicos, você pode precisar usar seu IP local:
// const API_BASE_URL = 'http://192.168.1.100:8000';

// Chave para armazenar o token
const AUTH_TOKEN_KEY = 'AUTH_TOKEN';

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Adicionar interceptor para incluir o token de autenticação
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error retrieving auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const AuthService = {
  // Login com Google
  loginWithGoogle: async (idToken: string) => {
    try {
      const response = await api.post('/api/auth/google', { id_token: idToken });
      return response.data;
    } catch (error) {
      console.error('Error in loginWithGoogle:', error);
      throw error;
    }
  },

  // Obter dados do usuário
  getUserData: async (): Promise<User | null> => {
    try {
      const response = await api.get('/api/user/me');
      return response.data;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  // Obter informações de uso da API
  getUserUsage: async () => {
    try {
      const response = await api.get('/api/user/usage');
      return response.data;
    } catch (error) {
      console.error('Error getting API usage:', error);
      throw error;
    }
  },

  // Criar sessão de checkout do Stripe
  createCheckoutSession: async () => {
    try {
      const response = await api.post('/api/create-checkout-session');
      return response.data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  },

  // Abrir URL no navegador (para checkout do Stripe)
  openBrowser: async (url: string) => {
    return WebBrowser.openBrowserAsync(url);
  }
};