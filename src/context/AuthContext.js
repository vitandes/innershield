import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";
import firebase from "@react-native-firebase/app";
import auth from "@react-native-firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);

  useEffect(() => {
    const initializeFirebase = () => {
      try {
        console.log("Iniciando inicialización de Firebase...");
        
        // Verificar si estamos en plataforma web
        if (Platform.OS === 'web') {
          console.log("Plataforma web detectada - Firebase no se inicializa");
          // En web, marcamos como no inicializado para evitar errores
          setFirebaseInitialized(false);
          return;
        }
        
        // Para React Native Firebase en móviles, no necesitamos inicializar manualmente
        // Firebase se inicializa automáticamente usando GoogleService-Info.plist
        console.log("Verificando inicialización automática de Firebase...");
        
        // Verificar si Firebase ya está inicializado automáticamente
        if (firebase.apps && firebase.apps.length > 0) {
          console.log("Firebase ya está inicializado automáticamente");
          console.log("Apps disponibles:", firebase.apps.length);
          setFirebaseInitialized(true);
        } else {
          // Si no hay apps, intentar acceder a la app por defecto
          try {
            const defaultApp = firebase.app();
            console.log("App por defecto encontrada:", defaultApp.name);
            setFirebaseInitialized(true);
          } catch (error) {
            console.log("No se encontró app por defecto, inicializando manualmente...");
            
            // Solo como último recurso, inicializar manualmente
            const firebaseConfig = {
              apiKey: 'AIzaSyB-k_TH5FKgaMnI9bxNuQO0rL3TbX1QZHY',
              appId: '1:723865358816:ios:d7077e9763fd1400769b85',
              projectId: 'innershield-a6c20',
              storageBucket: 'innershield-a6c20.firebasestorage.app',
              messagingSenderId: '723865358816',
              databaseURL: 'https://innershield-a6c20-default-rtdb.firebaseio.com'
            };
            
            firebase.initializeApp(firebaseConfig);
            console.log("Firebase inicializado manualmente");
            setFirebaseInitialized(true);
          }
        }
      } catch (error) {
        if (error.code === 'app/duplicate-app') {
          console.log("Firebase ya estaba inicializado (duplicate app)");
          setFirebaseInitialized(true);
        } else {
          console.error("Error al inicializar Firebase:", error);
          setFirebaseInitialized(false);
        }
      }
    };

    initializeFirebase();
  }, []);

  // Handle user state changes
  function onAuthStateChanged(user) {
    console.log(
      "Auth state changed:",
      user ? "User logged in" : "User logged out"
    );
    
    // Guardar UID en AsyncStorage cuando el usuario se loggea
    if (user && user.uid) {
      saveUserUID(user.uid);
    } else {
      // Opcional: limpiar UID cuando el usuario se desloggea
      clearUserUID();
    }
    
    setUser(user);
    if (initializing) setInitializing(false);
    setIsLoading(false);
  }

  // Función para guardar el UID en AsyncStorage
  const saveUserUID = async (uid) => {
    try {
      await AsyncStorage.setItem('userUID', uid);
      console.log('UID guardado en AsyncStorage:', uid);
    } catch (error) {
      console.error('Error guardando UID en AsyncStorage:', error);
    }
  };

  // Función para limpiar el UID del AsyncStorage
  const clearUserUID = async () => {
    try {
      await AsyncStorage.removeItem('userUID');
      console.log('UID eliminado del AsyncStorage');
    } catch (error) {
      console.error('Error eliminando UID del AsyncStorage:', error);
    }
  };

  // Función para obtener el UID guardado
  const getUserUID = async () => {
    try {
      const uid = await AsyncStorage.getItem('userUID');
      if (uid) {
        console.log('UID recuperado del AsyncStorage:', uid);
        return uid;
      } else {
        console.log('No hay UID guardado en AsyncStorage');
        return null;
      }
    } catch (error) {
      console.error('Error obteniendo UID del AsyncStorage:', error);
      return null;
    }
  };

  // Set up the authentication listener after Firebase has been initialized
  useEffect(() => {
    // Solo configurar el listener en plataformas móviles donde Firebase está disponible
    if (firebaseInitialized && Platform.OS !== 'web') {
      console.log("Configurando listener de autenticación");
      try {
        // Verificar que auth esté disponible antes de configurar el listener
        const authInstance = auth();
        if (authInstance) {
          const subscriber = authInstance.onAuthStateChanged(onAuthStateChanged);
          return subscriber; // unsubscribe on unmount
        } else {
          console.error("Auth instance no disponible");
          setInitializing(false);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error configurando listener de autenticación:", error);
        setInitializing(false);
        setIsLoading(false);
      }
    } else if (Platform.OS === 'web') {
      // En web, simplemente marcamos como no inicializando
      console.log("Plataforma web - no se configura listener de Firebase");
      setInitializing(false);
      setIsLoading(false);
    }
  }, [firebaseInitialized]);

  // Sign out function
  const signOut = async () => {
    try {
      setIsLoading(true);
      await auth().signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete account function
  const deleteAccount = async () => {
    try {
      setIsLoading(true);
      const currentUser = auth().currentUser;
      if (currentUser) {
        await currentUser.delete();
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with Apple (moved from LoginScreen for consistency)
  const signInWithApple = async (appleCredential) => {
    try {
      setIsLoading(true);
      console.log("AuthContext: Iniciando sesión con credenciales de Apple...");
      
      // Verificar que estamos en una plataforma móvil
      if (Platform.OS === 'web') {
        console.error('AuthContext: Apple Sign-In no está disponible en web');
        throw new Error('Apple Sign-In no está disponible en web');
      }

      // Verificar que Firebase esté inicializado
      if (!firebaseInitialized) {
        console.error("AuthContext: Firebase no está inicializado aún");
        throw new Error("Firebase no está inicializado");
      }

      // Obtener la instancia de auth directamente
      console.log("AuthContext: Obteniendo instancia de auth...");
      const authInstance = auth();
      
      if (!authInstance) {
        console.error("AuthContext: Auth instance no disponible");
        throw new Error("Auth instance not available");
      }

      console.log(
        "AuthContext: Auth verificado, procediendo con autenticación..."
      );
      const userCredential = await authInstance.signInWithCredential(
        appleCredential
      );
      console.log(
        "AuthContext: Usuario autenticado exitosamente:",
        userCredential.user.uid
      );

      return userCredential;
    } catch (error) {
      console.error("AuthContext: Error signing in with Apple:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    initializing,
    signOut,
    deleteAccount,
    signInWithApple,
    isAuthenticated: !!user,
    getUserUID, // Exponemos la función para obtener el UID
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
