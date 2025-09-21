import { initializeApp, getApps } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ⚠️ Usa los datos exactos de tu GoogleService-Info.plist (iOS) y google-services.json (Android)
const firebaseConfig = {
  apiKey: "AIzaSyACvTZXL3Za6skZcI7rqGzuUlSu5kGkmwo",
  authDomain: "innershield-a6c20.firebaseapp.com",
  projectId: "innershield-a6c20",
  storageBucket: "innershield-a6c20.firebasestorage.app",
  messagingSenderId: "723865358816",
  appId: "1:723865358816:web:d66ae20999b038e6769b85",
  measurementId: "G-M9SDHGR03M"
};

// Evitar inicialización doble
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Auth con persistencia para React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { app, auth };
