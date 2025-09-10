import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Vibration,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { mindfulnessMessages } from '../data/mindfulnessMessages';

// Background music files
const backgroundMusic = [
  require('../../assets/songs/Dreaming in Slow Motion.mp3'),
  require('../../assets/songs/Dreaming in Slow Motion 2.mp3'),
  require('../../assets/songs/Drift Away.mp3'),
  require('../../assets/songs/Drift Away 2.mp3'),
  require('../../assets/songs/Driftwood Dreams.mp3'),
  require('../../assets/songs/Driftwood Dreams (1).mp3'),
  require('../../assets/songs/Moonlit Drift.mp3'),
  require('../../assets/songs/Moonlit Drift 2.mp3'),
  require('../../assets/songs/Whispered Waves.mp3'),
  require('../../assets/songs/Whispered Waves 2.mp3'),
  require('../../assets/songs/Whispering Tides.mp3'),
  require('../../assets/songs/Whispering Tides 2.mp3'),
];

const BreathingScreen = ({ navigation }) => {
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('prepare');
  const [cycleCount, setCycleCount] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [timer, setTimer] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [maxSessionTime] = useState(120); // 2 minutos máximo
  const [backgroundMusicSound, setBackgroundMusicSound] = useState(null);
  const [currentMusicIndex, setCurrentMusicIndex] = useState(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  
  const breathingAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  const breathingTechniques = [
    {
      id: '478',
      name: '4-7-8 Breathing',
      description: 'Inhale for 4, hold for 7, exhale for 8 seconds',
      icon: 'leaf',
      color: ['#4FC3F7', '#29B6F6'],
      phases: {
        inhale: 4,
        hold: 7,
        exhale: 8
      },
      totalCycle: 19
    },
    {
      id: 'square',
      name: 'Square Breathing',
      description: 'Equal timing: 4-4-4-4 seconds',
      icon: 'square',
      color: ['#81C784', '#66BB6A'],
      phases: {
        inhale: 4,
        hold: 4,
        exhale: 4,
        pause: 4
      },
      totalCycle: 16
    },
    {
      id: 'deep',
      name: 'Deep Abdominal',
      description: 'Slow, deep breathing from the diaphragm',
      icon: 'heart',
      color: ['#FFB74D', '#FFA726'],
      phases: {
        inhale: 6,
        pause: 2,
        exhale: 8
      },
      totalCycle: 16
    }
  ];
  
  const getCurrentTechnique = () => {
    return breathingTechniques.find(t => t.id === selectedTechnique);
  };

  // Función para obtener un índice aleatorio de música diferente al actual
  const getRandomMusicIndex = (currentIndex) => {
    if (backgroundMusic.length <= 1) return 0;
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * backgroundMusic.length);
    } while (randomIndex === currentIndex);
    return randomIndex;
  };

  // Función para reproducir música de fondo
  const playBackgroundMusic = async () => {
    try {
      if (backgroundMusicSound) {
        await backgroundMusicSound.unloadAsync();
      }

      const randomIndex = getRandomMusicIndex(currentMusicIndex);
      setCurrentMusicIndex(randomIndex);
      
      const { sound } = await Audio.Sound.createAsync(
        backgroundMusic[randomIndex],
        {
          shouldPlay: true,
          isLooping: false,
          volume: 0.08, // Volumen más bajo
        }
      );
      
      setBackgroundMusicSound(sound);
      setIsMusicPlaying(true);
      
      // Configurar callback para cuando termine la canción
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish && !status.isLooping) {
          // Reproducir siguiente canción aleatoria
          playBackgroundMusic();
        }
      });
    } catch (error) {
      console.log('Error playing background music:', error);
    }
  };

  // Función para detener música de fondo
  const stopBackgroundMusic = async () => {
    try {
      if (backgroundMusicSound) {
        await backgroundMusicSound.stopAsync();
        await backgroundMusicSound.unloadAsync();
        setBackgroundMusicSound(null);
        setIsMusicPlaying(false);
      }
    } catch (error) {
      console.log('Error stopping background music:', error);
    }
  };
  
  const getPhaseInstruction = () => {
    const technique = getCurrentTechnique();
    if (!technique) return '';
    
    switch (currentPhase) {
      case 'prepare':
        return 'Get ready to breathe';
      case 'inhale':
        return 'Breathe in slowly';
      case 'hold':
        return 'Hold your breath';
      case 'exhale':
        return 'Breathe out gently';
      case 'pause':
        return 'Pause naturally';
      default:
        return 'Breathe naturally';
    }
  };
  
  const getCurrentMessage = () => {
    if (currentPhase === 'prepare') {
      return mindfulnessMessages.preparation[currentMessage % mindfulnessMessages.preparation.length]?.message || 'Prepare yourself';
    }
    
    // Use technique-specific messages
    let messages;
    switch (selectedTechnique) {
      case '478':
        messages = mindfulnessMessages.breathing478;
        break;
      case 'square':
        messages = mindfulnessMessages.breathingSquare;
        break;
      case 'deep':
        messages = mindfulnessMessages.breathingDeep;
        break;
      default:
        messages = mindfulnessMessages.breathing;
    }
    
    return messages[currentMessage % messages.length]?.message || 'Breathe peacefully';
  };
  
  const startBreathingSession = (techniqueId) => {
    setSelectedTechnique(techniqueId);
    setIsActive(true);
    setCurrentPhase('prepare');
    setCycleCount(0);
    setCurrentMessage(0);
    setTimer(0);
    setTotalTime(0);
    // Iniciar música de fondo cuando comience la sesión
    playBackgroundMusic();
  };
  
  const stopBreathingSession = async () => {
    setIsActive(false);
    setSelectedTechnique(null);
    setCurrentPhase('prepare');
    setCycleCount(0);
    setTimer(0);
    setTotalTime(0);
    
    // Limpieza agresiva de audio cuando termine la sesión
    try {
      await stopBackgroundMusic();
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });
      
      for (let i = 0; i < 2; i++) {
        await Audio.setIsEnabledAsync(false);
        await new Promise(resolve => setTimeout(resolve, 200));
        await Audio.setIsEnabledAsync(true);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.log('Error in force stop audio:', error);
    }
  };
  
  // Main breathing logic
  useEffect(() => {
    let interval;
    let totalInterval;
    let messageInterval;
    
    if (isActive && selectedTechnique) {
      const technique = getCurrentTechnique();
      
      // Total time counter
      totalInterval = setInterval(() => {
        setTotalTime(prev => {
          const newTime = prev + 1;
          // Verificar si se alcanzó el tiempo máximo
          if (newTime >= maxSessionTime) {
            setIsActive(false);
            // Limpieza agresiva de audio antes de navegar
                navigation.navigate('BreathingFeedback', {
                  sessionType: 'breathing',
                  duration: newTime,
                  technique: selectedTechnique
                });
          }
          return newTime;
        });
      }, 1000);
      
      // Message rotation (every 10 seconds)
      messageInterval = setInterval(() => {
        setCurrentMessage(prev => prev + 1);
      }, 10000);
      
      // Preparation phase (10 seconds)
      if (currentPhase === 'prepare') {
        setTimer(10); // Start with 10 seconds
        interval = setInterval(() => {
          setTimer(prev => {
            const newTimer = prev - 1;
            if (newTimer <= 0) {
              setCurrentPhase('inhale');
              setTimer(0);
              return 0;
            }
            return newTimer;
          });
        }, 1000);
        
        setTimeout(() => {
          setCurrentPhase('inhale');
          setTimer(0);
        }, 10000);
      } else {
        // Breathing cycle logic
        interval = setInterval(() => {
          setTimer(prev => {
            const newTimer = prev + 1;
            const phases = Object.keys(technique.phases);
            const cycleTimer = newTimer % technique.totalCycle;
            let accumulatedTime = 0;
            let newPhase = phases[0];
            
            // Determine current phase based on cycle timer
            for (let i = 0; i < phases.length; i++) {
              const phaseTime = technique.phases[phases[i]];
              if (cycleTimer < accumulatedTime + phaseTime) {
                newPhase = phases[i];
                break;
              }
              accumulatedTime += phaseTime;
            }
            
            // Handle edge case when cycleTimer equals totalCycle
            if (cycleTimer === 0) {
              newPhase = phases[0];
            }
            
            // Update phase if changed
            if (newPhase !== currentPhase) {
              setCurrentPhase(newPhase);
            }
            
            // Reset cycle when complete
            if (newTimer > 0 && newTimer % technique.totalCycle === 0) {
              setCycleCount(prev => prev + 1);
            }
            
            return newTimer;
          });
        }, 1000);
        
        // Breathing animation
        const animateBreathing = () => {
          if (currentPhase === 'inhale') {
            Animated.timing(breathingAnim, {
              toValue: 1.4,
              duration: technique.phases.inhale * 1000,
              useNativeDriver: true,
            }).start();
          } else if (currentPhase === 'exhale') {
            Animated.timing(breathingAnim, {
              toValue: 1,
              duration: technique.phases.exhale * 1000,
              useNativeDriver: true,
            }).start();
          }
        };
        
        animateBreathing();
      }
    }
    
    return () => {
      if (interval) clearInterval(interval);
      if (totalInterval) clearInterval(totalInterval);
      if (messageInterval) clearInterval(messageInterval);
    };
  }, [isActive, selectedTechnique, currentPhase]);

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      stopBackgroundMusic();
    };
  }, []);


  
  if (isActive && selectedTechnique) {
    const technique = getCurrentTechnique();
    
    return (
      <LinearGradient
        colors={technique.color}
        style={styles.fullScreenContainer}
      >
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={async () => {
                setIsActive(false);
                navigation.navigate('BreathingFeedback', {
                  sessionType: 'breathing',
                  duration: totalTime,
                  technique: selectedTechnique
                });
              }}
            >
              <Ionicons name="close" size={24} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>{technique.name}</Text>
            
            <View style={styles.headerSpacer} />
          </View>
          
          {/* Progress */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Cycle {cycleCount + 1} • {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
            </Text>
          </View>
          
          {/* Main content */}
          <View style={styles.centerContent}>
            <Text style={styles.messageText}>
              {getCurrentMessage()}
            </Text>
            
            <Animated.View
              style={[
                styles.breathingCircle,
                {
                  transform: [{ scale: breathingAnim }]
                }
              ]}
            >
              <Ionicons name={technique.icon} size={60} color="white" />
            </Animated.View>
            
            <Text style={styles.instructionText}>
              {getPhaseInstruction()}
            </Text>
            
            <Text style={styles.timerText}>
              {(() => {
                // During preparation phase, show countdown timer directly
                if (currentPhase === 'prepare') {
                  return timer;
                }
                
                const phases = Object.keys(technique.phases);
                const cycleTimer = timer % technique.totalCycle;
                let accumulatedTime = 0;
                let currentPhaseTime = 0;
                let timeInCurrentPhase = 0;
                
                // Find current phase and calculate remaining time
                for (let i = 0; i < phases.length; i++) {
                  const phaseTime = technique.phases[phases[i]];
                  if (cycleTimer < accumulatedTime + phaseTime) {
                    currentPhaseTime = phaseTime;
                    timeInCurrentPhase = cycleTimer - accumulatedTime;
                    break;
                  }
                  accumulatedTime += phaseTime;
                }
                
                // Handle edge case when cycleTimer equals totalCycle (should show first phase time)
                if (cycleTimer === 0) {
                  currentPhaseTime = technique.phases[phases[0]];
                  timeInCurrentPhase = 0;
                }
                
                const remainingTime = Math.ceil(currentPhaseTime - timeInCurrentPhase);
                return remainingTime > 0 ? remainingTime : currentPhaseTime;
              })()}
            </Text>
          </View>
          
          {/* Controls */}
          <View style={styles.controls}>

          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }
  
  return (
    <LinearGradient
      colors={['#E8EAF6', '#C5CAE9', '#9FA8DA']}
      style={styles.fullScreenContainer}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          
          <Text style={styles.title}>Breathing Techniques</Text>
          
          <View style={styles.headerSpacer} />
        </View>
        
        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>
            Choose a breathing technique to help you relax and find inner calm. Each technique is designed to reduce stress and promote mindfulness.
          </Text>
        </View>
        
        {/* Techniques */}
        <View style={styles.techniquesContainer}>
          {breathingTechniques.map((technique) => (
            <TouchableOpacity
              key={technique.id}
              style={styles.techniqueCard}
              onPress={() => startBreathingSession(technique.id)}
            >
              <LinearGradient
                colors={technique.color}
                style={styles.techniqueGradient}
              >
                <View style={styles.techniqueIcon}>
                  <Ionicons name={technique.icon} size={32} color="white" />
                </View>
                
                <View style={styles.techniqueInfo}>
                  <Text style={styles.techniqueName}>{technique.name}</Text>
                  <Text style={styles.techniqueDescription}>{technique.description}</Text>
                </View>
                
                <Ionicons name="play-circle" size={32} color="rgba(255,255,255,0.8)" />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Tips */}
        <View style={styles.tipsContainer}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={20} color="#7B1FA2" />
            <Text style={styles.tipsTitle}>Tips for Better Breathing</Text>
          </View>
          <Text style={styles.tipsText}>
            • Find a comfortable, quiet space{"\n"}
            • Sit or lie down with your back straight{"\n"}
            • Focus on your breath, not your thoughts{"\n"}
            • Start with shorter sessions and build up
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    
  },
  closeButton: {
    padding: 8,
  },
  headerSpacer: {
    width: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  descriptionContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  description: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '400',
  },
  techniquesContainer: {
    paddingHorizontal: 20,
    marginBottom: 60,
    flex: 1,
  },
  techniqueCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#7B1FA2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  techniqueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },
  techniqueIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  techniqueInfo: {
    flex: 1,
  },
  techniqueName: {
    fontSize: 19,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  techniqueDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
    fontWeight: '400',
  },
  tipsContainer: {
    marginHorizontal: 20,
    marginTop: 60,
    marginBottom: -20,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    shadowColor: '#7B1FA2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(123, 31, 162, 0.1)',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7B1FA2',
    marginLeft: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  // Active session styles
  activeContainer: {
    flex: 1,
  },
  progressContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  messageText: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    marginBottom: 40,
    fontStyle: 'italic',
    lineHeight: 28,
  },
  breathingCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  instructionText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 48,
    color: 'white',
    fontWeight: 'bold',
  },
  controls: {
    alignItems: 'center',
    paddingBottom: 40,
  },

});

export default BreathingScreen;