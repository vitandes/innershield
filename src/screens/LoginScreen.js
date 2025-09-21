import React from 'react';
import { View, StyleSheet, Alert, Text, SafeAreaView } from 'react-native';
import { auth } from '../../firebaseConfig';
import * as AppleAuthentication from 'expo-apple-authentication';
import { OAuthProvider, signInWithCredential } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';

export default function LoginScreen({ navigation }) {
  const onAppleButtonPress = async () => {
    try {
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { identityToken, nonce } = appleCredential;

      if (identityToken) {
        const provider = new OAuthProvider("apple.com");
        const credential = provider.credential({
          idToken: identityToken,
          rawNonce: nonce,
        });

        const userCredential = await signInWithCredential(auth, credential);
        await AsyncStorage.setItem("user_uid", userCredential.user.uid);
        const uid = await AsyncStorage.getItem("user_uid");
        await Purchases.logIn(uid);
        console.log("¡Login con Apple exitoso!", uid);
       
        navigation.navigate('Main');
      } else {
        throw new Error("No se recibió el token de identidad de Apple.");
      }
    } catch (error) {
      if (error.code === "ERR_REQUEST_CANCELED") {
        console.log("El usuario canceló el inicio de sesión con Apple.");
      } else {
        
        console.log("Error", "Ocurrió un error al intentar iniciar sesión con Apple.");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>InnerShield</Text>
        <Text style={styles.subtitle}>Tu espacio seguro</Text>

        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={8}
          style={styles.appleButton}
          onPress={onAppleButtonPress}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#B39DDB",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#FFFFFF",
    marginBottom: 60,
  },
  appleButton: {
    width: "80%",
    height: 50,
  },
});