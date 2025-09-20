import React, { useState, useEffect } from 'react';
import {
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RevenueCatUI from 'react-native-purchases-ui';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

const PaywallScreen = () => {
  const navigation = useNavigation();
  const [offering, setOffering] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);

    const getOfferings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!Purchases.isConfigured()) {
            console.warn("Purchases SDK no está configurado. Por favor, llama a Purchases.configure() primero.");
        }

        const offerings = await Purchases.getOfferings();
        if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
          setOffering(offerings.current);
        } else {
          setError("No current offering found or no available packages.");
          console.warn("No current offering found or no available packages.");
        }
      } catch (e) {
        setError("Error fetching offerings: " + e.message);
        console.error("Error fetching offerings:", e);
      } finally {
        setIsLoading(false);
      }
    };

    getOfferings();
  }, []);

  const handlePurchaseCompleted = async (customerInfo) => {
    console.log("Purchase completed event received!");
    console.log("🟢 ID original:", customerInfo.originalAppUserId);
    await AsyncStorage.setItem('hasSeenPaywall', 'true');
    navigation.navigate('Login');
  };

  const handleRestoreCompleted = async (customerInfo) => {
    console.log("Restore completed event received!");
    console.log("Restored CustomerInfo:", customerInfo);
    await AsyncStorage.setItem('hasSeenPaywall', 'true');
    navigation.navigate('Login');
  };

  const handleDismiss = () => {
    console.log("Paywall dismissed");
    navigation.goBack();
  };

  if (isLoading) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  if (error) {
    Alert.alert("Error", error);
    return null;
  }

  return (
    <RevenueCatUI.Paywall
      options={{ offering: offering }}
      onPurchaseCompleted={handlePurchaseCompleted}
      onRestoreCompleted={handleRestoreCompleted}
      onDismiss={handleDismiss}
    />
  );
};

export default PaywallScreen;