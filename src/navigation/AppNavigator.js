import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

// Context
import { useAuth } from '../context/AuthContext';

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
  
  // Mostrar loading mientras se inicializa la autenticación
  if (initializing || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color={colors.primary.purple} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}>
        {user ? (
          // Usuario autenticado - mostrar pantallas principales
          <>
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
          </>
        ) : (
          // Usuario no autenticado - solo mostrar login
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};