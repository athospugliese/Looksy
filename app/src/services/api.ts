import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ImagePickerAsset } from 'expo-image-picker';

// Base URL para a API
// Para Android Emulator, use 10.0.2.2 para acessar o localhost da máquina host
const API_BASE_URL = 'http://10.0.2.2:8000';
// Para iOS em dispositivos físicos, você pode precisar usar seu IP local:
// const API_BASE_URL = 'http://192.168.1.100:8000';

// Chaves de armazenamento
const API_KEY_STORAGE_KEY = 'GEMINI_USER_API_KEY';
const AUTH_TOKEN_KEY = 'AUTH_TOKEN';

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Adicionar interceptor para incluir API key e token de autenticação
api.interceptors.request.use(
  async (config) => {
    try {
      // Adicionar token de autenticação
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Adicionar API key se disponível
      const apiKey = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
      if (apiKey) {
        config.headers['X-API-Key'] = apiKey;
      }
    } catch (error) {
      console.error('Error setting request headers:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Métodos da API
export const ApiService = {
  // Outfit swap API
  outfitSwap: async (primaryImage: ImagePickerAsset, secondaryImage: ImagePickerAsset, prompt: string) => {
    const formData = new FormData();
    formData.append('file', {
      uri: primaryImage.uri,
      name: 'primary_image.jpg',
      type: 'image/jpeg',
    } as any);
    
    formData.append('secondary_file', {
      uri: secondaryImage.uri,
      name: 'secondary_image.jpg',
      type: 'image/jpeg',
    } as any);
    
    formData.append('prompt', prompt);
    
    return api.post('/api/edit-image/', formData);
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
        'Content-Type': 'application/json',
      },
    });
  },
  
  // Verificar status de assinatura e chamadas de API restantes
  checkUsage: async () => {
    return api.get('/api/user/usage');
  },
};

export default ApiService;