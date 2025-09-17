import React, { createContext, useContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Handle user state changes
  function onAuthStateChanged(user) {
    console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
    setUser(user);
    if (initializing) setInitializing(false);
    setIsLoading(false);
  }

  useEffect(() => {
    try {
      const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
      return subscriber; // unsubscribe on unmount
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      setInitializing(false);
      setIsLoading(false);
    }
  }, [initializing]);

  // Sign out function
  const signOut = async () => {
    try {
      setIsLoading(true);
      await auth().signOut();
    } catch (error) {
      console.error('Error signing out:', error);
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
      console.error('Error deleting account:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with Apple (moved from LoginScreen for consistency)
  const signInWithApple = async (appleCredential) => {
    try {
      setIsLoading(true);
      const userCredential = await auth().signInWithCredential(appleCredential);
      return userCredential;
    } catch (error) {
      console.error('Error signing in with Apple:', error);
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;