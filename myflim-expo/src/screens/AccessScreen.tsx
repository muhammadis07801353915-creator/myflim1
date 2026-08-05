import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { COLORS, SIZES, SPACING } from '../theme/theme';
import { Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AccessScreen() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const unlockApp = useAppStore(state => state.unlockApp);

  const handleSubmit = async () => {
    if (!code) {
      setError('تکایە کۆدەکە بنووسە');
      return;
    }
    const success = await unlockApp(code);
    if (!success) {
      setError('کۆدەکە هەڵەیە!');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#0F0F13', '#1A1D24']}
        style={styles.background}
      />
      
      <View style={styles.content}>
        <Image 
          source={require('../../assets/app-logo-new.png')} 
          style={{ width: 80, height: 80, borderRadius: 20, marginBottom: 16 }} 
          resizeMode="contain" 
        />
        
        <Text style={styles.title}>Taban Play</Text>
        <Text style={styles.subtitle}>بۆ چوونە ژوورەوە پێویستت بە کۆدە</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="کۆد بنووسە..."
            placeholderTextColor="#888"
            value={code}
            onChangeText={(text) => {
              setCode(text);
              setError('');
            }}
            secureTextEntry
            autoCapitalize="none"
            onSubmitEditing={handleSubmit}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>چوونە ژوورەوە</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F13',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.3)',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
    marginBottom: SPACING.sm,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: SPACING.md,
  },
  input: {
    padding: SPACING.md,
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  errorText: {
    color: COLORS.primary,
    marginBottom: SPACING.md,
    fontSize: 14,
    fontWeight: 'bold',
  },
  button: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
