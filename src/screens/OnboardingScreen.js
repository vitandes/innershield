import React, { useState, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
  PanResponder,
  Easing,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const [questionIndex, setQuestionIndex] = useState({ current: 0, previous: 0 });
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [answers, setAnswers] = useState({});
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const backgroundFadeAnim = useRef(new Animated.Value(1)).current;
  const previousImageOpacity = useRef(new Animated.Value(0)).current;

  // Precargar todas las imágenes al inicio
  useLayoutEffect(() => {
    const preloadImages = async () => {
      const imagePromises = questions.map((question) => {
        return new Promise((resolve, reject) => {
          const img = Image.resolveAssetSource(question.background);
          if (img) {
            // Simular carga de imagen
            setTimeout(() => resolve(), 100);
          } else {
            reject();
          }
        });
      });
      
      try {
        await Promise.all(imagePromises);
        setImagesLoaded(true);
      } catch (error) {
        console.log('Error precargando imágenes:', error);
        setImagesLoaded(true); // Continuar aunque haya errores
      }
    };
    
    preloadImages();
  }, []);

  useLayoutEffect(() => {
    if (questionIndex.current !== questionIndex.previous && imagesLoaded) {
      // Mostrar imagen anterior brevemente para crossfade
      previousImageOpacity.setValue(1);
      backgroundFadeAnim.setValue(0);
      
      // Animación de crossfade: imagen anterior se desvanece mientras nueva aparece
      Animated.parallel([
        Animated.timing(previousImageOpacity, {
          toValue: 0,
          duration: 600,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          useNativeDriver: true,
        }),
        Animated.timing(backgroundFadeAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), // Easing suave y natural
          useNativeDriver: true,
        })
      ]).start(() => {
        // Reset previous image opacity after animation
        previousImageOpacity.setValue(0);
      });
    }
  }, [questionIndex.current, imagesLoaded]);


  // Preguntas estratégicas para identificar problemas de bienestar mental
  const questions = [
    {
      id: 0,
      question: 'Which option best describes your stress level?',
      background: require('../../assets/onboarding/fondo1.png'),
      options: [
        { id: 'crisis', text: 'I am in crisis', emoji: '😰', value: 4 },
        { id: 'problems', text: 'I am having problems', emoji: '😟', value: 3 },
        { id: 'surviving', text: 'I am surviving', emoji: '😐', value: 2 },
        { id: 'thriving', text: 'I am thriving', emoji: '🙂', value: 1 }
      ]
    },
    {
      id: 1,
      question: 'What is your gender?',
      background: require('../../assets/onboarding/fondo2.png'),
      options: [
        { id: 'female', text: 'Female', emoji: '👩', value: 'female' },
        { id: 'male', text: 'Male', emoji: '👨', value: 'male' },
        { id: 'non-binary', text: 'Non-binary', emoji: '🧑', value: 'non-binary' },
        { id: 'other', text: 'Other', emoji: '✨', value: 'other' }
      ]
    },
    {
      id: 2,
      question: 'How often do you feel overwhelmed?',
      background: require('../../assets/onboarding/fondo3.png'),
      options: [
        { id: 'always', text: 'Always or almost always', emoji: '😵', value: 4 },
        { id: 'often', text: 'Frequently', emoji: '😓', value: 3 },
        { id: 'sometimes', text: 'Sometimes', emoji: '😕', value: 2 },
        { id: 'rarely', text: 'Rarely', emoji: '😌', value: 1 }
      ]
    },
    {
      id: 3,
      question: 'How would you rate your sleep quality?',
      background: require('../../assets/onboarding/fondo4.png'),
      options: [
        { id: 'terrible', text: 'Terrible, I don\'t sleep well', emoji: '😴', value: 4 },
        { id: 'poor', text: 'Poor, I wake up tired', emoji: '😪', value: 3 },
        { id: 'fair', text: 'Fair, could improve', emoji: '😐', value: 2 },
        { id: 'good', text: 'Good, I sleep well', emoji: '😊', value: 1 }
      ]
    },
    {
      id: 4,
      question: 'How difficult is it for you to manage your emotions?',
      background: require('../../assets/onboarding/fondo5.png'),
      options: [
        { id: 'very-hard', text: 'Very difficult, I feel lost', emoji: '😭', value: 4 },
        { id: 'hard', text: 'Difficult, I need help', emoji: '😢', value: 3 },
        { id: 'manageable', text: 'Manageable with effort', emoji: '😔', value: 2 },
        { id: 'easy', text: 'Easy, I have control', emoji: '😊', value: 1 }
      ]
    },
    {
      id: 5,
      question: 'How often do you practice self-care?',
      background: require('../../assets/onboarding/fondo6.png'),
      options: [
        { id: 'never', text: 'Never, I don\'t have time', emoji: '😞', value: 4 },
        { id: 'rarely', text: 'Rarely, I forget', emoji: '😕', value: 3 },
        { id: 'sometimes', text: 'Sometimes, when I can', emoji: '🙂', value: 2 },
        { id: 'regularly', text: 'Regularly, it\'s a priority', emoji: '😌', value: 1 }
      ]
    },
    {
      id: 6,
      question: 'What motivated you to look for a wellness app?',
      background: require('../../assets/onboarding/fondo7.png'),
      options: [
        { id: 'crisis', text: 'I am in crisis and need urgent help', emoji: '🆘', value: 4 },
        { id: 'struggling', text: 'I am struggling and seeking support', emoji: '💪', value: 3 },
        { id: 'improve', text: 'I want to improve my wellbeing', emoji: '🌱', value: 2 },
        { id: 'maintain', text: 'I want to maintain my mental health', emoji: '✨', value: 1 }
      ]
    }
  ];

  const handleAnswer = (option) => {
    const newAnswers = {
      ...answers,
      [questions[questionIndex.current].id]: {
        questionId: questions[questionIndex.current].id,
        question: questions[questionIndex.current].question,
        selectedOption: option,
        timestamp: new Date().toISOString()
      }
    };
    setAnswers(newAnswers);

    if (questionIndex.current < questions.length - 1) {
      nextQuestion();
    } else {
      completeOnboarding(newAnswers);
    }
  };

  const nextQuestion = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      if (questionIndex.current < questions.length - 1) {

        setQuestionIndex(prev => ({ current: prev.current + 1, previous: prev.current }));
      }
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const previousQuestion = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      if (questionIndex.current > 0) {

        setQuestionIndex(prev => ({ current: prev.current - 1, previous: prev.current }));
      }
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const completeOnboarding = async (finalAnswers) => {
    try {
      // Calcular nivel de riesgo basado en las respuestas
      const riskScore = calculateRiskScore(finalAnswers);
      
      const onboardingData = {
        answers: finalAnswers,
        riskScore,
        completedAt: new Date().toISOString(),
        version: '1.0'
      };

      await AsyncStorage.setItem('onboardingCompleted', 'true');
      await AsyncStorage.setItem('onboardingData', JSON.stringify(onboardingData));
      
      // Navegar a la pantalla de login
      navigation.replace('Login');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      navigation.replace('Login');
    }
  };

  const calculateRiskScore = (answers) => {
    let totalScore = 0;
    let scoredQuestions = 0;

    Object.values(answers).forEach(answer => {
      if (typeof answer.selectedOption.value === 'number') {
        totalScore += answer.selectedOption.value;
        scoredQuestions++;
      }
    });

    return scoredQuestions > 0 ? Math.round(totalScore / scoredQuestions) : 1;
  };

  const currentQuestionData = questions[questionIndex.current];
  const progress = (questionIndex.current / (questions.length - 1)) * 100;

  // Mostrar indicador de carga mientras se precargan las imágenes
  if (!imagesLoaded) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>Preparing experience...</Text>
          <View style={styles.loadingBar}>
            <View style={styles.loadingProgress} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      {/* Banner Superior con Imagen de Fondo */}
      <View style={styles.bannerContainer}>
        {/* Imagen anterior para crossfade */}
        {questionIndex.previous !== questionIndex.current && questions[questionIndex.previous] && (
          <Animated.Image
            source={questions[questionIndex.previous].background}
            style={[
              styles.bannerImage,
              styles.previousBackgroundImage,
              {
                opacity: previousImageOpacity,
              },
            ]}
            resizeMode="cover"
          />
        )}
        
        {/* Imagen actual */}
        <Animated.Image
          source={currentQuestionData.background}
          style={[
            styles.bannerImage,
            {
              opacity: backgroundFadeAnim,
            },
          ]}
          resizeMode="cover"
        />
        
        {/* Header con controles */}
        <View style={styles.header}>
          {questionIndex.current > 0 && (
            <TouchableOpacity onPress={previousQuestion} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
          )}
          
          <View style={styles.placeholder} />
        </View>

        {/* Bear Character en el banner */}
        <View style={styles.bearContainer}>
          <Image 
            source={require('../../assets/onboarding/oso.png')} 
            style={styles.bearImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Tarjeta Blanca con Contenido */}
      <Animated.View style={[styles.cardContainer, { opacity: fadeAnim }]}>
        {/* Progress Bar en la tarjeta */}
        <View style={styles.cardProgressContainer}>
          <View style={styles.cardProgressBar}>
            <View style={[styles.cardProgressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.cardProgressText}>{questionIndex.current + 1} of {questions.length}</Text>
        </View>

        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestionData.question}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {currentQuestionData.options.map((option, index) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionButton}
              onPress={() => handleAnswer(option)}
              activeOpacity={0.8}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <Text style={styles.optionText}>{option.text}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  bannerContainer: {
    width: '100%',
    height: '40%', // Ocupa el 40% de la altura de la pantalla
    overflow: 'hidden',
    
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  previousBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  nextBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: StatusBar.currentHeight || 44,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  progressText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  bearContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 3,
  },
  bearImage: {
    width: 100,
    height: 100,
  },
  cardContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: -25,
    paddingTop: 35,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  cardProgressContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  cardProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 8,
  },
  cardProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  cardProgressText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  questionContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  questionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    lineHeight: 32,
  },
  optionsContainer: {
    paddingHorizontal: 20,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  loadingBar: {
    width: 200,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgress: {
    width: '70%',
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
});

export default OnboardingScreen;