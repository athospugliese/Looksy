import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useApiKey } from '../contexts/ApiKeyContext';

const ApiKeyScreen = ({ navigation }: any) => {
  const { apiKey, setApiKey, validateApiKey, clearApiKey, isKeyValid, isValidating } = useApiKey();
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  
  useEffect(() => {
    if (apiKey) {
      setInputKey(apiKey);
    }
  }, [apiKey]);

  const handleValidate = async () => {
    if (!inputKey.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }
    
    const isValid = await validateApiKey(inputKey.trim());
    
    if (isValid) {
      Alert.alert('Success', 'API key is valid');
    } else {
      Alert.alert('Invalid Key', 'The API key could not be validated. Make sure it has permission to access the Gemini API.');
    }
  };

  const handleSave = async () => {
    if (!inputKey.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }
    
    await setApiKey(inputKey.trim());
    Alert.alert('Success', 'API key saved successfully');
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this API key? The app will use the shared key instead.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            clearApiKey();
            setInputKey('');
            navigation.goBack();
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>API KEY MANAGEMENT</Text>
        
        <Text style={styles.description}>
          We recommend using your own API key from Google AI Studio for better reliability. Without a personal key, the app will use a shared key with usage limits.
        </Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputKey}
            onChangeText={setInputKey}
            placeholder="Enter your Google Gemini API key"
            placeholderTextColor="#999"
            secureTextEntry={!showKey}
          />
          <TouchableOpacity 
            style={styles.eyeButton}
            onPress={() => setShowKey(!showKey)}
          >
            <Feather name={showKey ? 'eye-off' : 'eye'} size={20} color="#000" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.validateButton} 
            onPress={handleValidate}
            disabled={!inputKey.trim() || isValidating}
          >
            {isValidating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>VALIDATE</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave}
            disabled={!inputKey.trim()}
          >
            <Text style={styles.buttonText}>SAVE KEY</Text>
          </TouchableOpacity>
        </View>
        
        {isKeyValid !== null && (
          <View style={[
            styles.statusContainer,
            isKeyValid ? styles.validContainer : styles.invalidContainer
          ]}>
            <Feather 
              name={isKeyValid ? 'check-circle' : 'x-circle'} 
              size={20} 
              color={isKeyValid ? '#2e7d32' : '#d32f2f'} 
            />
            <Text style={[
              styles.statusText,
              isKeyValid ? styles.validText : styles.invalidText
            ]}>
              {isKeyValid ? 'API key is valid' : 'API key is invalid'}
            </Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => {
            Alert.alert(
              'External Link',
              'This will open Google AI Studio in your browser. Would you like to continue?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open', onPress: () => {} }
              ]
            );
          }}
        >
          <Text style={styles.linkText}>Get API key from Google AI Studio</Text>
        </TouchableOpacity>
        
        {apiKey && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Feather name="trash-2" size={18} color="#d32f2f" />
            <Text style={styles.deleteText}>DELETE API KEY</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    letterSpacing: 1,
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginBottom: 24,
    lineHeight: 20,
    fontWeight: '300',
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 20,
    position: 'relative',
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 14,
    color: '#000',
  },
  eyeButton: {
    height: 50,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  validateButton: {
    flex: 1,
    backgroundColor: '#000',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginRight: 10,
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#000',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 13,
    letterSpacing: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 4,
    marginBottom: 20,
  },
  validContainer: {
    backgroundColor: '#e8f5e9',
  },
  invalidContainer: {
    backgroundColor: '#ffebee',
  },
  statusText: {
    marginLeft: 10,
    fontSize: 14,
  },
  validText: {
    color: '#2e7d32',
  },
  invalidText: {
    color: '#d32f2f',
  },
  linkButton: {
    marginVertical: 20,
  },
  linkText: {
    color: '#000',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
  },
  deleteText: {
    color: '#d32f2f',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ApiKeyScreen;