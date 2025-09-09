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

const BreathingFeedbackScreen = ({ navigation, route }) => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedHelpfulness, setSelectedHelpfulness] = useState(null);
  const [scaleValue] = useState(new Animated.Value(0));

  const { sessionType = 'breathing', duration = 0, technique = '' } = route?.params || {};

  React.useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  const moodOptions = [
    { id: 'much_better', emoji: '😌', label: 'Muy Relajado', color: '#4CAF50' },
    { id: 'better', emoji: '🙂', label: 'Más Calmado', color: '#8BC34A' },
    { id: 'same', emoji: '😐', label: 'Igual', color: '#FFC107' },
    { id: 'worse', emoji: '😔', label: 'Más Ansioso', color: '#FF9800' },
    { id: 'much_worse', emoji: '😰', label: 'Muy Ansioso', color: '#F44336' },
  ];

  const helpfulnessOptions = [
    { id: 'very_helpful', label: 'Muy Útil', stars: 5 },
    { id: 'helpful', label: 'Útil', stars: 4 },
    { id: 'somewhat', label: 'Algo Útil', stars: 3 },
    { id: 'not_much', label: 'Poco Útil', stars: 2 },
    { id: 'not_helpful', label: 'No Útil', stars: 1 },
  ];

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    // Aquí podrías guardar el feedback en analytics o storage
    console.log('Feedback de respiración enviado:', {
      mood: selectedMood,
      helpfulness: selectedHelpfulness,
      sessionType,
      duration,
      technique,
    });
    
    navigation.navigate('MainTabs', { screen: 'Home' });
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
      case '4-7-8': return 'Respiración 4-7-8';
      case 'square': return 'Respiración Cuadrada';
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
              <Text style={styles.title}>Sesión Completada</Text>
              <Text style={styles.subtitle}>
                Has completado tu sesión de {getTechniqueDisplayName(technique)}
              </Text>
              <Text style={styles.duration}>
                Duración: {formatDuration(duration)}
              </Text>
            </View>

            {/* Mood Assessment */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>¿Cómo te sientes ahora?</Text>
              <Text style={styles.sectionSubtitle}>
                Comparado con cuando empezaste
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
              <Text style={styles.sectionTitle}>¿Qué tan útil fue esta sesión?</Text>
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
                "Cada respiración consciente es un paso hacia la calma interior. Estás construyendo resiliencia con cada práctica."
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
                  <Text style={styles.submitButtonText}>Completar y Continuar</Text>
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