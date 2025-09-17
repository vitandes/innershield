import React from 'react';
import { View, StyleSheet, Alert, Text, StatusBar, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as AppleAuthentication from 'expo-apple-authentication';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const navigation = useNavigation();

  // Función para manejar el inicio de sesión con Apple
  async function onAppleButtonPress() {
    try {
      // 1. Inicia el proceso de autenticación con Apple
      const appleAuthRequest = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      
      // 2. Obtén el token de identidad que devuelve Apple
      const { identityToken } = appleAuthRequest;

      if (identityToken) {
        // 3. Crea una credencial de Firebase con el proveedor de Apple
        const appleCredential = auth.AppleAuthProvider.credential(identityToken);

        // 4. Inicia sesión en Firebase con esa credencial
        const userCredential = await auth().signInWithCredential(appleCredential);
        
        console.log("¡Usuario autenticado con éxito!", userCredential.user);
        navigation.navigate('Welcome');
        return userCredential;
      } else {
        throw new Error('No se recibió el token de identidad de Apple.');
      }

    } catch (error) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // El usuario canceló el inicio de sesión
        console.log('El usuario canceló el inicio de sesión con Apple.');
      } else {
        // Manejo de otros errores
        Alert.alert("Error de autenticación", "Algo salió mal al intentar iniciar sesión con Apple.");
        console.error(error);
      }
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary.purple} />
      
      {/* Fondo con gradiente */}
      <LinearGradient
        colors={colors.gradients.mindful}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Elementos decorativos */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
        
        {/* Contenido principal */}
        <View style={styles.content}>
          {/* Logo/Icono de la app */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Ionicons name="shield-checkmark" size={60} color={colors.neutral.white} />
            </View>
          </View>
          
          {/* Título y subtítulo */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>InnerShield</Text>
            <Text style={styles.subtitle}>Tu espacio seguro para el bienestar mental</Text>
            <Text style={styles.description}>
              Inicia sesión para acceder a herramientas de mindfulness, 
              respiración guiada y apoyo emocional personalizado
            </Text>
          </View>
          
          {/* Botón de Apple */}
          <View style={styles.buttonContainer}>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={25}
              style={styles.appleButton}
              onPress={onAppleButtonPress}
            />
          </View>
          
          {/* Texto de privacidad */}
          <Text style={styles.privacyText}>
            Al continuar, aceptas nuestros términos de servicio y política de privacidad
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    position: 'relative',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.alpha.white20,
    top: -50,
    right: -50,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.alpha.white10,
    bottom: 100,
    left: -30,
  },
  decorativeCircle3: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.alpha.white15,
    top: height * 0.3,
    right: 30,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.alpha.white20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.neutral.black,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.neutral.white,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: colors.alpha.white90,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: colors.alpha.white80,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 30,
  },
  appleButton: {
    width: '100%',
    height: 55,
    shadowColor: colors.neutral.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  privacyText: {
    fontSize: 12,
    color: colors.alpha.white70,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});