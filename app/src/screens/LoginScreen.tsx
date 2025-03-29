import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Image,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen = ({ navigation }: any) => {
  const { signInWithGoogle, isLoading } = useAuth();

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Feather name="image" size={60} color="#000" />
          <Text style={styles.appName}>OutfitSwap</Text>
          <Text style={styles.tagline}>Transforme seu look instantaneamente</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Bem-vindo ao OutfitSwap</Text>
          <Text style={styles.infoText}>
            Faça login para acessar todos os recursos e aproveitar seus créditos gratuitos.
            Novos usuários ganham 3 transformações de imagem gratuitas!
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Feather name="shuffle" size={24} color="#000" />
            <Text style={styles.featureTitle}>Troque Outfits</Text>
            <Text style={styles.featureText}>
              Visualize-se usando qualquer roupa instantaneamente
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Feather name="image" size={24} color="#000" />
            <Text style={styles.featureTitle}>Gere Imagens</Text>
            <Text style={styles.featureText}>
              Crie designs de roupas e outfits do zero
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Feather name="save" size={24} color="#000" />
            <Text style={styles.featureTitle}>Salve Criações</Text>
            <Text style={styles.featureText}>
              Compartilhe suas transformações de outfit
            </Text>
          </View>
        </View>

        <View style={styles.loginContainer}>
          <TouchableOpacity 
            style={styles.googleButton} 
            onPress={handleGoogleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="user" size={18} color="#fff" />
                <Text style={styles.googleButtonText}>ENTRAR COM GOOGLE</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.skipButton} 
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.skipButtonText}>EXPLORAR SEM LOGIN</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.termsText}>
          Ao fazer login, você concorda com nossos Termos de Serviço e Política de Privacidade
        </Text>
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
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 28,
    fontWeight: '600',
    marginTop: 16,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    fontWeight: '300',
  },
  infoContainer: {
    marginBottom: 30,
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  featureItem: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
  },
  featureText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  loginContainer: {
    marginBottom: 20,
  },
  googleButton: {
    backgroundColor: '#000',
    borderRadius: 4,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 15,
  },
  googleButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 10,
    letterSpacing: 1,
  },
  skipButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
  },
  skipButtonText: {
    color: '#000',
    fontWeight: '500',
    fontSize: 14,
    letterSpacing: 1,
  },
  termsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default LoginScreen;