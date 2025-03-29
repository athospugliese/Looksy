import { useState } from 'react';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Platform } from 'react-native';
import ApiService from '../services/api';

export const useImageGenerator = () => {
  // State
  const [prompt, setPrompt] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<string | null>(null);

  // Handle image generation
  const generateImage = async () => {
    if (prompt.trim() === '') {
      setError('Please enter a description for the image you want to create');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponseText(null);
    setResultImage(null);

    try {
      // Request media library permissions (needed for iOS)
      if (Platform.OS === 'ios') {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access media library is required');
          setIsLoading(false);
          return;
        }
      }

      // Make API request using the service
      const response = await ApiService.generateImage(prompt);
      const data = response.data;
      
      if (data.image) {
        // Convert base64 to URI
        const imageDataUri = `data:${data.mime_type || 'image/jpeg'};base64,${data.image}`;
        setResultImage(imageDataUri);
        
        if (data.text) {
          setResponseText(data.text);
        }
      } else if (data.text) {
        setResponseText(data.text);
        setError('No image was generated, but the model provided a response');
      }
    } catch (err) {
      console.error('Error generating image:', err);
      setError('Error generating your image. Please try again with a different prompt.');
    } finally {
      setIsLoading(false);
    }
  };

  // Save the result image to gallery
  const saveImage = async () => {
    if (!resultImage) return;

    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to save images to your gallery');
        return;
      }

      // Create a temporary file from the base64 data
      const base64Data = resultImage.split(',')[1];
      const fileUri = FileSystem.documentDirectory + 'generated_image.jpg';
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Save to gallery
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      await MediaLibrary.createAlbumAsync('OutfitSwap', asset, false);

      Alert.alert('Success', 'Image saved to your gallery');
    } catch (err) {
      console.error('Error saving image:', err);
      Alert.alert('Error', 'Failed to save image to your gallery');
    }
  };

  // Reset the form
  const resetForm = () => {
    setPrompt('');
    setResultImage(null);
    setError(null);
    setResponseText(null);
  };

  return {
    prompt,
    setPrompt,
    resultImage,
    isLoading,
    error,
    responseText,
    generateImage,
    saveImage,
    resetForm
  };
};