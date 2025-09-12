import React from 'react';
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

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}>
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
          name="SOS" 
          component={SOSScreen} 
          options={{ 
            headerShown: false
          }}
        />
        <Stack.Screen 
          name="Shield" 
          component={ShieldScreen} 
          options={{ title: 'Protective Shield' }}
        />
        <Stack.Screen 
          name="More" 
          component={MoreScreen} 
          options={{ title: 'Settings' }}
        />
        <Stack.Screen 
          name="Breathing" 
          component={BreathingScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="SOSFeedback" 
          component={SOSFeedbackScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="BreathingFeedback" 
          component={BreathingFeedbackScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="SleepMelodies" 
          component={SleepMelodiesScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Journal" 
          component={JournalScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};