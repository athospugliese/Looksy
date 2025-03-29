import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface PromptProps {
  value: string;
  onChangeText: (text: string) => void;
}

const Prompt: React.FC<PromptProps> = ({ value, onChangeText }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>INSTRUCTIONS</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        multiline
        numberOfLines={6}
        placeholder="Specify how you want the outfit to be applied"
        placeholderTextColor="#999"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 12,
    height: 120,
    fontSize: 14,
    fontWeight: '300',
    color: '#000',
    textAlignVertical: 'top',
  },
});

export default Prompt;