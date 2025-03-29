import { useState } from 'react';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { ImagePickerAsset } from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import ApiService from '../services/api';

export const useOutfitSwap = () => {
  // Images
  const [primaryImage, setPrimaryImage] = useState<ImagePickerAsset | null>(null);
  const [secondaryImage, setSecondaryImage] = useState<ImagePickerAsset | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  
  // State
  const [prompt, setPrompt] = useState(
    'Take the person from the first image and precisely dress them in the exact outfit from the second reference image. Transfer every detail of the outfit - including exact fabric patterns, textures, colors, seams, buttons, zippers, logos, embroidery, and all decorative elements - without any modifications or artistic interpretations. Maintain the complete fidelity of the reference clothing while naturally adapting it to the person\'s body shape, pose, and proportions. Pay special attention to how the garment would realistically fold, drape, and interact with light based on the person\'s position and the lighting conditions in their original photo. The final result should look like a professional photograph of the person actually wearing the precise outfit from the reference image.'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<string | null>(null);

  // Handle image processing
  const processImages = async () => {
    if (!primaryImage || !secondaryImage) {
      setError('Please select both a person image and a reference outfit image');
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
      const response = await ApiService.outfitSwap(primaryImage, secondaryImage, prompt);
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
      console.error('Error processing images:', err);
      setError('Error processing your images. Please try again with different images or adjust your prompt.');
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
      const fileUri = FileSystem.documentDirectory + 'outfit_swap_result.jpg';
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
    setPrimaryImage(null);
    setSecondaryImage(null);
    setResultImage(null);
    setPrompt('Take the person from the first image and precisely dress them in the exact outfit from the second reference image. Transfer every detail of the outfit - including exact fabric patterns, textures, colors, seams, buttons, zippers, logos, embroidery, and all decorative elements - without any modifications or artistic interpretations. Maintain the complete fidelity of the reference clothing while naturally adapting it to the person\'s body shape, pose, and proportions. Pay special attention to how the garment would realistically fold, drape, and interact with light based on the person\'s position and the lighting conditions in their original photo. The final result should look like a professional photograph of the person actually wearing the precise outfit from the reference image.');
    setError(null);
    setResponseText(null);
  };

  return {
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
  };
};