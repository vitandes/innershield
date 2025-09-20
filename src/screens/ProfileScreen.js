import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, TextInput, Image, StatusBar, ScrollView, Dimensions, SafeAreaView, Linking } from 'react-native';
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

// Function to schedule next day notification
const scheduleNextDayNotification = async () => {
  try {
    // Check if we're on a platform that supports notifications
    if (typeof window !== 'undefined') {
      // We're on web, notifications are not available
      console.log('Notifications not available on web platform');
      return;
    }
    
    // Cancel existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Get tomorrow's message
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    
    // Schedule notification for tomorrow at 8 AM
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
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState('undetermined');
  const [userName, setUserName] = useState('User');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    const initializeProfile = async () => {
      try {
        // Check current notification permissions
        const { status } = await Notifications.getPermissionsAsync();
        setNotificationPermissionStatus(status);
        
        // Load user name
        const savedUserName = await AsyncStorage.getItem('userName');
        if (savedUserName !== null) {
          setUserName(savedUserName);
        }
        
        // Load notification state from AsyncStorage
        const savedNotificationState = await AsyncStorage.getItem('notificationsEnabled');
        if (savedNotificationState !== null) {
          const isEnabled = JSON.parse(savedNotificationState);
          setNotificationsEnabled(isEnabled && status === 'granted');
          
          // If notifications are enabled and permissions granted, ensure there's a scheduled notification
          if (isEnabled && status === 'granted') {
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

  const handleNotificationAuthorization = async () => {
    try {
      const { status: currentStatus } = await Notifications.getPermissionsAsync();
      
      if (currentStatus === 'granted') {
        // If already granted, toggle the notification state
        const newState = !notificationsEnabled;
        setNotificationsEnabled(newState);
        await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(newState));
        
        if (newState) {
          await scheduleNextDayNotification();
          Alert.alert('Notifications Enabled', 'You will receive daily messages at 8:00 AM.');
        } else {
          await cancelAllNotifications();
          Alert.alert('Notifications Disabled', 'You will no longer receive daily messages.');
        }
      } else if (currentStatus === 'denied') {
        // If denied, show alert to go to settings
        Alert.alert(
          'Notifications Disabled',
          'To receive daily messages, please enable notifications in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => Linking.openSettings()
            }
          ]
        );
      } else {
        // If undetermined, request permissions
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        setNotificationPermissionStatus(newStatus);
        
        if (newStatus === 'granted') {
          setNotificationsEnabled(true);
          await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(true));
          await scheduleNextDayNotification();
          Alert.alert('Notifications Enabled', 'You will receive daily messages at 8:00 AM.');
        } else {
          Alert.alert(
            'Permission Required',
            'To receive notifications, you need to allow access in your device settings.'
          );
        }
      }
    } catch (error) {
      console.error('Error handling notification authorization:', error);
      Alert.alert('Error', 'Could not change notification settings.');
    }
  };

  const getNotificationButtonText = () => {
    if (notificationPermissionStatus === 'granted') {
      return notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications';
    } else if (notificationPermissionStatus === 'denied') {
      return 'Open Settings';
    } else {
      return 'Allow Notifications';
    }
  };

  const getNotificationButtonColor = () => {
    if (notificationPermissionStatus === 'granted' && notificationsEnabled) {
      return '#FF6B6B'; // Red for disable
    } else if (notificationPermissionStatus === 'denied') {
      return '#FFA726'; // Orange for settings
    } else {
      return themeColors.primary; // Primary color for enable/allow
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', onPress: signOut }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteAccount }
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
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Profile</Text>
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
                placeholder="Enter your name"
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
            InnerShield Member
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
                <View style={styles.notificationTextContainer}>
                  <Text style={[styles.menuItemText, { color: themeColors.text }]} numberOfLines={1}>
                    Notifications
                  </Text>
                  <Text style={[styles.notificationSubtext, { color: themeColors.textSecondary }]} numberOfLines={1}>
                    {notificationPermissionStatus === 'granted' && notificationsEnabled 
                      ? 'Daily at 8:00 AM' 
                      : notificationPermissionStatus === 'denied'
                      ? 'Disabled in Settings'
                      : 'Not Authorized'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.notificationButton, { backgroundColor: getNotificationButtonColor() }]}
                onPress={handleNotificationAuthorization}
              >
                <Text style={styles.notificationButtonText}>
                  {getNotificationButtonText()}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
            
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#FF6B6B20' }]}>
                  <Ionicons name="log-out" size={20} color="#FF6B6B" />
                </View>
                <Text style={[styles.menuItemText, { color: themeColors.text }]}>Sign Out</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>
            
            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
            
            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#FF334420' }]}>
                  <Ionicons name="trash" size={20} color="#FF3344" />
                </View>
                <Text style={[styles.menuItemText, styles.deleteText]}>Delete Account</Text>
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
  notificationTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  notificationSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  notificationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  notificationButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
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