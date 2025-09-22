import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Image, StatusBar, ScrollView } from 'react-native';
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
  const [userName, setUserName] = useState('User');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    const initializeProfile = async () => {
      await Notifications.requestPermissionsAsync();
      
      try {
        // Cargar el nombre del usuario
        const savedUserName = await AsyncStorage.getItem('userName');
        if (savedUserName !== null) {
          setUserName(savedUserName);
        }
        
        // Cargar el estado de las notificaciones desde AsyncStorage
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
        console.error('Error loading profile settings:', error);
      }
    };
    
    initializeProfile();
  }, []);

  const handleEditName = () => {
    setTempName(userName);
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (tempName.trim().length === 0) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    try {
      await AsyncStorage.setItem('userName', tempName.trim());
      setUserName(tempName.trim());
      setIsEditingName(false);
      Alert.alert('Success', 'Name updated successfully');
    } catch (error) {
      console.error('Error saving user name:', error);
      Alert.alert('Error', 'Could not save name');
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setTempName('');
  };

  const handleNotificationsToggle = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    
    // Guardar el estado en AsyncStorage
    try {
      await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(newValue));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
    
    if (newValue) {
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
      { text: 'Logout',   onPress: async () => {
        try {
          await AsyncStorage.removeItem("user_uid");
          console.log("✅ UID eliminado de AsyncStorage");
          navigation.replace('WelcomeScreen');
          // aquí también podrías navegar al login, por ejemplo:
          // navigation.replace("Login");
        } catch (error) {
          console.error("❌ Error eliminando UID:", error);
        }
      }  },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'Are you sure you want to delete your account? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', onPress: async () => {
        try {
          await AsyncStorage.removeItem("user_uid");
          console.log("✅ UID eliminado de AsyncStorage");
          navigation.replace('WelcomeScreen');
          // aquí también podrías navegar al login, por ejemplo:
          // navigation.replace("Login");
        } catch (error) {
          console.error("❌ Error eliminando UID:", error);
        }}, style: 'destructive' },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" translucent={false} />
      
      {/* Header with gradient background */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <View style={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <View style={styles.profileImageContainer}>
              <Image 
                source={require('../../assets/icono-profile.png')} 
                style={styles.profileIcon}
                resizeMode="contain"
              />
            </View>
            
            {isEditingName ? (
              <View style={styles.editNameContainer}>
                <TextInput
                  style={styles.nameInput}
                  value={tempName}
                  onChangeText={setTempName}
                  placeholder="Enter your name"
                  autoFocus={true}
                  maxLength={30}
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveName}>
                    <Ionicons name="checkmark" size={20} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
                    <Ionicons name="close" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.nameContainer}>
                <Text style={styles.profileName}>{userName}</Text>
                <TouchableOpacity style={styles.editButton} onPress={handleEditName}>
                  <Ionicons name="pencil" size={16} color="#667eea" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          {/* Notifications Button */}
          <TouchableOpacity 
            style={[styles.settingItem, styles.notificationButton]} 
            onPress={handleNotificationsToggle}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: notificationsEnabled ? '#4CAF50' : '#ccc' }]}>
                <Ionicons 
                  name={notificationsEnabled ? "notifications" : "notifications-off"} 
                  size={20} 
                  color="white" 
                />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Daily Notifications</Text>
                <Text style={styles.settingSubtitle}>
                  {notificationsEnabled ? 'Enabled - 8:00 AM' : 'Disabled'}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: notificationsEnabled ? '#4CAF50' : '#f44336' }]}>
              <Text style={styles.statusText}>
                {notificationsEnabled ? 'ON' : 'OFF'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#FF9800' }]}>
                <Ionicons name="log-out-outline" size={20} color="white" />
              </View>
              <Text style={styles.settingTitle}>Sign Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleDeleteAccount}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#f44336' }]}>
                <Ionicons name="trash-outline" size={20} color="white" />
              </View>
              <Text style={[styles.settingTitle, styles.deleteText]}>Delete Account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#f44336" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 64,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileIcon: {
    width: 60,
    height: 60,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  editNameContainer: {
    alignItems: 'center',
    width: '100%',
  },
  nameInput: {
    borderWidth: 2,
    borderColor: '#667eea',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
    width: '80%',
    backgroundColor: 'white',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 24,
    padding: 12,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: '#f44336',
    borderRadius: 24,
    padding: 12,
    elevation: 2,
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginLeft: 4,
  },
  settingItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  notificationButton: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteText: {
    color: '#f44336',
  },
});

export default ProfileScreen;