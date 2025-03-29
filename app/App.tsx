import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ApiKeyProvider } from './src/contexts/ApiKeyContext';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import ImageGeneratorScreen from './src/screens/ImageGeneratorScreen';
import ApiKeyScreen from './src/screens/ApiKeyScreen';

// Types
export type RootStackParamList = {
  Home: undefined;
  ImageGenerator: undefined;
  ApiKey: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {

  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch('http://10.0.2.2:8000');
        const data = await response.json();
        console.log('Conexão com o servidor bem-sucedida:', data);
      } catch (error) {
        console.error('Erro ao conectar ao servidor:', error);
      }
    };
  
    testConnection();
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ApiKeyProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <Stack.Navigator
              screenOptions={({ navigation }) => ({
                headerStyle: { backgroundColor: '#000' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: '300', textTransform: 'uppercase', letterSpacing: 2 },
                contentStyle: { backgroundColor: '#fff' },
                headerRight: () => (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ApiKey')}
                    style={{ paddingHorizontal: 15 }}
                  >
                    <Feather name="key" size={20} color="#fff" />
                  </TouchableOpacity>
                )
              })}
            >
              <Stack.Screen 
                name="Home" 
                component={HomeScreen} 
                options={{ title: 'Outfit Swap' }} 
              />
              <Stack.Screen 
                name="ImageGenerator" 
                component={ImageGeneratorScreen} 
                options={{ title: 'Image Creator' }} 
              />
              <Stack.Screen 
                name="ApiKey" 
                component={ApiKeyScreen} 
                options={{ 
                  title: 'API Key',
                  headerRight: undefined 
                }} 
              />
            </Stack.Navigator>
          </NavigationContainer>
        </ApiKeyProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}