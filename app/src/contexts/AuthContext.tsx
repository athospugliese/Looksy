import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { AuthService } from '../services/auth';

// Registrar para receber redirect de autenticação
WebBrowser.maybeCompleteAuthSession();

// Chaves de armazenamento
const AUTH_TOKEN_KEY = 'AUTH_TOKEN';
const USER_DATA_KEY = 'USER_DATA';

// Tipos
export interface User {
  email: string;
  uid: string;
  api_calls_remaining: number;
  is_premium: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  startSubscription: () => Promise<string | null>;
  refreshUserData: () => Promise<void>;
}

// Configuração do Google OAuth
// Substitua com suas próprias credenciais
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
const GOOGLE_EXPO_CLIENT_ID = 'YOUR_GOOGLE_EXPO_CLIENT_ID';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Configurar autenticação Google
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: GOOGLE_EXPO_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
    responseType: 'id_token',
    scopes: ['profile', 'email']
  });

  // Carregar dados do usuário ao iniciar
  useEffect(() => {
    loadUserData();
  }, []);

  // Monitorar resposta da autenticação Google
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleLogin(id_token);
    }
  }, [response]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const storedUserData = await AsyncStorage.getItem(USER_DATA_KEY);

      if (storedToken && storedUserData) {
        setToken(storedToken);
        setUser(JSON.parse(storedUserData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (idToken: string) => {
    try {
      setIsLoading(true);
      const response = await AuthService.loginWithGoogle(idToken);

      if (response.access_token && response.user) {
        // Salvar token e dados do usuário
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.user));

        // Atualizar estado
        setToken(response.access_token);
        setUser(response.user);
      }
    } catch (error) {
      console.error('Error during Google login:', error);
      Alert.alert('Erro de Login', 'Não foi possível fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error('Error initiating Google sign in:', error);
      Alert.alert('Erro', 'Não foi possível iniciar o login com Google.');
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      // Limpar armazenamento
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_DATA_KEY);

      // Resetar estado
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Erro', 'Não foi possível fazer logout.');
    } finally {
      setIsLoading(false);
    }
  };

  const startSubscription = async (): Promise<string | null> => {
    try {
      if (!user) {
        Alert.alert('Erro', 'Você precisa estar logado para assinar.');
        return null;
      }

      const response = await AuthService.createCheckoutSession();
      return response.checkout_url;
    } catch (error) {
      console.error('Error starting subscription:', error);
      Alert.alert('Erro', 'Não foi possível iniciar o processo de assinatura.');
      return null;
    }
  };

  const refreshUserData = async () => {
    try {
      if (!token) return;
      
      const userData = await AuthService.getUserData();
      if (userData) {
        setUser(userData);
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    signInWithGoogle,
    signOut,
    startSubscription,
    refreshUserData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};