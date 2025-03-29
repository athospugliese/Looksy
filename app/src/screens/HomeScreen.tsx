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
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import Prompt from '../components/Prompt';
import { useOutfitSwap } from '../hooks/useOutfitSwap';

const HomeScreen = ({ navigation }: any) => {
  const {
    primaryImage,
    secondaryImage,
    resultImage,
    prompt,
    isLoading,
    error,
    responseText,
    setPrimaryImage,
    setSecondaryImage,
    setPrompt,
    processImages,
    saveImage,
    resetForm
  } = useOutfitSwap();

  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to bottom when result is received
  React.useEffect(() => {
    if (resultImage && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 500);
    }
  }, [resultImage]);

  const pickPrimaryImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setPrimaryImage(result.assets[0]);
    }
  };

  const pickSecondaryImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSecondaryImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!primaryImage || !secondaryImage) {
      Alert.alert('Missing Images', 'Please select both a person image and an outfit image');
      return;
    }
    await processImages();
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView ref={scrollViewRef} style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Upload a person photo and a reference outfit to create a seamless outfit swap
        </Text>

        <View style={styles.imagePickersContainer}>
          <View style={styles.imagePicker}>
            <Text style={styles.imagePickerLabel}>PERSON</Text>
            <TouchableOpacity style={styles.imageContainer} onPress={pickPrimaryImage}>
              {primaryImage ? (
                <Image 
                  source={{ uri: primaryImage.uri }} 
                  style={styles.image} 
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Feather name="user" size={28} color="#000" />
                  <Text style={styles.placeholderText}>SELECT PERSON</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.imagePicker}>
            <Text style={styles.imagePickerLabel}>OUTFIT</Text>
            <TouchableOpacity style={styles.imageContainer} onPress={pickSecondaryImage}>
              {secondaryImage ? (
                <Image 
                  source={{ uri: secondaryImage.uri }} 
                  style={styles.image} 
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Feather name="shopping-bag" size={28} color="#000" />
                  <Text style={styles.placeholderText}>SELECT OUTFIT</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Prompt
          value={prompt}
          onChangeText={setPrompt}
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.button, 
              (!primaryImage || !secondaryImage || isLoading) && styles.buttonDisabled
            ]} 
            onPress={handleSubmit}
            disabled={!primaryImage || !secondaryImage || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="refresh-cw" size={18} color="#fff" />
                <Text style={styles.buttonText}>SWAP OUTFIT</Text>
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
          style={[styles.navItem, styles.activeNavItem]} 
          onPress={() => {}}
        >
          <Feather name="repeat" size={20} color="#000" />
          <Text style={[styles.navText, styles.activeNavText]}>OUTFIT</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation.navigate('ImageGenerator')}
        >
          <Feather name="image" size={20} color="#666" />
          <Text style={styles.navText}>CREATE</Text>
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
  imagePickersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  imagePicker: {
    width: '48%',
  },
  imagePickerLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: 1,
  },
  imageContainer: {
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 10,
    color: '#666',
    letterSpacing: 1,
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

export default HomeScreen;