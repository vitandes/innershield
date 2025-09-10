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
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { mindfulnessMessages } from '../data/mindfulnessMessages';

const SOSScreen = ({ navigation }) => {
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('preparation'); // 'preparation', 'inhale', 'hold', 'exhale', 'reflection'
  const [breathingCount, setBreathingCount] = useState(0);
  const [sessionPhase, setSessionPhase] = useState(0); // 0: preparation, 1: breathing, 2: reflection
  const [currentMessage, setCurrentMessage] = useState(0);
  const [sound, setSound] = useState(null);
  const [backgroundMusic, setBackgroundMusic] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [totalSessionTime, setTotalSessionTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lastPlayedSound, setLastPlayedSound] = useState(null);
  const preparationMessageCountRef = useRef(0);
  const preparationPhaseHasRun = useRef(false);
  
  // Referencias para intervalos y timers
  const messageIntervalRef = useRef(null);
  const mainIntervalRef = useRef(null);
  const phaseTimeoutRef = useRef(null);
  const breathingAnim = new Animated.Value(1);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const welcomeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  
  useFocusEffect(
    React.useCallback(() => {
      // This effect runs when the screen comes into focus.
      // It resets the state of the screen to its initial values.
      setSessionPhase(0);
      setBreathingActive(false);
      setShowWelcome(true);
      setBreathingCount(0);
      setCurrentMessage(0);
      setTotalSessionTime(0);
      setIsPaused(false);
      preparationPhaseHasRun.current = false;

      // It also clears any running timers.
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
      if (mainIntervalRef.current) clearInterval(mainIntervalRef.current);
      if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);

      // The function returned here is the cleanup function.
      // It runs when the screen loses focus.
      return () => {
        if (sound) {
          sound.stopAsync().catch(() => {});
          sound.unloadAsync().catch(() => {});
        }
        if (backgroundMusic) {
          backgroundMusic.stopAsync().catch(() => {});
          backgroundMusic.unloadAsync().catch(() => {});
        }
      };
    }, [])
  );

  // Removed panic mode useEffect - now using direct mindfulness approach

  // Cleanup adicional cuando el componente se desmonta
  useEffect(() => {
    return () => {
      // Cleanup final cuando el componente se desmonta completamente
      if (sound) {
        sound.stopAsync().catch(() => {});
        sound.unloadAsync().catch(() => {});
      }
    };
  }, []);

  // Empathetic welcome animation
  useEffect(() => {
    if (showWelcome) {
      // Smooth entrance animation
      Animated.sequence([
        Animated.timing(welcomeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(welcomeAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        })
      ]).start(async () => {
        setShowWelcome(false);
        setBreathingActive(true);
        
        // Iniciar música de fondo cuando showWelcome cambia a false
        try {
          // Usar Moonlit Drift para sesiones de mindfulness por defecto
          const { sound: bgMusic } = await Audio.Sound.createAsync(
            require('../../assets/songs/Moonlit Drift.mp3'),
            {
              shouldPlay: true,
              isLooping: true,
              volume: 0.12, // Volumen suave para mindfulness
            }
          );
          setBackgroundMusic(bgMusic);
        } catch (error) {
          console.log('Error loading background music:', error);
        }
      });
      
      // Continuous floating animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          })
        ])
      ).start();
    }
  }, [showWelcome]);

  // useEffect para cambiar música cuando se inicia ejercicio de respiración
  // NOTA: Este useEffect está comentado temporalmente para evitar conflictos
  // con la música que se inicia en el callback de la animación
  /*
  useEffect(() => {
    const loadBreathingMusic = async () => {
      if (breathingActive && !showWelcome && backgroundMusic) {
        // Detener música actual
        try {
          await backgroundMusic.stopAsync();
          await backgroundMusic.unloadAsync();
        } catch (error) {
          console.log('Error stopping current music:', error);
        }
        
        // Cargar música específica para ejercicios de respiración
        try {
          const { sound: bgMusic } = await Audio.Sound.createAsync(
            require('../../assets/songs/Whispered Waves.mp3'),
            {
              shouldPlay: true,
              isLooping: true,
              volume: 0.15, // Volumen para ejercicios de respiración
            }
          );
          setBackgroundMusic(bgMusic);
        } catch (error) {
          console.log('Error loading breathing exercise music:', error);
        }
      }
    };
    
    loadBreathingMusic();
  }, [breathingActive, showWelcome]);
  */

  // Función para obtener un mensaje aleatorio diferente al actual
  const getRandomMessage = (messagesArray, currentIndex) => {
    if (messagesArray.length <= 1) return 0;
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * messagesArray.length);
    } while (randomIndex === currentIndex);
    return randomIndex;
  };

  // Efecto para la fase de preparación
  useEffect(() => {
    let secondMessageTimer;
    let phaseChangeTimer;

    if (breathingActive && !showWelcome && !isPaused && sessionPhase === 0 && !preparationPhaseHasRun.current) {
      preparationPhaseHasRun.current = true;
      // 1. Reproducir el primer mensaje inmediatamente
      setCurrentMessage(prev => getRandomMessage(mindfulnessMessages.preparation, prev));
      animateMessageChange();
      setLastPlayedSound(null);

      // 2. Después de 10 segundos, reproducir el segundo mensaje
      secondMessageTimer = setTimeout(() => {
        setCurrentMessage(prev => getRandomMessage(mindfulnessMessages.preparation, prev));
        animateMessageChange();
        setLastPlayedSound(null);
      }, 10000);

      // 3. Después de 20 segundos, cambiar a la fase de respiración
      phaseChangeTimer = setTimeout(() => {
        setSessionPhase(1);
        const randomStartIndex = Math.floor(Math.random() * mindfulnessMessages.breathing.length);
        setCurrentMessage(randomStartIndex);
        setBreathingCount(0);
        setLastPlayedSound(null);
      }, 20000);
    }

    return () => {
      clearTimeout(secondMessageTimer);
      clearTimeout(phaseChangeTimer);
    };
  }, [breathingActive, showWelcome, isPaused, sessionPhase]);

  // Efecto para el intervalo de mensajes en otras fases (breathing, reflection)
  useEffect(() => {
    if (breathingActive && !showWelcome && !isPaused && (sessionPhase === 1 || sessionPhase === 2)) {
      messageIntervalRef.current = setInterval(() => {
        setCurrentMessage(prev => {
          let messagesArray;
          if (sessionPhase === 1) {
            messagesArray = mindfulnessMessages.breathing;
          } else {
            messagesArray = mindfulnessMessages.reflection;
          }
          const newIndex = getRandomMessage(messagesArray, prev);
          setLastPlayedSound(null);
          animateMessageChange();
          return newIndex;
        });
      }, 10000);
    }

    return () => {
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current);
        messageIntervalRef.current = null;
      }
    };
  }, [breathingActive, showWelcome, isPaused, sessionPhase]);

  useEffect(() => {
    if (breathingActive && !showWelcome && !isPaused) {
      // Iniciar sonido ambiente
      loadAndPlaySound();
      
      // Contador total de tiempo de sesión
      mainIntervalRef.current = setInterval(() => {
        setTotalSessionTime(prev => prev + 1);
      }, 1000);
      
      // Fase de preparación (controlada por contador de mensajes)
      if (sessionPhase === 0) {
        // El cambio a breathing se controla automáticamente por el contador de mensajes
      }
      
      // Guided breathing phase (2 minutes)
      else if (sessionPhase === 1) {
        phaseTimeoutRef.current = setInterval(() => {
          setBreathingCount(prev => {
            const newCount = prev + 1;
            const cycle = newCount % 12; // 4 segundos inhalar, 4 mantener, 4 exhalar
            
            if (cycle <= 4) {
              setBreathingPhase('inhale');
            } else if (cycle <= 8) {
              setBreathingPhase('hold');
            } else {
              setBreathingPhase('exhale');
            }
            
            // Después de 2 minutos, terminar sesión
            if (newCount >= 120) {
              finishSession();
              return 0;
            }
            
            return newCount;
          });
        }, 1000);
        
        // Breathing animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(breathingAnim, {
              toValue: 1.3,
              duration: 4000,
              useNativeDriver: true,
            }),
            Animated.timing(breathingAnim, {
              toValue: 1.3,
              duration: 4000,
              useNativeDriver: true,
            }),
            Animated.timing(breathingAnim, {
              toValue: 1,
              duration: 4000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
      

    }
    
    return () => {
      if (phaseTimeoutRef.current) {
        clearInterval(phaseTimeoutRef.current);
        phaseTimeoutRef.current = null;
      }
      if (mainIntervalRef.current) {
        clearInterval(mainIntervalRef.current);
        mainIntervalRef.current = null;
      }
    };
  }, [breathingActive, sessionPhase, isPaused]);
  
  // Cleanup del sonido
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // Función para iniciar directamente la sesión de mindfulness
  const startMindfulnessSession = async () => {
    setShowWelcome(true);
    setSessionPhase(0);
    // Start with a random preparation message
    const randomPrepIndex = Math.floor(Math.random() * mindfulnessMessages.preparation.length);
    setCurrentMessage(randomPrepIndex);
    setBreathingCount(0);
    setBreathingPhase('preparation');
    setLastPlayedSound(null); // Reset to allow session sounds from start
    setPreparationMessageCount(0); // Reset preparation message counter
    
    // La música se iniciará cuando showWelcome cambie a false
  };

  // Auto-iniciar la sesión al cargar la pantalla
  useEffect(() => {
    startMindfulnessSession();
  }, []);

  // Function to play message sound
  const playMessageSound = async (soundPath) => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      // Stop previous sound if exists
      if (sound) {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (cleanupError) {
          console.log('Error cleaning up previous sound:', cleanupError);
        }
        setSound(null);
        // Small delay to ensure cleanup is complete
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (Platform.OS === 'web') {
        console.log('Audio playback disabled for web platform. Path:', soundPath);
        return;
      }
      
      // For React Native, we need to use require() for local assets
      // Extract filename from path to use with require
      const filename = soundPath.split('/').pop();
      let audioSource;
      
      // Dynamic audio mapping using require context
      try {
        if (soundPath.includes('preparation/')) {
          // Map all preparation audio files
          const audioMap = {
            'After every storm comes peace.mp3': require('../../assets/preparation/After every storm comes peace.mp3'),
            'Allow yourself to simply be.mp3': require('../../assets/preparation/Allow yourself to simply be.mp3'),
            'Breathe with me, everything will be okay.mp3': require('../../assets/preparation/Breathe with me, everything will be okay.mp3'),
            'Ground yourself in this present moment.mp3': require('../../assets/preparation/Ground yourself in this present moment.mp3'),
            'Imagine floating on a soft cloud.mp3': require('../../assets/preparation/Imagine floating on a soft cloud.mp3'),
            'Let calmness flow to you naturally.mp3': require('../../assets/preparation/Let calmness flow to you naturally.mp3'),
            'Let the waves of calm wash over you.mp3': require('../../assets/preparation/Let the waves of calm wash over you.mp3'),
            'Let\'s find your inner peace together.mp3': require('../../assets/preparation/Let\'s find your inner peace together.mp3'),
            'Peace is already within you.mp3': require('../../assets/preparation/Peace is already within you.mp3'),
            'Peace is always within your reach.mp3': require('../../assets/preparation/Peace is always within your reach.mp3'),
            'Rest your mind, you are held.mp3': require('../../assets/preparation/Rest your mind, you are held.mp3'),
            'Take a moment to honor your courage.mp3': require('../../assets/preparation/Take a moment to honor your courage.mp3'),
            'This is your sacred space for healing.mp3': require('../../assets/preparation/This is your sacred space for healing.mp3'),
            'This moment is a gift you give yourself.mp3': require('../../assets/preparation/This moment is a gift you give yourself.mp3'),
            'Wrap yourself in self-compassion.mp3': require('../../assets/preparation/Wrap yourself in self-compassion.mp3'),
            'You are exactly where you need to be.mp3': require('../../assets/preparation/You are exactly where you need to be.mp3'),
            'You are not alone in this journey.mp3': require('../../assets/preparation/You are not alone in this journey.mp3'),
            'You are safe in this moment.mp3': require('../../assets/preparation/You are safe in this moment.mp3'),
            'You are safe, you are protected.mp3': require('../../assets/preparation/You are safe, you are protected.mp3'),
            'You deserve this moment of tranquility.mp3': require('../../assets/preparation/You deserve this moment of tranquility.mp3'),
            'Your feelings are valid and welcome here.mp3': require('../../assets/preparation/Your feelings are valid and welcome here.mp3'),
            'Your strength brought you here.mp3': require('../../assets/preparation/Your strength brought you here.mp3')
          };
          audioSource = audioMap[filename];
        } else if (soundPath.includes('breathing/')) {
          // Map all breathing audio files
          const audioMap = {
            'After every storm comes a rainbow.mp3': require('../../assets/breathing/After every storm comes a rainbow.mp3'),
            'Beauty exists in your vulnerability.mp3': require('../../assets/breathing/Beauty exists in your vulnerability.mp3'),
            'Bloom at your own pace.mp3': require('../../assets/breathing/Bloom at your own pace.mp3'),
            'Bloom where you are planted.mp3': require('../../assets/breathing/Bloom where you are planted.mp3'),
            'Breathe in courage, breathe out fear.mp3': require('../../assets/breathing/Breathe in courage, breathe out fear.mp3'),
            'Breathe in wonder, breathe out gratitude.mp3': require('../../assets/breathing/Breathe in wonder, breathe out gratitude.mp3'),
            'Change begins with a single breath.mp3': require('../../assets/breathing/Change begins with a single breath.mp3'),
            'Cleanse your spirit with each exhale.mp3': require('../../assets/breathing/Cleanse your spirit with each exhale.mp3'),
            'Dawn always follows darkness.mp3': require('../../assets/breathing/Dawn always follows darkness.mp3'),
            'Each breath brings you closer to peace.mp3': require('../../assets/breathing/Each breath brings you closer to peace.mp3'),
            'Every breath is a new chance.mp3': require('../../assets/breathing/Every breath is a new chance.mp3'),
            'Every ending is a new beginning.mp3': require('../../assets/breathing/Every ending is a new beginning.mp3'),
            'Every moment offers a chance to begin again.mp3': require('../../assets/breathing/Every moment offers a chance to begin again.mp3'),
            'Exhale everything you don\'t need.mp3': require('../../assets/breathing/Exhale everything you don\'t need.mp3'),
            'Feel your heart becoming calm.mp3': require('../../assets/breathing/Feel your heart becoming calm.mp3'),
            'Find comfort in the rhythm of night.mp3': require('../../assets/breathing/Find comfort in the rhythm of night.mp3'),
            'Float above your worries.mp3': require('../../assets/breathing/Float above your worries.mp3'),
            'Flow like water around obstacles.mp3': require('../../assets/breathing/Flow like water around obstacles.mp3'),
            'Flow with the rhythm of your breath.mp3': require('../../assets/breathing/Flow with the rhythm of your breath.mp3'),
            'Freedom is found in letting go.mp3': require('../../assets/breathing/Freedom is found in letting go.mp3'),
            'Freedom lives in your breath.mp3': require('../../assets/breathing/Freedom lives in your breath.mp3'),
            'Gentleness heals all wounds.mp3': require('../../assets/breathing/Gentleness heals all wounds.mp3'),
            'Gentleness is your superpower.mp3': require('../../assets/breathing/Gentleness is your superpower.mp3'),
            'Ground yourself in this present moment.mp3': require('../../assets/breathing/Ground yourself in this present moment.mp3'),
            'Grow through what you go through.mp3': require('../../assets/breathing/Grow through what you go through.mp3'),
            'Healing happens in sacred pauses.mp3': require('../../assets/breathing/Healing happens in sacred pauses.mp3'),
            'Hold this precious feeling.mp3': require('../../assets/breathing/Hold this precious feeling.mp3'),
            'Hope lives in your heartbeat.mp3': require('../../assets/breathing/Hope lives in your heartbeat.mp3'),
            'In stillness, you find your power.mp3': require('../../assets/breathing/In stillness, you find your power.mp3'),
            'Inhale love and tranquility.mp3': require('../../assets/breathing/Inhale love and tranquility.mp3'),
            'Let go and let life surprise you.mp3': require('../../assets/breathing/Let go and let life surprise you.mp3'),
            'Let go like water flowing downstream.mp3': require('../../assets/breathing/Let go like water flowing downstream.mp3'),
            'Let peace flow through every cell.mp3': require('../../assets/breathing/Let peace flow through every cell.mp3'),
            'Let serenity wash over you.mp3': require('../../assets/breathing/Let serenity wash over you.mp3'),
            'Let your thoughts drift like clouds.mp3': require('../../assets/breathing/Let your thoughts drift like clouds.mp3'),
            'Listen to the music of your soul.mp3': require('../../assets/breathing/Listen to the music of your soul.mp3'),
            'Love is the answer to everything.mp3': require('../../assets/breathing/Love is the answer to everything.mp3'),
            'Love yourself like your life depends on it.mp3': require('../../assets/breathing/Love yourself like your life depends on it.mp3'),
            'Love yourself through this breath.mp3': require('../../assets/breathing/Love yourself through this breath.mp3'),
            'Magic happens when you breathe mindfully.mp3': require('../../assets/breathing/Magic happens when you breathe mindfully.mp3'),
            'Miracles are woven into ordinary moments.mp3': require('../../assets/breathing/Miracles are woven into ordinary moments.mp3'),
            'Nature celebrates your existence.mp3': require('../../assets/breathing/Nature celebrates your existence.mp3'),
            'Nature\'s wisdom flows through you.mp3': require('../../assets/breathing/Nature\'s wisdom flows through you.mp3'),
            'Night brings wisdom and rest.mp3': require('../../assets/breathing/Night brings wisdom and rest.mp3'),
            'Peace is your birthright.mp3': require('../../assets/breathing/Peace is your birthright.mp3'),
            'Release what no longer serves you.mp3': require('../../assets/breathing/Release what no longer serves you.mp3'),
            'Rest in the gentle embrace of this moment.mp3': require('../../assets/breathing/Rest in the gentle embrace of this moment.mp3'),
            'Rest is a form of resistance.mp3': require('../../assets/breathing/Rest is a form of resistance.mp3'),
            'Rest is productive too.mp3': require('../../assets/breathing/Rest is productive too.mp3'),
            'Ride the waves of your breathing.mp3': require('../../assets/breathing/Ride the waves of your breathing.mp3'),
            'Root yourself in self-compassion.mp3': require('../../assets/breathing/Root yourself in self-compassion.mp3'),
            'Softness is not weakness.mp3': require('../../assets/breathing/Softness is not weakness.mp3'),
            'Surrender to the flow of life.mp3': require('../../assets/breathing/Surrender to the flow of life.mp3'),
            'Tears are prayers too.mp3': require('../../assets/breathing/Tears are prayers too.mp3'),
            'This moment is a gift to yourself.mp3': require('../../assets/breathing/This moment is a gift to yourself.mp3'),
            'Transform your worries into butterflies.mp3': require('../../assets/breathing/Transform your worries into butterflies.mp3'),
            'Trust the process of your transformation.mp3': require('../../assets/breathing/Trust the process of your transformation.mp3'),
            'Trust your journey of becoming.mp3': require('../../assets/breathing/Trust your journey of becoming.mp3'),
            'Turn your face toward hope.mp3': require('../../assets/breathing/Turn your face toward hope.mp3'),
            'Warmth and comfort surround you.mp3': require('../../assets/breathing/Warmth and comfort surround you.mp3'),
            'Wrap yourself in loving kindness.mp3': require('../../assets/breathing/Wrap yourself in loving kindness.mp3'),
            'You are a masterpiece in progress.mp3': require('../../assets/breathing/You are a masterpiece in progress.mp3'),
            'You are a miracle in motion.mp3': require('../../assets/breathing/You are a miracle in motion.mp3'),
            'You are as vast as the ocean.mp3': require('../../assets/breathing/You are as vast as the ocean.mp3'),
            'You are becoming who you\'re meant to be.mp3': require('../../assets/breathing/You are becoming who you\'re meant to be.mp3'),
            'You are blooming with each breath.mp3': require('../../assets/breathing/You are blooming with each breath.mp3'),
            'You are both human and divine.mp3': require('../../assets/breathing/You are both human and divine.mp3'),
            'You are both the storm and the calm.mp3': require('../../assets/breathing/You are both the storm and the calm.mp3'),
            'You are deeper than your deepest ocean.mp3': require('../../assets/breathing/You are deeper than your deepest ocean.mp3'),
            'You are exactly enough as you are.mp3': require('../../assets/breathing/You are exactly enough as you are.mp3'),
            'You are exactly where you need to be.mp3': require('../../assets/breathing/You are exactly where you need to be.mp3'),
            'You are growing in ways you can\'t see.mp3': require('../../assets/breathing/You are growing in ways you can\'t see.mp3'),
            'You are held by something greater.mp3': require('../../assets/breathing/You are held by something greater.mp3'),
            'You are lighter than you think.mp3': require('../../assets/breathing/You are lighter than you think.mp3'),
            'You are rooted in infinite possibility.mp3': require('../../assets/breathing/You are rooted in infinite possibility.mp3'),
            'You are rooted in love and growing toward light.mp3': require('../../assets/breathing/You are rooted in love and growing toward light.mp3'),
            'You are rooted in love.mp3': require('../../assets/breathing/You are rooted in love.mp3'),
            'You are stardust with consciousness.mp3': require('../../assets/breathing/You are stardust with consciousness.mp3'),
            'You are stronger than you know.mp3': require('../../assets/breathing/You are stronger than you know.mp3'),
            'You are the rainbow after your own storm.mp3': require('../../assets/breathing/You are the rainbow after your own storm.mp3'),
            'You are worthy of peace.mp3': require('../../assets/breathing/You are worthy of peace.mp3'),
            'You are writing a beautiful story.mp3': require('../../assets/breathing/You are writing a beautiful story.mp3'),
            'You are your own source of light.mp3': require('../../assets/breathing/You are your own source of light.mp3'),
            'You belong to the earth and sky.mp3': require('../../assets/breathing/You belong to the earth and sky.mp3'),
            'You contain multitudes of strength.mp3': require('../../assets/breathing/You contain multitudes of strength.mp3'),
            'You illuminate the world simply by being.mp3': require('../../assets/breathing/You illuminate the world simply by being.mp3'),
            'You shine even in difficult moments.mp3': require('../../assets/breathing/You shine even in difficult moments.mp3'),
            'You sparkle even when you can\'t see it.mp3': require('../../assets/breathing/You sparkle even when you can\'t see it.mp3'),
            'Your breath is a bridge to peace.mp3': require('../../assets/breathing/Your breath is a bridge to peace.mp3'),
            'Your existence makes the universe complete.mp3': require('../../assets/breathing/Your existence makes the universe complete.mp3'),
            'Your heart is a garden of possibilities.mp3': require('../../assets/breathing/Your heart is a garden of possibilities.mp3'),
            'Your heart knows the way home.mp3': require('../../assets/breathing/Your heart knows the way home.mp3'),
            'Your inner flame cannot be extinguished.mp3': require('../../assets/breathing/Your inner flame cannot be extinguished.mp3'),
            'Your inner light illuminates the path.mp3': require('../../assets/breathing/Your inner light illuminates the path.mp3'),
            'Your inner light is growing brighter.mp3': require('../../assets/breathing/Your inner light is growing brighter.mp3'),
            'Your light guides others home.mp3': require('../../assets/breathing/Your light guides others home.mp3'),
            'Your presence is a present.mp3': require('../../assets/breathing/Your presence is a present.mp3'),
            'Your resilience is remarkable.mp3': require('../../assets/breathing/Your resilience is remarkable.mp3'),
            'Your sensitivity is a gift.mp3': require('../../assets/breathing/Your sensitivity is a gift.mp3'),
            'Your warmth touches everyone you meet.mp3': require('../../assets/breathing/Your warmth touches everyone you meet.mp3'),
            'Your wings are stronger than your fears.mp3': require('../../assets/breathing/Your wings are stronger than your fears.mp3')
          };
          audioSource = audioMap[filename];
        }
        
        if (!audioSource) {
          console.log('Audio file not found in mapping:', filename);
          return;
        }
      } catch (error) {
        console.log('Error mapping audio file:', filename, error);
        return;
      }
      
      // Enable audio playback for native platforms
      const { sound: newSound } = await Audio.Sound.createAsync(
        audioSource,
        { 
          shouldPlay: false, 
          isLooping: false, 
          volume: 0.7,
          rate: 1.0,
          shouldCorrectPitch: true
        }
      );
      
      // Play the sound after creation
      await newSound.playAsync();
      setSound(newSound);
    } catch (error) {
      console.log('Error playing sound:', error, 'for path:', soundPath);
      // Continue without sound if there's an error
    }
  };

  const loadAndPlaySound = async () => {
    // This function is now used for background ambient sounds if needed
    // Individual message sounds are handled by playMessageSound
  };
  
  // Smooth animation for message changes
  const animateMessageChange = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startBreathingExercise = async () => {
    setBreathingActive(true);
    setBreathingCount(0);
    setSessionPhase(0);
    // Start with a random preparation message
    const randomPrepIndex = Math.floor(Math.random() * mindfulnessMessages.preparation.length);
    setCurrentMessage(randomPrepIndex);
    setBreathingPhase('preparation');
    setLastPlayedSound(null); // Reset to allow exercise sounds from start
    
    // La música se iniciará cuando showWelcome cambie a false
  };

  const stopBreathingExercise = async () => {
    setBreathingActive(false);
    setBreathingCount(0);
    setSessionPhase(0);
    // Reset to a random preparation message
    const randomPrepIndex = Math.floor(Math.random() * mindfulnessMessages.preparation.length);
    setCurrentMessage(randomPrepIndex);
    setBreathingPhase('preparation');
    
    // Detener sonido
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
    
    // Detener música de fondo
    if (backgroundMusic) {
      await backgroundMusic.stopAsync();
      await backgroundMusic.unloadAsync();
      setBackgroundMusic(null);
    }
  };

  // Nueva función para finalizar la sesión y navegar al feedback
  const finishSession = async () => {
    try {
      // First, stop all active states and intervals
      setBreathingActive(false);
      setIsPaused(true);
      
      // Clear all possible intervals and timers explicitly
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current);
        messageIntervalRef.current = null;
      }
      if (mainIntervalRef.current) {
        clearInterval(mainIntervalRef.current);
        mainIntervalRef.current = null;
      }
      if (phaseTimeoutRef.current) {
        clearInterval(phaseTimeoutRef.current);
        phaseTimeoutRef.current = null;
      }
      
      // Detener y limpiar sonido de manera robusta
      if (sound) {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (error) {
          console.log('Error stopping voice sound:', error);
        }
        setSound(null);
      }
      
      // Detener y limpiar música de fondo
      if (backgroundMusic) {
        try {
          await backgroundMusic.stopAsync();
          await backgroundMusic.unloadAsync();
        } catch (error) {
          console.log('Error stopping background music:', error);
        }
        setBackgroundMusic(null);
      }
      
      // Configurar audio para limpieza rápida
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: false,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
        
        // Limpieza rápida del audio
        await Audio.setIsEnabledAsync(false);
        await new Promise(resolve => setTimeout(resolve, 50));
        await Audio.setIsEnabledAsync(true);
        
      } catch (error) {
        console.log('Error in audio cleanup during finish:', error);
      }
      
    } catch (error) {
      console.log('Error in finishSession:', error);
    }
    
    // Navegar a la pantalla de feedback con datos de la sesión
    navigation.navigate('SOSFeedback', {
      sessionDuration: totalSessionTime,
      sessionType: 'mindfulness',
      completedPhases: sessionPhase + 1
    });
  };

  const callEmergency = () => {
    Alert.alert(
      'Llamar Ayuda',
      '¿A quién te gustaría contactar?',
      [
        {
          text: 'Línea de Crisis (988)',
          onPress: () => Linking.openURL('tel:988'),
        },
        {
          text: 'Emergencias (911)',
          onPress: () => Linking.openURL('tel:911'),
        },
        {
          text: 'Contacto de Confianza',
          onPress: () => console.log('Llamar contacto de confianza'),
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  // Removed resetPanicMode function - no longer needed

  const getBreathingInstruction = () => {
    switch (breathingPhase) {
      case 'preparation':
        return 'Preparing for calm';
      case 'inhale':
        return 'Breathe in deeply';
      case 'hold':
        return 'Hold your breath';
      case 'exhale':
        return 'Exhale slowly';

      default:
        return 'Breathe naturally';
    }
  };
  
  const getCurrentMessage = () => {
    if (showWelcome) {
      return mindfulnessMessages.welcome[currentMessage % mindfulnessMessages.welcome.length];
    }
    
    let messages;
    switch (sessionPhase) {
      case 0:
        messages = mindfulnessMessages.preparation;
        break;
      case 1:
        messages = mindfulnessMessages.breathing;
        break;

      default:
        return 'Breathe naturally';
    }
    
    const currentMessageData = messages[currentMessage % messages.length];
    
    // If message has sound and it's different from the last played sound, play it
    if (currentMessageData?.sound && currentMessageData.sound !== lastPlayedSound) {
      setLastPlayedSound(currentMessageData.sound);
      playMessageSound(currentMessageData.sound);
    }
    
    // Return message text (for breathing objects) or string (for other phases)
    return typeof currentMessageData === 'object' ? currentMessageData.message : currentMessageData;
  };
  
  const getSessionTitle = () => {
    if (showWelcome) {
      return '';
    }
    
    return '';
  };
  
  const getCircleColor = () => {
    switch (sessionPhase) {
      case 0:
        return '#9C27B0'; // Púrpura para preparación
      case 1:
        return '#4CAF50'; // Green for breathing

      default:
        return '#4CAF50';
    }
  };

  const handle54321Technique = () => {
    Alert.alert(
      'Técnica 5-4-3-2-1',
      'Identifica:\n• 5 cosas que puedes VER\n• 4 cosas que puedes TOCAR\n• 3 cosas que puedes ESCUCHAR\n• 2 cosas que puedes OLER\n• 1 cosa que puedes SABOREAR\n\nEsto te ayudará a conectar con el presente.',
      [{ text: 'Entendido' }]
    );
  };

  const handleRelaxingMusic = () => {
    Alert.alert(
      'Música Relajante',
      'Playing calming sounds to help you relax...',
      [{ text: 'Comenzar' }]
    );
  };

  const handleAffirmations = () => {
    const affirmations = [
      'Estoy seguro/a y protegido/a',
      'Esto también pasará',
      'Soy más fuerte de lo que creo',
      'Puedo manejar esta situación',
      'Estoy rodeado/a de amor y apoyo'
    ];
    const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
    Alert.alert('Afirmación Positiva', `"${randomAffirmation}"\n\nRepite esto en voz alta o mentalmente.`);
  };

  const handleContactTherapist = () => {
    Alert.alert(
      'Contactar Profesional',
      '¿Cómo te gustaría contactar ayuda profesional?',
      [
        { text: 'Llamar Línea de Crisis', onPress: () => Linking.openURL('tel:988') },
        { text: 'Chat de Apoyo', onPress: () => Alert.alert('Chat', 'Conectando con chat de apoyo...') },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const quickTools = [
    {
      id: 1,
      title: 'Técnica 5-4-3-2-1',
      description: 'Grounding para ansiedad',
      icon: 'eye-outline',
      color: '#2196F3',
      action: handle54321Technique,
    },
    {
      id: 2,
      title: 'Música Relajante',
      description: 'Calming sounds',
      icon: 'musical-notes-outline',
      color: '#9C27B0',
      action: handleRelaxingMusic,
    },
    {
      id: 3,
      title: 'Afirmaciones',
      description: 'Pensamientos positivos',
      icon: 'heart-outline',
      color: '#E91E63',
      action: handleAffirmations,
    },
    {
      id: 4,
      title: 'Contactar Terapeuta',
      description: 'Hablar con profesional',
      icon: 'person-outline',
      color: '#FF9800',
      action: handleContactTherapist,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {showWelcome ? (
        /* Empathetic Welcome Screen */
        <Animated.View style={[styles.welcomeContainer, { opacity: welcomeAnim }]}>
          <Animated.View style={[
            styles.welcomeContent,
            {
              transform: [{
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10]
                })
              }]
            }
          ]}>
            <View style={styles.welcomeIcon}>
              <Ionicons name="heart" size={80} color="#FF6B9D" />
            </View>
            
            <Text style={styles.welcomeTitle}>
              {getCurrentMessage()}
            </Text>
            
            <View style={styles.breathingIndicator}>
              
              <Text style={styles.breathingText}>Breathe with me...</Text>
            </View>
          </Animated.View>
        </Animated.View>
      ) : (
        /* Sesión de Mindfulness - Nuevo Diseño */
        <LinearGradient
          colors={['#4A90E2', '#7BB3F0', '#A8D0F8']}
          style={styles.mindfulnessContainer}
        >
          {breathingActive && (
        /* Mindfulness Session Screen */
        <View style={styles.breathingContainer}>
          {/* Header con botón cerrar */}
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                if (breathingActive) {
                  finishSession();
                } else {
                  navigation.goBack();
                }
              }}
            >
              <Ionicons name="close" size={24} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Session</Text>
            
            <TouchableOpacity style={styles.musicButton}>
              <Ionicons name="musical-notes" size={24} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>

          {/* Barra de progreso */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarTrack}>
              <View style={[
                styles.progressBarFill,
                { width: `${Math.min((totalSessionTime / 160) * 100, 100)}%` }
              ]} />
            </View>
          </View>

          {/* Contenido central */}
          <View style={styles.centerContent}>
            <Text style={styles.verseText}>
               {getCurrentMessage()}
            </Text>
            
            
            
            <Text style={styles.instructionText}>
              Breathe deeply and find your inner calm
             
            </Text>
          </View>

          {/* Botón de pausa */}
          <TouchableOpacity 
              style={styles.pauseButton}
              onPress={() => {
                if (isPaused) {
                  // Reanudar
                  setIsPaused(false);
                } else {
                  // Pausar
                  setIsPaused(true);
                }
              }}
            >
              <Ionicons name={isPaused ? "play" : "pause"} size={32} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
        </View>
           )}
         </LinearGradient>
        )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  // Styles for empathetic welcome screen
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F8',
    padding: 20,
  },
  welcomeContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '400',
    color: '#4A4A4A',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 28,
    fontFamily: 'System',
    paddingHorizontal: 20,
  },
  breathingIndicator: {
    alignItems: 'center',
  },
  breathingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B9D',
    marginBottom: 10,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  breathingText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    fontWeight: '300',
  },
  // Styles for mindfulness session
  mindfulnessContainer: {
    flex: 1,
  },
  // Removed mindfulHeader - no longer needed
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  panicText: {
    color: 'white',
  },
  resetButton: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  panicSection: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 30,
  },
  panicTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  panicSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  panicButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  panicButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panicButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  toolsSection: {
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  toolCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  panicToolCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  toolIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  toolTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  toolDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  contactsSection: {
    padding: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  panicContactCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  contactText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  // Breathing Exercise Styles
  breathingContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  musicButton: {
    padding: 8,
  },
  progressBarContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  progressBarTrack: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  verseText: {
    fontSize: 24,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 60,
    fontStyle: 'italic',
  },
  verseReference: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 40,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  pauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  // Removed stopBreathingButton - using backButton instead
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
    position: 'absolute',
    top: 60,
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  breathingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  messageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    padding: 30,
    margin: 20,
    marginTop: 0,
    borderRadius: 25,
    shadowColor: '#E8A87C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 130,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 124, 0.2)',
    width: '90%',
    alignItems: 'center',
    marginBottom: 30,
  },
  mindfulnessMessage: {
    fontSize: 20,
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: 30,
    fontWeight: '300',
    fontFamily: 'System',
    letterSpacing: 0.5,
    fontStyle: 'italic',
  },
  breathingCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#81C784',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    elevation: 10,
    shadowColor: '#66BB6A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  breathingInstruction: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sessionInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  breathingCounter: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  sessionCounter: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  soundIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  soundText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  finishBreathingButton: {
    backgroundColor: '#81C784',
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 30,
    elevation: 10,
    shadowColor: '#66BB6A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  finishBreathingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '400',
    letterSpacing: 1,
  },
});

export default SOSScreen;