import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateShieldLevel, updateMoodAverage } from '../utils/statsUtils';

const BreathingFeedbackScreen = ({ navigation, route }) => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedHelpfulness, setSelectedHelpfulness] = useState(null);
  const [scaleValue] = useState(new Animated.Value(0));

  const { sessionType = 'breathing', duration = 0, technique = '' } = route?.params || {};

  React.useEffect(() => {
    // Stop all audio when entering feedback screen
    const stopAllAudio = async () => {
      try {
        // Set audio mode to interrupt any playing audio and disable background playback
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: false,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
        
        // Force stop all sound instances by disabling and re-enabling audio system
        await Audio.setIsEnabledAsync(false);
        await new Promise(resolve => setTimeout(resolve, 300)); // Longer delay to ensure cleanup
        await Audio.setIsEnabledAsync(true);
        
        // Set a more restrictive audio mode to prevent any background audio
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: false,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
        
        // Small delay before resetting to normal mode
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Reset audio mode for normal operation
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.log('Error stopping audio:', error);
      }
    };
    
    // Multiple attempts to ensure all audio stops
    const forceStopAllAudio = async () => {
      try {
        // First attempt - immediate stop
        await stopAllAudio();
        
        // Second attempt after delay
        setTimeout(async () => {
          await stopAllAudio();
        }, 500);
        
        // Third attempt with more aggressive settings
        setTimeout(async () => {
          try {
            await Audio.setAudioModeAsync({
              allowsRecordingIOS: false,
              staysActiveInBackground: false,
              playsInSilentModeIOS: false,
              shouldDuckAndroid: false,
              playThroughEarpieceAndroid: false,
            });
            
            // Multiple disable/enable cycles
            for (let i = 0; i < 3; i++) {
              await Audio.setIsEnabledAsync(false);
              await new Promise(resolve => setTimeout(resolve, 200));
              await Audio.setIsEnabledAsync(true);
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } catch (error) {
            console.log('Error in aggressive audio stop:', error);
          }
        }, 1000);
      } catch (error) {
        console.log('Error in force stop audio:', error);
      }
    };
    
    forceStopAllAudio();
    
    Animated.spring(scaleValue, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const moodOptions = [
    { id: 'much_better', emoji: '😌', label: 'Very Relaxed', color: '#4CAF50', value: 10 },
    { id: 'better', emoji: '🙂', label: 'More Calm', color: '#8BC34A', value: 8 },
    { id: 'same', emoji: '😐', label: 'Same', color: '#FFC107', value: 5 },
    { id: 'worse', emoji: '😔', label: 'More Anxious', color: '#FF9800', value: 3 },
    { id: 'much_worse', emoji: '😰', label: 'Very Anxious', color: '#F44336', value: 1 },
  ];

  const helpfulnessOptions = [
    { id: 'very_helpful', label: 'Very Helpful', stars: 5 },
    { id: 'helpful', label: 'Helpful', stars: 4 },
    { id: 'somewhat', label: 'Somewhat Helpful', stars: 3 },
    { id: 'not_much', label: 'Not Very Helpful', stars: 2 },
    { id: 'not_helpful', label: 'Not Helpful', stars: 1 },
  ];

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    try {
      // 1. Update wellness metrics
      const storedMetrics = await AsyncStorage.getItem('wellnessMetrics');
      let metrics = storedMetrics ? JSON.parse(storedMetrics) : {
          week: { shieldLevel: 0, moodAverage: 0, activeDays: 0, completedExercises: 0, trend: 'stable' },
          month: { shieldLevel: 0, moodAverage: 0, activeDays: 0, completedExercises: 0, trend: 'stable' },
          year: { shieldLevel: 0, moodAverage: 0, activeDays: 0, completedExercises: 0, trend: 'stable' },
      };

      metrics.week.completedExercises += 1;
      metrics.month.completedExercises += 1;
      metrics.year.completedExercises += 1;

      await AsyncStorage.setItem('wellnessMetrics', JSON.stringify(metrics));

      // 2. Update mood data if mood was selected
      if (selectedMood) {
        const selectedMoodOption = moodOptions.find(option => option.id === selectedMood);
        const moodValue = selectedMoodOption ? selectedMoodOption.value : 5;
        
        // Get current day of week
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = days[new Date().getDay()];
        
        // Update mood data for the current day
        const storedMoodData = await AsyncStorage.getItem('moodData');
        let moodData = storedMoodData ? JSON.parse(storedMoodData) : [];
        
        // Find today's entry and update it
        const todayIndex = moodData.findIndex(item => item.day === today);
        if (todayIndex !== -1) {
          moodData[todayIndex].mood = moodValue;
          moodData[todayIndex].color = selectedMoodOption.color;
        }
        
        await AsyncStorage.setItem('moodData', JSON.stringify(moodData));
      }

      // 3. Update achievements
      const storedAchievements = await AsyncStorage.getItem('achievements');
      let achievements = storedAchievements ? JSON.parse(storedAchievements) : [];

      const breathingMaster = achievements.find(a => a.id === 2);
      if (breathingMaster && !breathingMaster.earned) {
          breathingMaster.progress = Math.min(100, breathingMaster.progress + 2); // Each exercise is 2% of 50
          if (breathingMaster.progress >= 100) {
              breathingMaster.earned = true;
              breathingMaster.date = new Date().toISOString().split('T')[0];
          }
      }

      await AsyncStorage.setItem('achievements', JSON.stringify(achievements));

      // 4. Update shield level and mood average
      await updateShieldLevel();
      await updateMoodAverage();

    } catch (error) {
        console.error("Failed to save exercise data", error);
    }
    
    navigation.navigate('Main', { screen: 'Home' });
  };

  const renderStars = (count) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Ionicons
        key={index}
        name={index < count ? 'star' : 'star-outline'}
        size={16}
        color="#FFD700"
        style={{ marginHorizontal: 1 }}
      />
    ));
  };

  const getTechniqueDisplayName = (tech) => {
    switch(tech) {
      case '4-7-8': return '4-7-8 Breathing';
      case 'square': return 'Square Breathing';
      default: return tech;
    }
  };

  return (
    <LinearGradient
      colors={['#E1BEE7', '#CE93D8', '#FFFFFF']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View
            style={[
              styles.content,
              {
                transform: [{ scale: scaleValue }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="leaf" size={60} color="#4CAF50" />
              </View>
              <Text style={styles.title}>Session Completed</Text>
              <Text style={styles.subtitle}>
                You have completed your {getTechniqueDisplayName(technique)} session
              </Text>
              <Text style={styles.duration}>
                Duration: {formatDuration(duration)}
              </Text>
            </View>

            {/* Mood Assessment */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How do you feel now?</Text>
              <Text style={styles.sectionSubtitle}>
                Compared to when you started
              </Text>
              <View style={styles.moodGrid}>
                {moodOptions.map((mood) => (
                  <TouchableOpacity
                    key={mood.id}
                    style={[
                      styles.moodOption,
                      selectedMood === mood.id && {
                        backgroundColor: mood.color,
                        transform: [{ scale: 1.05 }],
                      },
                    ]}
                    onPress={() => setSelectedMood(mood.id)}
                  >
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    <Text
                      style={[
                        styles.moodLabel,
                        selectedMood === mood.id && styles.selectedMoodLabel,
                      ]}
                    >
                      {mood.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Helpfulness Rating */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How helpful was this session?</Text>
              <View style={styles.helpfulnessGrid}>
                {helpfulnessOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.helpfulnessOption,
                      selectedHelpfulness === option.id && styles.selectedHelpfulness,
                    ]}
                    onPress={() => setSelectedHelpfulness(option.id)}
                  >
                    <View style={styles.starsContainer}>
                      {renderStars(option.stars)}
                    </View>
                    <Text
                      style={[
                        styles.helpfulnessLabel,
                        selectedHelpfulness === option.id && styles.selectedHelpfulnessLabel,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Encouragement Message */}
            <View style={styles.encouragementSection}>
              <Text style={styles.encouragementText}>
                "Every mindful breath is a step towards inner calm. You are building resilience with each practice."
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!selectedMood || !selectedHelpfulness) && styles.disabledButton,
                ]}
                onPress={handleSubmit}
                disabled={!selectedMood || !selectedHelpfulness}
              >
                <LinearGradient
                  colors={['#BA68C8', '#AB47BC']}
                  style={styles.submitButtonGradient}
                >
                  <Text style={styles.submitButtonText}>Complete and Continue</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(198, 202, 198, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7B1FA2',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  duration: {
    fontSize: 14,
    color: '#7B1FA2',
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginBottom: 35,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#7B1FA2',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  moodOption: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedMoodLabel: {
    color: 'white',
    fontWeight: '600',
  },
  helpfulnessGrid: {
    gap: 12,
  },
  helpfulnessOption: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedHelpfulness: {
    borderColor: '#B39DDB',
    backgroundColor: '#F3E5F5',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  helpfulnessLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedHelpfulnessLabel: {
    color: '#7B1FA2',
    fontWeight: '600',
  },
  encouragementSection: {
    backgroundColor: 'rgba(186, 104, 200, 0.05)',
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#BA68C8',
  },
  encouragementText: {
    fontSize: 16,
    color: '#7B1FA2',
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  buttonContainer: {
    gap: 12,
    paddingBottom: 20,
  },
  submitButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#BA68C8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.5,
    shadowOpacity: 0.1,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default BreathingFeedbackScreen;