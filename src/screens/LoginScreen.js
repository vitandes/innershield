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
        console.log("Apple login successful!", uid);
       
        navigation.navigate('HomeScreen');
      } else {
        throw new Error("Apple identity token was not received.");
      }
    } catch (error) {
      if (error.code === "ERR_REQUEST_CANCELED") {
        console.log("User canceled Apple sign-in.");
      } else {
        
        console.log("Error", "An error occurred while trying to sign in with Apple.");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>InnerShield</Text>
        <Text style={styles.subtitle}>Your safe space</Text>

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