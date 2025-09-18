import React, { useState } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { View, StyleSheet, Alert, ActivityIndicator, Text } from 'react-native';
import auth from '@react-native-firebase/auth';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithApple } = useAuth();

  const handleAppleSignIn = async () => {
    try {
      setIsLoading(true);
      
      // Realizar la autenticación con Apple
      const appleAuthRequestResponse = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Crear las credenciales de Firebase
      const { identityToken, nonce } = appleAuthRequestResponse;
      
      if (identityToken) {
        const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);
        
        // Usar el método del AuthContext para mantener consistencia
        await signInWithApple(appleCredential);
        
        console.log('Apple Sign-In successful');
      } else {
        throw new Error('No identity token received from Apple');
      }
      
    } catch (error) {
      console.error('Apple Sign-In Error:', error);
      
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // El usuario canceló el proceso de autenticación
        console.log('User canceled Apple Sign-In');
      } else {
        // Mostrar error al usuario
        Alert.alert(
          'Error de Autenticación',
          'No se pudo completar el inicio de sesión con Apple. Por favor, inténtalo de nuevo.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido a InnerShield</Text>
      <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Iniciando sesión...</Text>
        </View>
      ) : (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={8}
          style={styles.button}
          onPress={handleAppleSignIn}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    width: 280,
    height: 44,
    marginTop: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});
