import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateShieldLevel } from '../utils/statsUtils';

const SleepMelodiesScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [playingSound, setPlayingSound] = useState(null);
  const [sound, setSound] = useState(null);

  // Cleanup de audio cuando se desmonte el componente
  useEffect(() => {
    return () => {
      if (sound) {
        sound.stopAsync().catch(() => {});
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [sound]);

  const sleepSounds = [
    {
      id: 1,
      title: 'Gentle Rain',
      subtitle: 'Soft rainfall sounds',
      icon: 'rainy',
      color: ['#4FC3F7', '#29B6F6'],
      duration: '30 min'
    },
    {
      id: 2,
      title: 'Ocean Waves',
      subtitle: 'Peaceful beach sounds',
      icon: 'water',
      color: ['#26C6DA', '#00BCD4'],
      duration: '45 min'
    },
    {
      id: 3,
      title: 'Forest Sounds',
      subtitle: 'Birds and nature',
      icon: 'leaf',
      color: ['#66BB6A', '#4CAF50'],
      duration: '60 min'
    },
    {
      id: 4,
      title: 'White Noise',
      subtitle: 'Consistent background',
      icon: 'radio',
      color: ['#BDBDBD', '#9E9E9E'],
      duration: '∞'
    },
    {
      id: 5,
      title: 'Piano Melodies',
      subtitle: 'Soft instrumental',
      icon: 'musical-notes',
      color: ['#BA68C8', '#9C27B0'],
      duration: '40 min'
    },
    {
      id: 6,
      title: 'Thunderstorm',
      subtitle: 'Distant thunder',
      icon: 'thunderstorm',
      color: ['#5C6BC0', '#3F51B5'],
      duration: '35 min'
    },
    {
      id: 7,
      title: 'Fireplace',
      subtitle: 'Crackling fire',
      icon: 'flame',
      color: ['#FF8A65', '#FF5722'],
      duration: '50 min'
    },
    {
      id: 8,
      title: 'Night Crickets',
      subtitle: 'Peaceful evening',
      icon: 'moon',
      color: ['#7986CB', '#3F51B5'],
      duration: '25 min'
    }
  ];

  // Mapeo de archivos de audio de sleep
  const sleepAudioMap = {
    1: require('../../assets/sleep/rain.mp3'), // Gentle Rain
    2: require('../../assets/sleep/waves.mp3'), // Ocean Waves
    3: require('../../assets/sleep/forest.mp3'), // Forest Sounds
    4: require('../../assets/sleep/whitenoise.mp3'), // White Noise
    5: require('../../assets/sleep/piano.mp3'), // Piano Melodies
    6: require('../../assets/sleep/thunder.mp3'), // Thunderstorm
    7: require('../../assets/sleep/fire.mp3'), // Fireplace
    8: require('../../assets/sleep/crickets.mp3'), // Night Crickets
  };

  // Función para reproducir sonidos de sleep
  const playSound = async (soundId) => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      // Detener sonido anterior si existe
      if (sound) {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (cleanupError) {
          console.log('Error cleaning up previous sound:', cleanupError);
        }
        setSound(null);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (Platform.OS === 'web') {
        console.log('Audio playback disabled for web platform');
        return;
      }
      
      const audioSource = sleepAudioMap[soundId];
      if (!audioSource) {
        console.log('Audio file not found for sound ID:', soundId);
        return;
      }
      
      // Crear y reproducir el sonido
      const { sound: newSound } = await Audio.Sound.createAsync(
        audioSource,
        { 
          shouldPlay: true, 
          isLooping: true, 
          volume: 0.7,
          rate: 1.0,
          shouldCorrectPitch: true
        }
      );
      
      setSound(newSound);
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  const handlePlaySound = async (soundItem) => {
    if (playingSound === soundItem.id) {
      // Stop current sound
      if (sound) {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (error) {
          console.log('Error stopping sound:', error);
        }
        setSound(null);
      }
      setPlayingSound(null);
      Alert.alert('Stopped', `${soundItem.title} has been stopped.`);
    } else {
      // Play new sound
      setPlayingSound(soundItem.id);
      
      // Reproducir el audio real
      await playSound(soundItem.id);
      
      try {
        // Registrar el uso de melodías para dormir para el nivel de escudo
        const storedMetrics = await AsyncStorage.getItem('wellnessMetrics');
        let metrics = storedMetrics ? JSON.parse(storedMetrics) : {
          week: { shieldLevel: 0, moodAverage: 0, activeDays: 0, completedExercises: 0, trend: 'stable' },
          month: { shieldLevel: 0, moodAverage: 0, activeDays: 0, completedExercises: 0, trend: 'stable' },
          year: { shieldLevel: 0, moodAverage: 0, activeDays: 0, completedExercises: 0, trend: 'stable' },
        };
        
        // Actualizar nivel de escudo
        await updateShieldLevel();
        
      } catch (error) {
        console.error('Error updating shield level:', error);
      }
      
      Alert.alert(
        'Now Playing',
        `${soundItem.title} is now playing.\n\nDuration: ${soundItem.duration}\n\nTip: Find a comfortable position and let the sounds guide you to peaceful sleep.`,
        [
          { text: 'Stop', onPress: async () => {
            if (sound) {
              try {
                await sound.stopAsync();
                await sound.unloadAsync();
              } catch (error) {
                console.log('Error stopping sound:', error);
              }
              setSound(null);
            }
            setPlayingSound(null);
          }},
          { text: 'Continue', style: 'default' }
        ]
      );
    }
  };

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Sleep Melodies</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Description */}
      <View style={styles.descriptionSection}>
        <LinearGradient colors={['#E8EAF6', '#C5CAE9']} style={styles.descriptionCard}>
          <Ionicons name="moon" size={32} color="#3F51B5" />
          <Text style={styles.descriptionTitle}>Peaceful Sleep</Text>
          <Text style={styles.descriptionText}>
            Choose from our collection of calming sounds to help you relax and drift into peaceful sleep.
          </Text>
        </LinearGradient>
      </View>

      {/* Sound Categories */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose Your Sound</Text>
        
        <View style={styles.soundsGrid}>
          {sleepSounds.map((sound) => (
            <TouchableOpacity
              key={sound.id}
              style={styles.soundCard}
              onPress={() => handlePlaySound(sound)}
            >
              <LinearGradient colors={sound.color} style={styles.soundGradient}>
                <View style={styles.soundHeader}>
                  <Ionicons name={sound.icon} size={28} color="white" />
                  <View style={styles.playIndicator}>
                    {playingSound === sound.id ? (
                      <Ionicons name="pause" size={16} color="white" />
                    ) : (
                      <Ionicons name="play" size={16} color="white" />
                    )}
                  </View>
                </View>
                <Text style={styles.soundTitle}>{sound.title}</Text>
                <Text style={styles.soundSubtitle}>{sound.subtitle}</Text>
                <Text style={styles.soundDuration}>{sound.duration}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sleep Tips</Text>
          <View style={styles.tipCard}>
            <Ionicons name="bulb-outline" size={24} color="#FF9800" />
            <Text style={styles.tipText}>
              • Use headphones for the best experience{"\n"}
              • Set a comfortable volume level{"\n"}
              • Create a dark, cool environment{"\n"}
              • Try different sounds to find your favorite
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors) => StyleSheet.create({
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
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 34,
  },
  descriptionSection: {
    padding: 20,
  },
  descriptionCard: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3F51B5',
    marginTop: 10,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#5C6BC0',
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  soundsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  soundCard: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  soundGradient: {
    padding: 15,
    borderRadius: 15,
    minHeight: 120,
  },
  soundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  playIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 4,
  },
  soundTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  soundSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  soundDuration: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  tipsSection: {
    marginTop: 30,
  },
  tipCard: {
    backgroundColor: '#FFF3E0',
    padding: 20,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
    marginLeft: 15,
    lineHeight: 22,
  },
});

export default SleepMelodiesScreen;