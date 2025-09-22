import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

import HomeScreen from '../screens/HomeScreen';
import InsightsScreen from '../screens/InsightsScreen';
import SOSScreen from '../screens/SOSScreen';
import SOSFeedbackScreen from '../screens/SOSFeedbackScreen';
import BreathingFeedbackScreen from '../screens/BreathingFeedbackScreen';
import ShieldScreen from '../screens/ShieldScreen';
import MoreScreen from '../screens/MoreScreen';
import BreathingScreen from '../screens/BreathingScreen';
import SleepMelodiesScreen from '../screens/SleepMelodiesScreen';
import JournalScreen from '../screens/JournalScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import Paywall from '../screens/Paywall';
import LoginScreen from '../screens/LoginScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import { Platform } from 'react-native';

import Purchases from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  const { colors } = useTheme();

 
 
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Insights') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary.purple,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: 25, // Aumentado para más espacio
          paddingTop: 5,
          height: 80, // Aumentado para el nuevo padding
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="Insights" 
        component={InsightsScreen} 
        options={{ title: 'My Journey' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isDarkMode, colors } = useTheme();
  const [hasSubscription, setHasSubscription] = useState(null);
  const [uid, setUid] = useState(null);

  

  const hasActiveSubscription = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const id = await AsyncStorage.getItem("user_uid");
      setUid(id);
      return Object.keys(customerInfo.entitlements.active).length > 0;
    } catch (e) {
      console.error("Error verificando suscripción:", e);
      return false;
    }
  };

  useEffect(() => {
    

   const checkSubscription = async () => {
      const active = await hasActiveSubscription();
      console.log("✅ ¿Tiene suscripción activa?:", active);
      setHasSubscription(active);
    };

    checkSubscription();


  }, []);

  
  
  // Tema personalizado para Navigation Container
  const navigationTheme = {
    ...isDarkMode ? DarkTheme : DefaultTheme,
    colors: {
      ...isDarkMode ? DarkTheme.colors : DefaultTheme.colors,
      primary: colors.primary.purple,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  // Mientras carga la info de RevenueCat mostramos pantalla vacía o loading
  if (hasSubscription === null) {
    return null;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {hasSubscription && uid ? (
          // Si tiene suscripción activa → va directo al Home (Main)
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          // Si no tiene suscripción → Onboarding (o Paywall si prefieres)
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
        )}

        {/* Otras pantallas que quieres mantener accesibles */}
        
        <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Paywall" component={Paywall} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="SOS" component={SOSScreen} />
        <Stack.Screen name="Shield" component={ShieldScreen} />
        <Stack.Screen name="More" component={MoreScreen} />
        <Stack.Screen name="Breathing" component={BreathingScreen} />
        <Stack.Screen name="SOSFeedback" component={SOSFeedbackScreen} />
        <Stack.Screen name="BreathingFeedback" component={BreathingFeedbackScreen} />
        <Stack.Screen name="SleepMelodies" component={SleepMelodiesScreen} />
        <Stack.Screen name="Journal" component={JournalScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}