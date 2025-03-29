import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Prompt from '../components/Prompt';
import { useImageGenerator } from '../hooks/useImageGenerator';

const ImageGeneratorScreen = ({ navigation }: any) => {
  const {
    prompt,
    setPrompt,
    resultImage,
    isLoading,
    error,
    responseText,
    generateImage,
    saveImage,
    resetForm
  } = useImageGenerator();

  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to bottom when result is received
  React.useEffect(() => {
    if (resultImage && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 500);
    }
  }, [resultImage]);

  const handleSubmit = async () => {
    if (prompt.trim() === '') {
      Alert.alert('Missing Prompt', 'Please enter a description for the image you want to create');
      return;
    }
    await generateImage();
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView ref={scrollViewRef} style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Describe the image you want to create in detail for best results
        </Text>

        <Prompt
          value={prompt}
          onChangeText={setPrompt}
        />

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>TIPS FOR BETTER RESULTS</Text>
          <Text style={styles.tipText}>• Be specific about style, mood, and details</Text>
          <Text style={styles.tipText}>• Mention lighting, colors, and composition</Text>
          <Text style={styles.tipText}>• Include references to art styles when relevant</Text>
          <Text style={styles.tipText}>• Specify camera angle and distance (close-up, wide shot)</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.button, 
              (prompt.trim() === '' || isLoading) && styles.buttonDisabled
            ]} 
            onPress={handleSubmit}
            disabled={prompt.trim() === '' || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="image" size={18} color="#fff" />
                <Text style={styles.buttonText}>CREATE IMAGE</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.resetButton} 
            onPress={resetForm}
            disabled={isLoading}
          >
            <Feather name="x" size={18} color="#000" />
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {responseText && (
          <View style={styles.responseContainer}>
            <Text style={styles.responseText}>{responseText}</Text>
          </View>
        )}

        {resultImage && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>RESULT</Text>
            <Image 
              source={{ uri: resultImage }} 
              style={styles.resultImage} 
              resizeMode="contain"
            />
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={saveImage}
            >
              <Feather name="download" size={18} color="#fff" />
              <Text style={styles.buttonText}>SAVE TO GALLERY</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.spacer} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation.navigate('Home')}
        >
          <Feather name="repeat" size={20} color="#666" />
          <Text style={styles.navText}>OUTFIT</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, styles.activeNavItem]} 
          onPress={() => {}}
        >
          <Feather name="image" size={20} color="#000" />
          <Text style={[styles.navText, styles.activeNavText]}>CREATE</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  intro: {
    fontSize: 14,
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '300',
  },
  tipsContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    padding: 15,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: 1,
  },
  tipText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 5,
    fontWeight: '300',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginVertical: 20,
    alignItems: 'center',
  },
  button: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 4,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 13,
    marginLeft: 8,
    letterSpacing: 1,
  },
  resetButton: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  errorContainer: {
    backgroundColor: '#feeef0',
    borderRadius: 4,
    padding: 15,
    marginBottom: 20,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  responseContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    padding: 15,
    marginBottom: 20,
  },
  responseText: {
    color: '#000',
    fontSize: 14,
  },
  resultContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 10,
    letterSpacing: 1,
  },
  resultImage: {
    width: '100%',
    height: 400,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  saveButton: {
    backgroundColor: '#000',
    borderRadius: 4,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    flexDirection: 'row',
  },
  spacer: {
    height: 100,
  },
  bottomNav: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeNavItem: {
    borderTopWidth: 2,
    borderTopColor: '#000',
  },
  navText: {
    fontSize: 10,
    marginTop: 4,
    color: '#666',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  activeNavText: {
    color: '#000',
  },
});

export default ImageGeneratorScreen;