import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Animated,
  Easing,
  Dimensions,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { dailyMessages } from '../data/dailyMessages';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { colors } = useTheme();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Logic State
  const [dailyMessage, setDailyMessage] = useState('');
  const [dailyMissions, setDailyMissions] = useState([
    { id: 1, title: 'Breathing', completed: false, icon: 'leaf-outline' },
    { id: 2, title: 'Journal', completed: false, icon: 'book-outline' },
    { id: 3, title: 'Sleep', completed: false, icon: 'moon-outline' }
  ]);

  // --- Effects ---

  // Entry Animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // SOS Pulse Animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Logic: Track Active Day
  useEffect(() => {
    const trackActiveDay = async () => {
      try {
        const lastActiveDay = await AsyncStorage.getItem('lastActiveDay');
        const today = new Date().toISOString().split('T')[0];

        if (lastActiveDay !== today) {
          const storedMetrics = await AsyncStorage.getItem('wellnessMetrics');
          let metrics = storedMetrics ? JSON.parse(storedMetrics) : {
            week: { shieldLevel: 0, moodAverage: 0, activeDays: 0, completedExercises: 0, trend: 'stable' },
            month: { shieldLevel: 0, moodAverage: 0, activeDays: 0, completedExercises: 0, trend: 'stable' },
            year: { shieldLevel: 0, moodAverage: 0, activeDays: 0, completedExercises: 0, trend: 'stable' },
          };

          metrics.week.activeDays += 1;
          metrics.month.activeDays += 1;
          metrics.year.activeDays += 1;

          await AsyncStorage.setItem('wellnessMetrics', JSON.stringify(metrics));
          await AsyncStorage.setItem('lastActiveDay', today);
        }
      } catch (error) {
        console.error("Failed to track active day:", error);
      }
    };
    trackActiveDay();
  }, []);

  // Logic: Daily Message
  useEffect(() => {
    const updateDailyMessage = async () => {
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
          setDailyMessage(selectedMessage);
        } else {
          if (usedIndices.length > 0) {
            const lastUsedIndex = usedIndices[usedIndices.length - 1];
            setDailyMessage(dailyMessages[lastUsedIndex]);
          } else {
            const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
            setDailyMessage(dailyMessages[dayOfYear % dailyMessages.length]);
          }
        }
      } catch (error) {
        console.error("Failed to load daily message:", error);
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        setDailyMessage(dailyMessages[dayOfYear % dailyMessages.length]);
      }
    };

    updateDailyMessage();
    const interval = setInterval(updateDailyMessage, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Logic: Load Missions
  useFocusEffect(
    useCallback(() => {
      const loadDailyMissions = async () => {
        try {
          const today = new Date().toISOString().split('T')[0];
          const lastMissionDate = await AsyncStorage.getItem('lastMissionDate');

          const defaultMissions = [
            { id: 1, title: 'Breathing', completed: false, icon: 'leaf-outline' },
            { id: 2, title: 'Journal', completed: false, icon: 'book-outline' },
            { id: 3, title: 'Sleep', completed: false, icon: 'moon-outline' }
          ];

          if (!lastMissionDate || lastMissionDate !== today) {
            await AsyncStorage.setItem('dailyMissions', JSON.stringify(defaultMissions));
            await AsyncStorage.setItem('lastMissionDate', today);
            setDailyMissions(defaultMissions);
          } else {
            const storedMissions = await AsyncStorage.getItem('dailyMissions');
            if (storedMissions) {
              setDailyMissions(JSON.parse(storedMissions));
            } else {
              await AsyncStorage.setItem('dailyMissions', JSON.stringify(defaultMissions));
              setDailyMissions(defaultMissions);
            }
          }
        } catch (error) {
          console.error('Error loading daily missions:', error);
        }
      };
      loadDailyMissions();
    }, [])
  );

  // Logic: Toggle Mission
  const toggleMission = async (missionId) => {
    const updatedMissions = dailyMissions.map(mission =>
      mission.id === missionId
        ? { ...mission, completed: !mission.completed }
        : mission
    );

    setDailyMissions(updatedMissions);

    try {
      await AsyncStorage.setItem('dailyMissions', JSON.stringify(updatedMissions));

      // Update mood data logic (simplified for brevity, keeping core logic)
      const completedCount = updatedMissions.filter(mission => mission.completed).length;
      const storedMoodData = await AsyncStorage.getItem('moodData');
      if (storedMoodData) {
        const moodData = JSON.parse(storedMoodData);
        const today = new Date().getDay();
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const currentDay = dayNames[today];

        const updatedMoodData = moodData.map(item => {
          if (item.day === currentDay) {
            let color = '#E0E0E0';
            if (completedCount === 3) color = '#4CAF50';
            else if (completedCount === 2) color = '#FFC107';
            else if (completedCount === 1 || completedCount === 0) color = '#F44336';
            return { ...item, color, completedMissions: completedCount };
          }
          return item;
        });
        await AsyncStorage.setItem('moodData', JSON.stringify(updatedMoodData));
      }
    } catch (error) {
      console.error('Error updating missions:', error);
    }

    // Navigation
    const mission = dailyMissions.find(m => m.id === missionId);
    if (mission && !mission.completed) {
      switch (missionId) {
        case 1: navigation.navigate('Breathing'); break;
        case 2: navigation.navigate('Journal'); break;
        case 3: navigation.navigate('SleepMelodies'); break;
      }
    }
  };

  const handleSOSPress = () => navigation.navigate('SOS');
  const handleBreathingGuided = () => navigation.navigate('Breathing');
  const handleMyRecord = () => navigation.navigate('Journal');
  const handleSleepSounds = () => navigation.navigate('SleepMelodies');

  const completedMissions = dailyMissions.filter(mission => mission.completed).length;
  const totalMissions = dailyMissions.length;
  const progressPercentage = Math.round((completedMissions / totalMissions) * 100);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#F3E5F5', '#E3F2FD', '#FCE4EC']} // Soft Purple, Blue, Pink
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View>
              <Text style={styles.greeting}>Hello! 👋</Text>
              <Text style={styles.subGreeting}>Your calm space is here.</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              style={styles.profileButton}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F5F5F5']}
                style={styles.profileGradient}
              >
                <Ionicons name="person" size={24} color="#5C6BC0" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* SOS Button */}
          <View style={styles.sosContainer}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleSOSPress}
                style={styles.sosButtonWrapper}
              >
                <LinearGradient
                  colors={['#FF5252', '#D32F2F']}
                  style={styles.sosButton}
                  start={{ x: 0.3, y: 0 }}
                  end={{ x: 0.8, y: 1 }}
                >
                  <View style={styles.sosInnerGlow} />
                  <Ionicons name="warning" size={48} color="white" />
                  <Text style={styles.sosText}>SOS</Text>
                  <Text style={styles.sosSubText}>Panic Support</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Daily Missions */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Daily Missions</Text>
              <View style={styles.miniProgress}>
                <Text style={styles.miniProgressText}>{progressPercentage}%</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.missionsScroll}
            >
              {dailyMissions.map((mission) => (
                <TouchableOpacity
                  key={mission.id}
                  style={[styles.missionCard, mission.completed && styles.missionCardCompleted]}
                  onPress={() => toggleMission(mission.id)}
                >
                  <LinearGradient
                    colors={mission.completed ? ['#E8F5E9', '#C8E6C9'] : ['#FFFFFF', '#F8F9FA']}
                    style={styles.missionGradient}
                  >
                    <View style={[styles.missionIconContainer, mission.completed && styles.missionIconCompleted]}>
                      <Ionicons
                        name={mission.completed ? 'checkmark' : mission.icon}
                        size={22}
                        color={mission.completed ? '#FFFFFF' : '#7E57C2'}
                      />
                    </View>
                    <Text style={[styles.missionTitle, mission.completed && styles.missionTitleCompleted]}>
                      {mission.title}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Start Here */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Start Here</Text>
            <View style={styles.gridContainer}>
              {/* Breathe */}
              <TouchableOpacity style={styles.gridItem} onPress={handleBreathingGuided}>
                <LinearGradient colors={['#E3F2FD', '#BBDEFB']} style={styles.gridGradient}>
                  <View style={styles.gridIconBadge}>
                    <Ionicons name="leaf" size={24} color="#1976D2" />
                  </View>
                  <Text style={styles.gridTitle}>Breathe</Text>
                  <Text style={styles.gridSubtitle}>Calm down</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Journal */}
              <TouchableOpacity style={styles.gridItem} onPress={handleMyRecord}>
                <LinearGradient colors={['#F3E5F5', '#E1BEE7']} style={styles.gridGradient}>
                  <View style={[styles.gridIconBadge, { backgroundColor: 'rgba(123, 31, 162, 0.1)' }]}>
                    <Ionicons name="book" size={24} color="#7B1FA2" />
                  </View>
                  <Text style={styles.gridTitle}>Journal</Text>
                  <Text style={styles.gridSubtitle}>Express yourself</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Sleep */}
              <TouchableOpacity style={[styles.gridItem, styles.gridItemFull]} onPress={handleSleepSounds}>
                <LinearGradient colors={['#E8EAF6', '#C5CAE9']} style={styles.gridGradientHorizontal}>
                  <View style={[styles.gridIconBadge, { backgroundColor: 'rgba(48, 63, 159, 0.1)' }]}>
                    <Ionicons name="moon" size={24} color="#303F9F" />
                  </View>
                  <View style={styles.gridTextContainer}>
                    <Text style={styles.gridTitle}>Sleep Melodies</Text>
                    <Text style={styles.gridSubtitle}>Drift off to sleep</Text>
                  </View>
                  <Ionicons name="play-circle-outline" size={32} color="#303F9F" style={{ opacity: 0.6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Daily Message */}
          <View style={styles.messageContainer}>
            <LinearGradient colors={['#FFF', '#FFF']} style={styles.messageCard}>
              <View style={styles.quoteIcon}>
                <Ionicons name="heart" size={20} color="#EC407A" />
              </View>
              <Text style={styles.messageText}>"{dailyMessage}"</Text>
            </LinearGradient>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: Platform.OS === 'android' ? 10 : 0,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '800',
    color: '#263238',
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 16,
    color: '#78909C',
    marginTop: 4,
    fontWeight: '500',
  },
  profileButton: {
    shadowColor: "#5C6BC0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  profileGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
  },

  // SOS Button
  sosContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  sosButtonWrapper: {
    shadowColor: "#FF5252",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  sosButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  sosInnerGlow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sosText: {
    fontSize: 36,
    fontWeight: '900',
    color: 'white',
    marginTop: 5,
    letterSpacing: 1,
  },
  sosSubText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginTop: 2,
  },

  // Sections
  sectionContainer: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#37474F',
  },
  miniProgress: {
    backgroundColor: '#E1BEE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  miniProgressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7B1FA2',
  },

  // Missions
  missionsScroll: {
    paddingRight: 20,
  },
  missionCard: {
    width: 110,
    height: 130,
    marginRight: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  missionCardCompleted: {
    shadowOpacity: 0,
    elevation: 0,
  },
  missionGradient: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  missionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  missionIconCompleted: {
    backgroundColor: '#4CAF50',
  },
  missionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#546E7A',
    textAlign: 'center',
  },
  missionTitleCompleted: {
    color: '#2E7D32',
    textDecorationLine: 'line-through',
  },

  // Start Here Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: (width - 48 - 16) / 2, // (Screen width - padding - gap) / 2
    height: 140,
    marginBottom: 16,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  gridItemFull: {
    width: '100%',
    height: 100,
  },
  gridGradient: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  gridGradientHorizontal: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gridIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  gridTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#37474F',
    marginBottom: 4,
  },
  gridSubtitle: {
    fontSize: 13,
    color: '#78909C',
  },

  // Message
  messageContainer: {
    marginBottom: 20,
  },
  messageCard: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#EC407A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  quoteIcon: {
    marginRight: 16,
    backgroundColor: '#FCE4EC',
    padding: 8,
    borderRadius: 20,
  },
  messageText: {
    flex: 1,
    fontSize: 15,
    fontStyle: 'italic',
    color: '#546E7A',
    lineHeight: 22,
  },
});

export default HomeScreen;