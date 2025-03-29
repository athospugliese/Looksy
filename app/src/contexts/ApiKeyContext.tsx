import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import ApiService from '../services/api';

const API_KEY_STORAGE_KEY = 'GEMINI_USER_API_KEY';

interface ApiKeyContextType {
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  validateApiKey: (key: string) => Promise<boolean>;
  clearApiKey: () => void;
  isKeyValid: boolean | null;
  isValidating: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Load API key from storage on initial render
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const savedKey = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
        if (savedKey) {
          setApiKeyState(savedKey);
        }
      } catch (error) {
        console.error('Error loading API key from storage:', error);
      }
    };

    loadApiKey();
  }, []);

  const setApiKey = async (key: string | null) => {
    try {
      if (key) {
        await AsyncStorage.setItem(API_KEY_STORAGE_KEY, key);
        setApiKeyState(key);
        setIsKeyValid(null); // Reset validation state
      }
    } catch (error) {
      console.error('Error saving API key to storage:', error);
      Alert.alert('Error', 'Failed to save API key');
    }
  };

  const clearApiKey = async () => {
    try {
      await AsyncStorage.removeItem(API_KEY_STORAGE_KEY);
      setApiKeyState(null);
      setIsKeyValid(null);
      Alert.alert('API Key Removed', 'The app will now use the shared API key');
    } catch (error) {
      console.error('Error removing API key from storage:', error);
      Alert.alert('Error', 'Failed to remove API key');
    }
  };

  const validateApiKey = async (key: string): Promise<boolean> => {
    setIsValidating(true);

    try {
      const response = await ApiService.validateApiKey(key);
      const isValid = response.data.valid === true;
      setIsKeyValid(isValid);
      return isValid;
    } catch (error) {
      console.error('Error validating API key:', error);
      setIsKeyValid(false);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <ApiKeyContext.Provider
      value={{
        apiKey,
        setApiKey,
        validateApiKey,
        clearApiKey,
        isKeyValid,
        isValidating,
      }}
    >
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = () => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};