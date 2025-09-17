import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { dailyMessages } from './src/data/dailyMessages';

// Configurar el handler de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Función para obtener el mensaje del día usando la misma lógica que HomeScreen
const getDailyMessage = async () => {
  try {
    const lastUpdateString = await AsyncStorage.getItem('lastDailyMessageUpdate');
    const lastUpdate = lastUpdateString ? new Date(lastUpdateString) : null;
    const now = new Date();
    const eightAmToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);

    let usedIndices = [];
    const usedIndicesString = await AsyncStorage.getItem('usedDailyMessagesIndices');
    if (usedIndicesString) {
      usedIndices = JSON.parse(usedIndicesString);
    }

    const needsUpdate = !lastUpdate || (now >= eightAmToday && lastUpdate < eightAmToday);

    if (needsUpdate) {
      if (usedIndices.length >= dailyMessages.length) {
        usedIndices = [];
      }

      let availableMessages = dailyMessages.filter((_, index) => !usedIndices.includes(index));
      if (availableMessages.length === 0) {
        usedIndices = [];
        availableMessages = dailyMessages;
      }

      const randomIndex = Math.floor(Math.random() * availableMessages.length);
      const selectedMessage = availableMessages[randomIndex];
      const originalIndex = dailyMessages.indexOf(selectedMessage);

      usedIndices.push(originalIndex);
      await AsyncStorage.setItem('usedDailyMessagesIndices', JSON.stringify(usedIndices));
      await AsyncStorage.setItem('lastDailyMessageUpdate', now.toISOString());
      return selectedMessage;
    } else {
      // Si no necesita actualización, devolver el último mensaje usado
      if (usedIndices.length > 0) {
        const lastUsedIndex = usedIndices[usedIndices.length - 1];
        return dailyMessages[lastUsedIndex];
      } else {
        // Fallback
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        return dailyMessages[dayOfYear % dailyMessages.length];
      }
    }
  } catch (error) {
    console.error('Error getting daily message:', error);
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    return dailyMessages[dayOfYear % dailyMessages.length];
  }
};

// Función para programar la notificación del día siguiente
const scheduleNextDayNotification = async () => {
  try {
    // Verificar si estamos en una plataforma que soporta notificaciones
    if (typeof window !== 'undefined') {
      // Estamos en web, las notificaciones no están disponibles
      console.log('Notifications not available on web platform');
      return;
    }
    
    // Cancelar notificaciones existentes
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Verificar si las notificaciones están habilitadas
    const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
    if (!notificationsEnabled || !JSON.parse(notificationsEnabled)) {
      return;
    }

    // Obtener el mensaje para mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    
    // Programar notificación para mañana a las 8 AM
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Message of the Day",
        body: "Your daily message is ready! Open the app to see it.",
      },
      trigger: {
        date: tomorrow,
      },
    });
    
    console.log('Next day notification scheduled for:', tomorrow);
  } catch (error) {
    console.error('Error scheduling next day notification:', error);
  }
};

// Función para inicializar el sistema de notificaciones automáticas
const initializeAutoNotifications = async () => {
  try {
    // Verificar si estamos en una plataforma que soporta notificaciones
    if (typeof window !== 'undefined') {
      // Estamos en web, las notificaciones no están disponibles
      console.log('Auto notifications not available on web platform');
      return;
    }
    
    // Solicitar permisos
    await Notifications.requestPermissionsAsync();
    
    // Programar la notificación del día siguiente
    await scheduleNextDayNotification();
    
    // Configurar un intervalo para reprogramar cada día
    const checkAndSchedule = async () => {
      const now = new Date();
      const eightAmToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
      
      // Si ya pasaron las 8 AM de hoy, programar para mañana
      if (now >= eightAmToday) {
        await scheduleNextDayNotification();
      }
    };
    
    // Verificar cada hora si necesitamos reprogramar
    setInterval(checkAndSchedule, 60 * 60 * 1000);
    
  } catch (error) {
    console.error('Error initializing auto notifications:', error);
  }
};

function AppContent() {
  const { isDarkMode } = useTheme();
  
  useEffect(() => {
    // Inicializar el sistema de notificaciones automáticas
    initializeAutoNotifications();
  }, []);
  
  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
