import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import LoginScreen from '../screens/LoginScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import HomeScreen from '../screens/HomeScreen';
import ShieldScreen from '../screens/ShieldScreen';
import BreathingScreen from '../screens/BreathingScreen';
import SOSScreen from '../screens/SOSScreen';
import JournalScreen from '../screens/JournalScreen';
import InsightsScreen from '../screens/InsightsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MoreScreen from '../screens/MoreScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import BreathingFeedbackScreen from '../screens/BreathingFeedbackScreen';
import SOSFeedbackScreen from '../screens/SOSFeedbackScreen';
import SleepMelodiesScreen from '../screens/SleepMelodiesScreen';
import PaywallScreen from '../screens/PaywallScreen';

// Context
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Colors
import { colors } from '../theme/colors';

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
  const { user, isLoading, initializing } = useAuth();
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [hasSeenPaywall, setHasSeenPaywall] = useState(false);
  const [isCheckingFlow, setIsCheckingFlow] = useState(true);

  // Verificar el estado del flujo de onboarding
  useEffect(() => {
    const checkOnboardingFlow = async () => {
      try {
        const welcomeStatus = await AsyncStorage.getItem('hasSeenWelcome');
        const onboardingStatus = await AsyncStorage.getItem('hasSeenOnboarding');
        const paywallStatus = await AsyncStorage.getItem('hasSeenPaywall');
        
        setHasSeenWelcome(welcomeStatus === 'true');
        setHasSeenOnboarding(onboardingStatus === 'true');
        setHasSeenPaywall(paywallStatus === 'true');
      } catch (error) {
        console.error('Error checking onboarding flow:', error);
      } finally {
        setIsCheckingFlow(false);
      }
    };

    checkOnboardingFlow();
  }, []);

  // Función para determinar la pantalla inicial
  const getInitialScreen = () => {
    if (!user) {
      // Si no hay usuario, mostrar el flujo completo desde Welcome
      if (!hasSeenWelcome) return 'Welcome';
      if (!hasSeenOnboarding) return 'Onboarding';
      if (!hasSeenPaywall) return 'Paywall';
      return 'Login';
    } else {
      // Si hay usuario autenticado, ir directamente al Main
      return 'Main';
    }
  };
  
  // Mostrar loading mientras se inicializa la autenticación o se verifica el flujo
  if (initializing || isLoading || isCheckingFlow) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color={colors.primary.purple} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={getInitialScreen()}
        screenOptions={{
          headerShown: false,
        }}>
        {/* Pantallas del flujo de onboarding */}
        <Stack.Screen 
          name="Welcome" 
          component={WelcomeScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Paywall" 
          component={PaywallScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        
        {/* Pantallas principales de la app */}
        <Stack.Screen 
          name="Main" 
          component={TabNavigator} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Breathing" 
          component={BreathingScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="BreathingFeedback" 
          component={BreathingFeedbackScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="SOSFeedback" 
          component={SOSFeedbackScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="SleepMelodies" 
          component={SleepMelodiesScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="SOS" 
          component={SOSScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Journal" 
          component={JournalScreen} 
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};