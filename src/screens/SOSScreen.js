import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  StatusBar,
  Dimensions,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { mindfulnessMessages } from '../data/mindfulnessMessages';

const { width } = Dimensions.get('window');

const SOSScreen = ({ navigation }) => {
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('preparation');
  const [breathingCount, setBreathingCount] = useState(0);
  const [sessionPhase, setSessionPhase] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [sound, setSound] = useState(null);
  const [backgroundMusic, setBackgroundMusic] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [totalSessionTime, setTotalSessionTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lastPlayedSound, setLastPlayedSound] = useState(null);
  const preparationPhaseHasRun = useRef(false);
  const [isWelcomeMessagePlaying, setIsWelcomeMessagePlaying] = useState(false);
  const [currentMusicIndex, setCurrentMusicIndex] = useState(0);

  // Refs
  const messageIntervalRef = useRef(null);
  const mainIntervalRef = useRef(null);
  const phaseTimeoutRef = useRef(null);
  const breathingAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const welcomeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const isMounted = useRef(true);

  // --- Effects ---

  // Reset on Focus
  useFocusEffect(
    useCallback(() => {
      if (isWelcomeMessagePlaying) return;

      setSessionPhase(0);
      setBreathingActive(false);
      setShowWelcome(true);
      setBreathingCount(0);
      setCurrentMessage(0);
      setTotalSessionTime(0);
      setIsPaused(false);
      preparationPhaseHasRun.current = false;

      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
      if (mainIntervalRef.current) clearInterval(mainIntervalRef.current);
      if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);

      return () => {
        if (sound) {
          sound.stopAsync().catch(() => { });
          sound.unloadAsync().catch(() => { });
        }
        if (backgroundMusic) {
          backgroundMusic.stopAsync().catch(() => { });
          backgroundMusic.unloadAsync().catch(() => { });
        }
      };
    }, [isWelcomeMessagePlaying])
  );

  // Cleanup on Unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (sound) {
        sound.stopAsync().catch(() => { });
        sound.unloadAsync().catch(() => { });
      }
    };
  }, []);

  // Random Music
  useEffect(() => {
    if (breathingActive && !showWelcome) {
      const randomIndex = getRandomMusicIndex(-1);
      setCurrentMusicIndex(randomIndex);
    }
  }, [breathingActive, showWelcome]);

  // Welcome Sequence & Grounding Vibration
  useEffect(() => {
    const playWelcomeSequence = async () => {
      // Grounding Vibration (Heartbeat pattern)
      Vibration.vibrate([0, 400, 100, 400]);

      Animated.timing(welcomeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();

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
          }),
        ])
      ).start();

      const welcomeMessage = mindfulnessMessages.welcome[0];
      if (welcomeMessage?.sound) {
        setIsWelcomeMessagePlaying(true);
        await playMessageSound(welcomeMessage.sound);
        if (isMounted.current) {
          setIsWelcomeMessagePlaying(false);
        }
      }

      const sessionTimeout = setTimeout(() => {
        if (isMounted.current) {
          startMindfulnessSession();
        }
      }, 7000);

      return () => clearTimeout(sessionTimeout);
    };

    if (showWelcome) {
      playWelcomeSequence();
    }
  }, [showWelcome]);

  // Load Breathing Music
  useEffect(() => {
    const loadBreathingMusic = async () => {
      if (breathingActive && !showWelcome && !backgroundMusic) {
        try {
          await backgroundMusic?.stopAsync();
          await backgroundMusic?.unloadAsync();
        } catch (error) { }

        try {
          const { sound: bgMusic } = await Audio.Sound.createAsync(
            backgroundMusicList[currentMusicIndex],
            { shouldPlay: true, isLooping: false, volume: 0.1 }
          );

          bgMusic.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish && !status.isLooping) {
              const nextIndex = getRandomMusicIndex(currentMusicIndex);
              setCurrentMusicIndex(nextIndex);
            }
          });

          setBackgroundMusic(bgMusic);
        } catch (error) {
          console.log('Error loading music:', error);
        }
      }
    };
    loadBreathingMusic();
  }, [breathingActive, showWelcome, currentMusicIndex]);

  // Preparation Phase Logic
  useEffect(() => {
    let secondMessageTimer;
    let phaseChangeTimer;

    if (breathingActive && !showWelcome && !isPaused && sessionPhase === 0 && !preparationPhaseHasRun.current) {
      preparationPhaseHasRun.current = true;

      secondMessageTimer = setTimeout(() => {
        setCurrentMessage(prev => getRandomMessage(mindfulnessMessages.preparation, prev));
        animateMessageChange();
        setLastPlayedSound(null);
      }, 10000);

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

  // Message Interval
  useEffect(() => {
    if (breathingActive && !showWelcome && !isPaused && (sessionPhase === 1 || sessionPhase === 2)) {
      messageIntervalRef.current = setInterval(() => {
        setCurrentMessage(prev => {
          let messagesArray = sessionPhase === 1 ? mindfulnessMessages.breathing : mindfulnessMessages.reflection;
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

  // Breathing & Timer Logic
  useEffect(() => {
    if (breathingActive && !showWelcome && !isPaused) {
      mainIntervalRef.current = setInterval(() => {
        setTotalSessionTime(prev => prev + 1);
      }, 1000);

      if (sessionPhase === 1) {
        phaseTimeoutRef.current = setInterval(() => {
          setBreathingCount(prev => {
            const newCount = prev + 1;
            const cycle = newCount % 12;

            if (cycle <= 4) setBreathingPhase('inhale');
            else if (cycle <= 8) setBreathingPhase('hold');
            else setBreathingPhase('exhale');

            if (newCount >= 120) {
              finishSession();
              return 0;
            }
            return newCount;
          });
        }, 1000);

        Animated.loop(
          Animated.sequence([
            Animated.timing(breathingAnim, {
              toValue: 1.4,
              duration: 4000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(breathingAnim, {
              toValue: 1.4, // Hold
              duration: 4000,
              useNativeDriver: true,
            }),
            Animated.timing(breathingAnim, {
              toValue: 1,
              duration: 4000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    }

    return () => {
      if (phaseTimeoutRef.current) clearInterval(phaseTimeoutRef.current);
      if (mainIntervalRef.current) clearInterval(mainIntervalRef.current);
    };
  }, [breathingActive, sessionPhase, isPaused]);

  // --- Helper Functions ---

  const getRandomMessage = (messagesArray, currentIndex) => {
    if (messagesArray.length <= 1) return 0;
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * messagesArray.length);
    } while (randomIndex === currentIndex);
    return randomIndex;
  };

  const startMindfulnessSession = async () => {
    setShowWelcome(false);
    setBreathingActive(true);
    setIsPaused(false);
    setSessionPhase(0);
    const randomPrepIndex = Math.floor(Math.random() * mindfulnessMessages.preparation.length);
    setCurrentMessage(randomPrepIndex);
    setBreathingCount(0);
    setBreathingPhase('preparation');
    setLastPlayedSound(null);
  };

  const finishSession = async () => {
    try {
      setBreathingActive(false);
      setIsPaused(true);

      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
      if (mainIntervalRef.current) clearInterval(mainIntervalRef.current);
      if (phaseTimeoutRef.current) clearInterval(phaseTimeoutRef.current);

      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      if (backgroundMusic) {
        await backgroundMusic.stopAsync();
        await backgroundMusic.unloadAsync();
        setBackgroundMusic(null);
      }

      // Quick audio reset
      await Audio.setIsEnabledAsync(false);
      await new Promise(resolve => setTimeout(resolve, 50));
      await Audio.setIsEnabledAsync(true);

    } catch (error) {
      console.log('Error in finishSession:', error);
    }

    navigation.navigate('SOSFeedback', {
      sessionDuration: totalSessionTime,
      sessionType: 'mindfulness',
      completedPhases: sessionPhase + 1
    });
  };

  const getCurrentMessage = () => {
    if (showWelcome) {
      return mindfulnessMessages.welcome[currentMessage % mindfulnessMessages.welcome.length];
    }

    let messages;
    switch (sessionPhase) {
      case 0: messages = mindfulnessMessages.preparation; break;
      case 1: messages = mindfulnessMessages.breathing; break;
      default: return 'Breathe naturally';
    }

    const currentMessageData = messages[currentMessage % messages.length];

    if (currentMessageData?.sound && currentMessageData.sound !== lastPlayedSound) {
      setLastPlayedSound(currentMessageData.sound);
      playMessageSound(currentMessageData.sound);
    }

    return typeof currentMessageData === 'object' ? currentMessageData.message : currentMessageData;
  };

  const playMessageSound = async (soundPath) => {
    if (Platform.OS === 'web') return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      const filename = soundPath.split('/').pop();
      let audioSource;

      // --- Audio Mapping (Preserved) ---
      try {
        if (soundPath.includes('preparation/')) {
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

        if (audioSource) {
          const { sound: newSound } = await Audio.Sound.createAsync(
            audioSource,
            { shouldPlay: false, isLooping: false, volume: 0.7 }
          );
          await newSound.playAsync();
          setSound(newSound);
        }
      } catch (error) {
        console.log('Error playing sound:', error);
      }
    } catch (error) {
      console.log('Error setting audio mode:', error);
    }
  };

  const animateMessageChange = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  };

  const handleCallHelp = () => {
    Alert.alert(
      'Emergency Help',
      'Who would you like to call?',
      [
        { text: 'Crisis Line (988)', onPress: () => Linking.openURL('tel:988') },
        { text: 'Emergency (911)', onPress: () => Linking.openURL('tel:911') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#F3E5F5', '#E3F2FD', '#FCE4EC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />

      <SafeAreaView style={styles.safeArea}>
        {showWelcome ? (
          <Animated.View style={[styles.welcomeContainer, { opacity: welcomeAnim }]}>
            <Animated.View style={{
              transform: [{
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -15]
                })
              }]
            }}>
              <View style={styles.welcomeIconContainer}>
                <Ionicons name="heart" size={80} color="#EC407A" />
              </View>
              <Text style={styles.welcomeText}>
                {getCurrentMessage()}
              </Text>
              <Text style={styles.subWelcomeText}>Breathe with me...</Text>
            </Animated.View>
          </Animated.View>
        ) : (
          <View style={styles.sessionContainer}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                <Ionicons name="close" size={24} color="#546E7A" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Calm Session</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Main Content */}
            <View style={styles.content}>
              <Animated.View style={[
                styles.breathingCircle,
                {
                  transform: [{ scale: breathingAnim }]
                }
              ]}>
                <LinearGradient
                  colors={['#E1BEE7', '#F8BBD9']}
                  style={styles.circleGradient}
                >
                  <View style={styles.innerCircle} />
                </LinearGradient>
              </Animated.View>

              <Animated.Text style={[styles.messageText, { opacity: fadeAnim }]}>
                {getCurrentMessage()}
              </Animated.Text>

              <Text style={styles.instructionText}>
                {breathingPhase === 'inhale' ? 'Inhale...' :
                  breathingPhase === 'hold' ? 'Hold...' :
                    breathingPhase === 'exhale' ? 'Exhale...' : 'Relax...'}
              </Text>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              <TouchableOpacity style={styles.finishButton} onPress={finishSession}>
                <Text style={styles.finishButtonText}>I'm feeling better</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.helpButton} onPress={handleCallHelp}>
                <Text style={styles.helpButtonText}>Call Help</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

// --- Styles ---
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

  // Welcome Screen
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  welcomeIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    alignSelf: 'center',
    shadowColor: "#EC407A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#455A64',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  subWelcomeText: {
    fontSize: 18,
    color: '#78909C',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Session Screen
  sessionContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#546E7A',
  },
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  breathingCircle: {
    width: 260,
    height: 260,
    borderRadius: 130,
    marginBottom: 50,
    shadowColor: "#AB47BC",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 15,
  },
  circleGradient: {
    flex: 1,
    borderRadius: 130,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  messageText: {
    fontSize: 22,
    fontWeight: '500',
    color: '#37474F',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 32,
  },
  instructionText: {
    fontSize: 18,
    color: '#78909C',
    fontWeight: '400',
    letterSpacing: 1,
  },

  // Controls
  controls: {
    padding: 30,
    alignItems: 'center',
  },
  finishButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  finishButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5C6BC0',
  },
  helpButton: {
    paddingVertical: 12,
  },
  helpButtonText: {
    fontSize: 16,
    color: '#EF5350',
    fontWeight: '500',
  },
});

// Background Music List
const backgroundMusicList = [
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

function getRandomMusicIndex(currentIndex) {
  if (backgroundMusicList.length <= 1) return 0;
  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * backgroundMusicList.length);
  } while (randomIndex === currentIndex);
  return randomIndex;
}

export default SOSScreen;