import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, TextInput, Image, StatusBar, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dailyMessages } from '../data/dailyMessages';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

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
  const { signOut, deleteAccount } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [userName, setUserName] = useState('Usuario');
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
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    try {
      await AsyncStorage.setItem('userName', tempName.trim());
      setUserName(tempName.trim());
      setIsEditingName(false);
      Alert.alert('Éxito', 'Nombre actualizado correctamente');
    } catch (error) {
      console.error('Error saving user name:', error);
      Alert.alert('Error', 'No se pudo guardar el nombre');
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setTempName('');
  };

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
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', onPress: signOut }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar Cuenta',
      '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: deleteAccount }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.profileInfo}>
          <Image 
            source={require('../../assets/icono-profile.png')} 
            style={styles.profileIcon}
            resizeMode="contain"
          />
          {isEditingName ? (
            <View style={styles.editNameContainer}>
              <TextInput
                style={styles.nameInput}
                value={tempName}
                onChangeText={setTempName}
                placeholder="Ingresa tu nombre"
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
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
            <Text style={[styles.menuItemText, styles.deleteText]}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.lightestGray,
  },
  headerGradient: {
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.alpha.white20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.neutral.white,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  profileImageContainer: {
    marginBottom: 15,
  },
  profileImageBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.alpha.white20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.neutral.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  profileName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.neutral.white,
    marginRight: 10,
  },
  editButton: {
    padding: 8,
    borderRadius: 15,
    backgroundColor: colors.alpha.white20,
  },
  profileSubtitle: {
    fontSize: 16,
    color: colors.alpha.white80,
    textAlign: 'center',
  },
  editNameContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  nameInput: {
    borderWidth: 2,
    borderColor: colors.alpha.white30,
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 15,
    width: '80%',
    backgroundColor: colors.alpha.white20,
    color: colors.neutral.white,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  saveButton: {
    backgroundColor: colors.secondary.mint,
    borderRadius: 25,
    padding: 12,
    shadowColor: colors.neutral.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: colors.primary.red,
    borderRadius: 25,
    padding: 12,
    shadowColor: colors.neutral.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral.darkGray,
    marginBottom: 12,
    marginLeft: 5,
  },
  menuCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    shadowColor: colors.neutral.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.neutral.darkGray,
    fontWeight: '500',
  },
  deleteText: {
    color: colors.primary.red,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral.lightGray,
    marginHorizontal: 20,
  },
  bottomSpacing: {
    height: 30,
  },
});

export default ProfileScreen;