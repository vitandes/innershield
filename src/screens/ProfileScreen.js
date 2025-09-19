import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, TextInput, Image, StatusBar, ScrollView, Dimensions, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dailyMessages } from '../data/dailyMessages';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

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
  const { colors: themeColors } = useTheme();
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
    try {
      setNotificationsEnabled(value);
      
      // Guardar el estado en AsyncStorage
      await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(value));
      
      if (value) {
        // Solicitar permisos si no los tenemos
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          await scheduleNextDayNotification();
          Alert.alert('Notificaciones Activadas', 'Recibirás un mensaje diario a las 8:00 AM.');
        } else {
          // Si no se conceden permisos, revertir el estado
          setNotificationsEnabled(false);
          await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(false));
          Alert.alert('Permisos Requeridos', 'Para recibir notificaciones, debes permitir el acceso en la configuración de tu dispositivo.');
        }
      } else {
        await cancelAllNotifications();
        Alert.alert('Notificaciones Desactivadas', 'Ya no recibirás mensajes diarios.');
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      // Revertir el estado en caso de error
      setNotificationsEnabled(!value);
      Alert.alert('Error', 'No se pudo cambiar la configuración de notificaciones.');
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
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={false} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.surface }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Perfil</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={[styles.profileSection, { backgroundColor: themeColors.surface }]}>
          <View style={styles.profileImageContainer}>
            <View style={[styles.profileImageBackground, { backgroundColor: themeColors.cardBackground }]}>
              <Image 
                source={require('../../assets/icono-profile.png')} 
                style={styles.profileIcon}
                resizeMode="contain"
              />
            </View>
          </View>
          
          {isEditingName ? (
            <View style={styles.editNameContainer}>
              <TextInput
                style={[styles.nameInput, { 
                  backgroundColor: themeColors.cardBackground,
                  color: themeColors.text,
                  borderColor: themeColors.border
                }]}
                value={tempName}
                onChangeText={setTempName}
                placeholder="Ingresa tu nombre"
                placeholderTextColor={themeColors.textSecondary}
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
              <Text style={[styles.profileName, { color: themeColors.text }]}>{userName}</Text>
              <TouchableOpacity style={[styles.editButton, { backgroundColor: themeColors.cardBackground }]} onPress={handleEditName}>
                <Ionicons name="pencil" size={16} color={themeColors.primary} />
              </TouchableOpacity>
            </View>
          )}
          
          <Text style={[styles.profileSubtitle, { color: themeColors.textSecondary }]}>
            Miembro de InnerShield
          </Text>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <View style={[styles.menuCard, { backgroundColor: themeColors.surface }]}>
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: themeColors.primary + '20' }]}>
                  <Ionicons name="notifications" size={20} color={themeColors.primary} />
                </View>
                <Text style={[styles.menuItemText, { color: themeColors.text }]}>Notificaciones</Text>
              </View>
              <View style={styles.switchContainer}>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleNotificationsToggle}
                  trackColor={{ false: themeColors.border, true: themeColors.primary + '40' }}
                  thumbColor={notificationsEnabled ? themeColors.primary : themeColors.textSecondary}
                />
              </View>
            </View>
            
            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
            
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#FF6B6B20' }]}>
                  <Ionicons name="log-out" size={20} color="#FF6B6B" />
                </View>
                <Text style={[styles.menuItemText, { color: themeColors.text }]}>Cerrar Sesión</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>
            
            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
            
            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#FF334420' }]}>
                  <Ionicons name="trash" size={20} color="#FF3344" />
                </View>
                <Text style={[styles.menuItemText, styles.deleteText]}>Eliminar Cuenta</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileImageContainer: {
    marginBottom: 20,
  },
  profileImageBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  profileIcon: {
    width: 80,
    height: 80,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 10,
  },
  editButton: {
    padding: 8,
    borderRadius: 15,
  },
  profileSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  editNameContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 15,
    width: '80%',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  menuSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  menuCard: {
    borderRadius: 16,
    shadowColor: '#000',
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
    marginRight: 10,
  },
  switchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
    marginTop: -20,
    height: 40,
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
    fontWeight: '500',
  },
  deleteText: {
    color: '#FF3344',
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
  },
  bottomSpacing: {
    height: 30,
  },
});

export default ProfileScreen;