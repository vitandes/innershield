import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const MoreScreen = () => {
  const { colors, isDarkMode, toggleTheme, themeMode } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [dailyReminders, setDailyReminders] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);

  const getThemeModeText = () => {
    switch (themeMode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      default: return 'System';
    }
  };

  const handleUpgrade = () => {
    Alert.alert(
      'Upgrade to Premium',
      'Unlock all premium features:\n\n• Advanced analytics\n• More training exercises\n• Priority support\n• No ads\n\nPrice: $10/month',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Upgrade', 
          onPress: () => Alert.alert('Premium', 'Redirecting to store to complete purchase...') 
        },
      ]
    );
  };

  const handleSupport = () => {
    Alert.alert(
      'Support',
      'How can we help you?',
      [
        { 
          text: 'Live chat', 
          onPress: () => Alert.alert('Chat', 'Connecting with a support agent...') 
        },
        { 
          text: 'Send email', 
          onPress: () => Alert.alert('Email', 'Opening email client to contact support@innershield.com') 
        },
        { 
          text: 'FAQ', 
          onPress: () => Alert.alert('FAQ', 'Opening frequently asked questions section...') 
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const menuSections = [
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          title: 'My Profile',
          subtitle: 'Personal information and preferences',
          icon: 'person-outline',
          action: () => Alert.alert('My Profile', 'Profile settings:\n\n• Name: InnerShield User\n• Email: user@email.com\n• Registration date: January 2024\n• Shield level: 75%'),
        },
        {
          id: 'subscription',
          title: 'Subscription',
          subtitle: 'Current plan and billing',
          icon: 'card-outline',
          action: () => Alert.alert('Subscription', 'Active Premium Plan\n\n• Renewal: Feb 15, 2024\n• Price: $10/month\n• Unlocked features: All\n• Status: Active'),
          badge: 'Premium',
        },
        {
          id: 'emergency-contacts',
          title: 'Emergency Contacts',
          subtitle: 'Trusted people for crisis',
          icon: 'call-outline',
          action: () => Alert.alert('Emergency Contacts', 'Manage your trusted contacts:\n\n• Maria Garcia - Sister\n• Dr. Lopez - Therapist\n• John Perez - Best friend\n\n+ Add new contact'),
        },
      ],
    },
    {
      title: 'Settings',
      items: [
        {
          id: 'notifications',
          title: 'Notifications',
          subtitle: 'Reminders and alerts',
          icon: 'notifications-outline',
          toggle: true,
          value: notifications,
          onToggle: setNotifications,
        },
        {
          id: 'daily-reminders',
          title: 'Daily Reminders',
          subtitle: 'Check-ins and exercises',
          icon: 'alarm-outline',
          toggle: true,
          value: dailyReminders,
          onToggle: setDailyReminders,
        },
        {
          id: 'dark-mode',
          title: 'Dark Mode',
          subtitle: `Theme: ${getThemeModeText()}`,
          icon: 'moon-outline',
          toggle: true,
          value: isDarkMode,
          onToggle: toggleTheme,
        },
        {
          id: 'privacy',
          title: 'Privacy and Data',
          subtitle: 'Personal information control',
          icon: 'shield-checkmark-outline',
          action: () => Alert.alert('Privacy and Data', 'Privacy settings:\n\n• Encrypted data: ✓\n• Share with third parties: ✗\n• Anonymous analytics: ✓\n• Cloud backup: ✓'),
        },
      ],
    },
    {
      title: 'Resources',
      items: [
        {
          id: 'library',
          title: 'Resource Library',
          subtitle: 'Articles, videos and guides',
          icon: 'library-outline',
          action: () => Alert.alert('Resource Library', 'Explore our resources:\n\n📚 Mental wellness articles\n🎥 Relaxation technique videos\n📖 Self-help guides\n🎧 Guided meditations\n\nFull access with Premium'),
        },
        {
          id: 'crisis-resources',
          title: 'Crisis Resources',
          subtitle: 'Help lines and services',
          icon: 'medical-outline',
          action: () => Alert.alert('Crisis Resources', '24/7 help lines available:\n\n🆘 National Lifeline: 988\n🚑 Emergency: 911\n💬 Crisis Chat: crisis-chat.org\n📞 Prevention Lifeline: 1-800-273-8255\n\nYou are not alone!'),
        },
        {
          id: 'therapist-finder',
          title: 'Find Therapist',
          subtitle: 'Professionals in your area',
          icon: 'search-outline',
          action: () => Alert.alert('Find Therapist', 'Connect with professionals:\n\n🔍 Search by location\n💼 Available specialties\n💰 Price filters\n⭐ Patient reviews\n📅 Available appointments'),
        },
        {
          id: 'community',
          title: 'Community',
          subtitle: 'Connect with other users',
          icon: 'people-outline',
          action: () => Alert.alert('InnerShield Community', 'Join our community:\n\n👥 Support groups\n💬 Discussion forums\n📝 Success stories\n🎯 Group challenges\n🤝 Volunteer mentors'),
          badge: 'New',
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help Center',
          subtitle: 'FAQ and tutorials',
          icon: 'help-circle-outline',
          action: () => Alert.alert('Help Center', 'Find answers:\n\n❓ Frequently asked questions\n📱 App tutorials\n🛠️ Troubleshooting\n📊 Feature guides\n🎥 Explanatory videos'),
        },
        {
          id: 'contact',
          title: 'Contact Support',
          subtitle: 'Chat, email or phone',
          icon: 'chatbubble-outline',
          action: handleSupport,
        },
        {
          id: 'feedback',
          title: 'Send Feedback',
          subtitle: 'Help us improve the app',
          icon: 'star-outline',
          action: () => Alert.alert('Send Feedback', 'Your opinion matters:\n\n⭐ Rate the app\n💡 Suggest improvements\n🐛 Report bugs\n📝 Share experience\n\nThank you for helping us improve!'),
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        {
          id: 'terms',
          title: 'Terms of Service',
          subtitle: 'Conditions of use',
          icon: 'document-text-outline',
          action: () => Alert.alert('Terms of Service', 'InnerShield usage conditions:\n\n📋 Terms acceptance\n🔒 Responsible app usage\n⚖️ Liability limitations\n🔄 Terms updates\n\nLast updated: January 2024'),
        },
        {
          id: 'privacy-policy',
          title: 'Privacy Policy',
          subtitle: 'How we handle your data',
          icon: 'lock-closed-outline',
          action: () => Alert.alert('Privacy Policy', 'Protection of your data:\n\n🔐 End-to-end encryption\n📊 Anonymous data for improvements\n🚫 We don\'t sell personal information\n🗑️ Right to be forgotten\n📧 Contact: privacy@innershield.com'),
        },
        {
          id: 'about',
          title: 'About InnerShield',
          subtitle: 'Version 1.0.0',
          icon: 'information-circle-outline',
          action: () => Alert.alert('About InnerShield', 'Your mental wellness companion\n\n📱 Version: 1.0.0\n👥 Developed by: InnerShield Team\n🎯 Mission: Strengthen mental health\n🌟 Active users: 50,000+\n💚 Made with love and science'),
        },
      ],
    },
  ];

  const renderMenuItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={item.action}
      disabled={item.toggle}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuItemIcon}>
          <Ionicons name={item.icon} size={24} color="#666" />
        </View>
        <View style={styles.menuItemContent}>
          <View style={styles.menuItemHeader}>
            <Text style={styles.menuItemTitle}>{item.title}</Text>
            {item.badge && (
              <View style={[
                styles.badge,
                item.badge === 'Premium' && styles.premiumBadge,
                item.badge === 'Nuevo' && styles.newBadge,
              ]}>
                <Text style={[
                  styles.badgeText,
                  item.badge === 'Premium' && styles.premiumBadgeText,
                  item.badge === 'Nuevo' && styles.newBadgeText,
                ]}>
                  {item.badge}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
      <View style={styles.menuItemRight}>
        {item.toggle ? (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
            thumbColor={item.value ? '#FFFFFF' : '#FFFFFF'}
          />
        ) : (
          <Ionicons name="chevron-forward" size={20} color="#999" />
        )}
      </View>
    </TouchableOpacity>
  );

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>More Options</Text>
          <Text style={styles.headerSubtitle}>
            Customize your experience and access additional resources
          </Text>
        </View>

        {/* Premium Upgrade Card */}
        <TouchableOpacity style={styles.upgradeCard} onPress={handleUpgrade}>
          <View style={styles.upgradeContent}>
            <View style={styles.upgradeIcon}>
              <Ionicons name="diamond" size={24} color="#FFD700" />
            </View>
            <View style={styles.upgradeInfo}>
              <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
              <Text style={styles.upgradeSubtitle}>
                Unlock all features for $10/month
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </View>
        </TouchableOpacity>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuContainer}>
              {section.items.map((item, itemIndex) => (
                <View key={item.id}>
                  {renderMenuItem(item)}
                  {itemIndex < section.items.length - 1 && (
                    <View style={styles.menuItemSeparator} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>InnerShield v1.0.0</Text>
          <Text style={styles.versionSubtext}>Tu escudo mental personal</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  headerSection: {
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  upgradeCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#FFE082',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  upgradeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF3C4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  upgradeInfo: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F57F17',
    marginBottom: 2,
  },
  upgradeSubtitle: {
    fontSize: 14,
    color: '#F9A825',
  },
  menuSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
    marginLeft: 5,
  },
  menuContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  menuItemRight: {
    marginLeft: 10,
  },
  menuItemSeparator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 70,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
  },
  newBadge: {
    backgroundColor: '#4CAF50',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  premiumBadgeText: {
    color: '#F57F17',
  },
  newBadgeText: {
    color: 'white',
  },
  versionSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  versionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  versionSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default MoreScreen;