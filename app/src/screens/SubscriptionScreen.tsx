import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { AuthService } from '../services/auth';
import { ApiService } from '../services/api';

const SubscriptionScreen = ({ navigation }: any) => {
  const { user, isAuthenticated, startSubscription, refreshUserData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [usage, setUsage] = useState<{
    api_calls_remaining: number | "unlimited",
    is_premium: boolean
  }>({
    api_calls_remaining: 0,
    is_premium: false
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadUsageData();
    }
  }, [isAuthenticated, user]);

  const loadUsageData = async () => {
    try {
      setIsLoading(true);
      const data = await ApiService.checkUsage();
      setUsage(data.data);
    } catch (error) {
      console.error('Error loading usage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSubscription = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Necessário', 
        'Você precisa fazer login para assinar o plano Premium.', 
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    try {
      setIsLoading(true);
      const checkoutUrl = await startSubscription();
      
      if (checkoutUrl) {
        // Abrir navegador com a URL de checkout
        await AuthService.openBrowser(checkoutUrl);
        
        // Perguntar ao usuário se a assinatura foi concluída
        setTimeout(() => {
          Alert.alert(
            'Assinatura', 
            'Você completou o processo de assinatura?', 
            [
              { text: 'Não', style: 'cancel' },
              { 
                text: 'Sim', 
                onPress: async () => {
                  await refreshUserData();
                  loadUsageData();
                } 
              }
            ]
          );
        }, 1000);
      }
    } catch (error) {
      console.error('Error starting subscription:', error);
      Alert.alert('Erro', 'Não foi possível iniciar o processo de assinatura.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>PLANO PREMIUM</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color="#000" style={styles.loader} />
        ) : (
          <>
            {user && (
              <View style={styles.userInfoContainer}>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.usageInfo}>
                  Status: {user.is_premium ? 'Premium' : 'Gratuito'}
                </Text>
                <Text style={styles.usageInfo}>
                  Chamadas restantes: {
                    usage.api_calls_remaining === "unlimited" 
                      ? "Ilimitadas" 
                      : usage.api_calls_remaining
                  }
                </Text>
              </View>
            )}

            <View style={styles.plansContainer}>
              <View style={styles.planCard}>
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>GRATUITO</Text>
                </View>
                <View style={styles.planFeatures}>
                  <View style={styles.featureRow}>
                    <Feather name="check" size={16} color="#000" />
                    <Text style={styles.featureText}>3 transformações grátis</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Feather name="check" size={16} color="#000" />
                    <Text style={styles.featureText}>Troca de outfit básica</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Feather name="check" size={16} color="#000" />
                    <Text style={styles.featureText}>Geração de imagem básica</Text>
                  </View>
                </View>
                <Text style={styles.currentPlan}>
                  {!user?.is_premium && 'Seu plano atual'}
                </Text>
              </View>

              <View style={[styles.planCard, styles.premiumCard]}>
                <View style={[styles.planHeader, styles.premiumHeader]}>
                  <Text style={[styles.planName, styles.premiumName]}>PREMIUM</Text>
                  <Text style={styles.planPrice}>R$29,90/mês</Text>
                </View>
                <View style={styles.planFeatures}>
                  <View style={styles.featureRow}>
                    <Feather name="check" size={16} color="#000" />
                    <Text style={styles.featureText}>Transformações ilimitadas</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Feather name="check" size={16} color="#000" />
                    <Text style={styles.featureText}>Maior qualidade de imagem</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Feather name="check" size={16} color="#000" />
                    <Text style={styles.featureText}>Prioridade no processamento</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Feather name="check" size={16} color="#000" />
                    <Text style={styles.featureText}>Suporte prioritário</Text>
                  </View>
                </View>
                {user?.is_premium ? (
                  <Text style={styles.currentPlan}>Seu plano atual</Text>
                ) : (
                  <TouchableOpacity 
                    style={styles.subscribeButton} 
                    onPress={handleStartSubscription}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.subscribeButtonText}>ASSINAR AGORA</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>Por que assinar?</Text>
              <Text style={styles.infoText}>
                Com o plano Premium, você tem acesso ilimitado às transformações de outfit 
                e geração de imagens, além de recursos exclusivos e alta qualidade de processamento.
              </Text>
            </View>

            {!isAuthenticated && (
              <TouchableOpacity 
                style={styles.loginButton} 
                onPress={() => navigation.navigate('Login')}
              >
                <Feather name="user" size={18} color="#fff" />
                <Text style={styles.loginButtonText}>FAZER LOGIN</Text>
              </TouchableOpacity>
            )}
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
  userInfoContainer: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  usageInfo: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  plansContainer: {
    marginBottom: 30,
  },
  planCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden',
  },
  premiumCard: {
    borderColor: '#000',
  },
  planHeader: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  premiumHeader: {
    backgroundColor: '#000',
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  premiumName: {
    color: '#fff',
  },
  planPrice: {
    fontSize: 14,
    color: '#fff',
  },
  planFeatures: {
    padding: 15,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  currentPlan: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 15,
  },
  subscribeButton: {
    backgroundColor: '#000',
    marginHorizontal: 15,
    marginVertical: 15,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  subscribeButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
    letterSpacing: 1,
  },
  infoContainer: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: '#000',
    borderRadius: 4,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 10,
    letterSpacing: 1,
  },
});

export default SubscriptionScreen;