import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useApiKey } from '../contexts/ApiKeyContext';
import { ApiService } from '../services/api';

const ProfileScreen = ({ navigation }: any) => {
  const { user, isAuthenticated, signOut, refreshUserData } = useAuth();
  const { apiKey, clearApiKey } = useApiKey();
  const [isLoading, setIsLoading] = useState(false);
  const [usageData, setUsageData] = useState<{
    api_calls_remaining: number | "unlimited";
    is_premium: boolean;
  } | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadUsageData();
    }
  }, [isAuthenticated]);

  const loadUsageData = async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.checkUsage();
      setUsageData(response.data);
    } catch (error) {
      console.error('Error loading usage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Confirmação',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          onPress: async () => {
            await signOut();
            navigation.navigate('Home');
          },
          style: 'destructive'
        }
      ]
    );
  };

  const handleManageSubscription = async () => {
    // Aqui você poderia abrir uma URL externa para gerenciar a assinatura
    // ou navegar para uma tela de gerenciamento de assinatura
    navigation.navigate('Subscription');
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notLoggedInContainer}>
          <Feather name="user" size={50} color="#ccc" />
          <Text style={styles.notLoggedInText}>
            Faça login para acessar seu perfil
          </Text>
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>FAZER LOGIN</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>PERFIL</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color="#000" style={styles.loader} />
        ) : (
          <>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Feather name="user" size={40} color="#000" />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.emailText}>{user?.email}</Text>
                <Text style={styles.statusText}>
                  Status: {user?.is_premium ? 'Premium' : 'Gratuito'}
                </Text>
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>PLANO E ASSINATURA</Text>
              
              <View style={styles.infoItem}>
                <View style={styles.infoItemLeft}>
                  <Feather name="star" size={20} color="#000" />
                  <Text style={styles.infoItemText}>Plano atual</Text>
                </View>
                <Text style={styles.infoItemValue}>
                  {user?.is_premium ? 'Premium' : 'Gratuito'}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <View style={styles.infoItemLeft}>
                  <Feather name="image" size={20} color="#000" />
                  <Text style={styles.infoItemText}>Chamadas restantes</Text>
                </View>
                <Text style={styles.infoItemValue}>
                  {usageData?.api_calls_remaining === 'unlimited' 
                    ? 'Ilimitado' 
                    : usageData?.api_calls_remaining || 0}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleManageSubscription}
              >
                <Text style={styles.actionButtonText}>
                  {user?.is_premium ? 'GERENCIAR ASSINATURA' : 'FAZER UPGRADE'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>GERENCIAMENTO DE API</Text>
              
              <View style={styles.infoItem}>
                <View style={styles.infoItemLeft}>
                  <Feather name="key" size={20} color="#000" />
                  <Text style={styles.infoItemText}>API Key Personalizada</Text>
                </View>
                <Text style={styles.infoItemValue}>
                  {apiKey ? 'Configurada' : 'Não configurada'}
                </Text>
              </View>
              
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.smallActionButton]} 
                  onPress={() => navigation.navigate('ApiKey')}
                >
                  <Text style={styles.actionButtonText}>CONFIGURAR</Text>
                </TouchableOpacity>
                
                {apiKey && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.smallActionButton, styles.dangerButton]} 
                    onPress={() => {
                      Alert.alert(
                        'Remover API Key',
                        'Deseja remover sua API key personalizada?',
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          { 
                            text: 'Remover', 
                            onPress: () => clearApiKey(),
                            style: 'destructive' 
                          }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.actionButtonText}>REMOVER</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>CONTA</Text>
              
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => {
                  Alert.alert(
                    'Suporte',
                    'Envie um email para suporte@outfitswap.com para obter ajuda.'
                  );
                }}
              >
                <Feather name="help-circle" size={20} color="#000" />
                <Text style={styles.menuItemText}>Suporte</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => {
                  Linking.openURL('https://outfitswap.com/termos');
                }}
              >
                <Feather name="file-text" size={20} color="#000" />
                <Text style={styles.menuItemText}>Termos de Serviço</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => {
                  Linking.openURL('https://outfitswap.com/privacidade');
                }}
              >
                <Feather name="shield" size={20} color="#000" />
                <Text style={styles.menuItemText}>Política de Privacidade</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.menuItem, styles.dangerMenuItem]} 
                onPress={handleSignOut}
              >
                <Feather name="log-out" size={20} color="#d32f2f" />
                <Text style={styles.dangerMenuItemText}>Sair</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    letterSpacing: 1,
  },
  loader: {
    marginTop: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 25,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#e0e0e0',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  statusText: {
    fontSize: 14,
    color: '#555',
  },
  sectionContainer: {
    marginBottom: 25,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 15,
    letterSpacing: 1,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItemText: {
    marginLeft: 10,
    fontSize: 14,
  },
  infoItemValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#000',
    borderRadius: 4,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  smallActionButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  dangerButton: {
    backgroundColor: '#d32f2f',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 13,
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemText: {
    marginLeft: 10,
    fontSize: 14,
  },
  dangerMenuItem: {
    borderBottomWidth: 0,
  },
  dangerMenuItemText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#d32f2f',
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notLoggedInText: {
    fontSize: 16,
    color: '#333',
    marginVertical: 20,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#000',
    borderRadius: 4,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    width: '70%',
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
    letterSpacing: 1,
  },
});

export default ProfileScreen;