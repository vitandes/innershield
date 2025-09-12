import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dailyMessages } from '../data/dailyMessages';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

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

const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

const ProfileScreen = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    const initializeNotifications = async () => {
      await Notifications.requestPermissionsAsync();
      
      // Cargar el estado de las notificaciones desde AsyncStorage
      try {
        const savedNotificationState = await AsyncStorage.getItem('notificationsEnabled');
        if (savedNotificationState !== null) {
          const isEnabled = JSON.parse(savedNotificationState);
          setNotificationsEnabled(isEnabled);
          
          // Si las notificaciones están habilitadas, asegurar que hay una programada
          if (isEnabled) {
            await scheduleNextDayNotification();
          }
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    };
    
    initializeNotifications();
  }, []);

  const handleNotificationsToggle = async (value) => {
    setNotificationsEnabled(value);
    
    // Guardar el estado en AsyncStorage
    try {
      await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(value));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
    
    if (value) {
      await scheduleNextDayNotification();
      Alert.alert('Notifications Enabled', 'You will receive a daily message at 8:00 AM.');
    } else {
      await cancelAllNotifications();
      Alert.alert('Notifications Disabled', 'You will no longer receive daily messages.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: () => console.log('Logged out') },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'Are you sure you want to delete your account? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', onPress: () => console.log('Account deleted'), style: 'destructive' },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.profileInfo}>
          <Ionicons name="person-circle-outline" size={80} color="#ccc" />
          <Text style={styles.profileName}>User Name</Text>
        </View>

        <View style={styles.menu}>
          <View style={styles.menuItem}>
            <Text style={styles.menuItemText}>Enable Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
            />
          </View>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Text style={styles.menuItemText}>Logout</Text>
            <Ionicons name="log-out-outline" size={24} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
            <Text style={[styles.menuItemText, styles.deleteText]}>Delete Account</Text>
            <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  menu: {
    marginTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemText: {
    fontSize: 18,
  },
  deleteText: {
    color: '#FF6B6B',
  },
});

export default ProfileScreen;