import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiKeyProvider } from './src/contexts/ApiKeyContext';
import { AuthProvider } from './src/contexts/AuthContext';

// Importar telas
import HomeScreen from './src/screens/HomeScreen';
import ImageGeneratorScreen from './src/screens/ImageGeneratorScreen';
import ApiKeyScreen from './src/screens/ApiKeyScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';

// Definir tipos para a navegação
export type RootStackParamList = {
  Home: undefined;
  ImageGenerator: undefined;
  ApiKey: undefined;
  Login: undefined;
  Profile: undefined;
  Subscription: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <ApiKeyProvider>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{
                headerShown: true,
                headerTitleAlign: 'center',
                headerShadowVisible: false,
                headerTitleStyle: {
                  fontWeight: '600',
                  fontSize: 16,
                  letterSpacing: 1,
                },
                contentStyle: {
                  backgroundColor: '#fff',
                },
              }}
            >
              <Stack.Screen 
                name="Home" 
                component={HomeScreen} 
                options={{ title: 'OUTFIT SWAP' }}
              />
              <Stack.Screen 
                name="ImageGenerator" 
                component={ImageGeneratorScreen} 
                options={{ title: 'GERADOR DE IMAGENS' }}
              />
              <Stack.Screen 
                name="ApiKey" 
                component={ApiKeyScreen} 
                options={{ title: 'CONFIGURAÇÃO DE API KEY' }}
              />
              <Stack.Screen 
                name="Login" 
                component={LoginScreen} 
                options={{ title: 'LOGIN' }}
              />
              <Stack.Screen 
                name="Profile" 
                component={ProfileScreen} 
                options={{ title: 'PERFIL' }}
              />
              <Stack.Screen 
                name="Subscription" 
                component={SubscriptionScreen} 
                options={{ title: 'ASSINATURA' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </ApiKeyProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}