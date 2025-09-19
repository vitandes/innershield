import React, { useState } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { View, StyleSheet, Alert, ActivityIndicator, Text, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

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
          'Authentication Error',
          'Could not complete Apple Sign-In. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      <LinearGradient
        colors={colors.gradients.mindful}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative Elements */}
        <View style={styles.decorativeContainer}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
        </View>

        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* Logo/Icon Section */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[colors.neutral.white, colors.primary.lavenderLight]}
              style={styles.logoBackground}
            >
              <Ionicons name="shield-checkmark" size={60} color={colors.primary.purpleDark} />
            </LinearGradient>
          </View>

          {/* Welcome Text */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>Welcome to</Text>
            <Text style={styles.appName}>InnerShield</Text>
            <Text style={styles.subtitle}>
              Your safe space for mental wellness
            </Text>
          </View>

          {/* Login Section */}
          <View style={styles.loginContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <LinearGradient
                  colors={[colors.neutral.white, colors.primary.lavenderLight]}
                  style={styles.loadingBackground}
                >
                  <ActivityIndicator size="large" color={colors.primary.purpleDark} />
                </LinearGradient>
                <Text style={styles.loadingText}>Signing in...</Text>
              </View>
            ) : (
              <View style={styles.buttonContainer}>
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={25}
                  style={styles.appleButton}
                  onPress={handleAppleSignIn}
                />
                
                {/* Additional Visual Elements */}
                <View style={styles.securityContainer}>
                  <Ionicons name="lock-closed" size={16} color={colors.neutral.white} />
                  <Text style={styles.securityText}>
                    Secure and private sign-in
                  </Text>
                </View>
              </View>
            )}
          </View>
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
  decorativeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.1,
  },
  circle1: {
    width: 200,
    height: 200,
    backgroundColor: colors.neutral.white,
    top: -100,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    backgroundColor: colors.primary.lavender,
    top: height * 0.3,
    left: -75,
  },
  circle3: {
    width: 100,
    height: 100,
    backgroundColor: colors.neutral.white,
    bottom: height * 0.2,
    right: -30,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 100,
    paddingBottom: 50,
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary.purpleDark,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '300',
    color: colors.neutral.white,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.neutral.white,
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.neutral.white,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
    maxWidth: width * 0.8,
  },
  loginContainer: {
    width: '100%',
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  appleButton: {
    width: width * 0.8,
    height: 50,
    marginBottom: 20,
    shadowColor: colors.neutral.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  securityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  securityText: {
    fontSize: 14,
    color: colors.neutral.white,
    marginLeft: 8,
    opacity: 0.8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.primary.purpleDark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    fontSize: 16,
    color: colors.neutral.white,
    fontWeight: '500',
    textAlign: 'center',
  },
});
