import React, { useState, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Image,
  Animated,
  PanResponder,
  Easing,
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
      question: '¿Cuál opción describe mejor tu nivel de estrés?',
      background: require('../../assets/onboarding/fondo1.png'),
      options: [
        { id: 'crisis', text: 'Estoy en crisis', emoji: '😰', value: 4 },
        { id: 'problems', text: 'Estoy teniendo problemas', emoji: '😟', value: 3 },
        { id: 'surviving', text: 'Estoy sobreviviendo', emoji: '😐', value: 2 },
        { id: 'thriving', text: 'Estoy saliendo adelante', emoji: '🙂', value: 1 }
      ]
    },
    {
      id: 1,
      question: '¿Cuál es tu género?',
      background: require('../../assets/onboarding/fondo2.png'),
      options: [
        { id: 'female', text: 'Femenino', emoji: '👩', value: 'female' },
        { id: 'male', text: 'Masculino', emoji: '👨', value: 'male' },
        { id: 'non-binary', text: 'No binario', emoji: '🧑', value: 'non-binary' },
        { id: 'other', text: 'Otro', emoji: '✨', value: 'other' }
      ]
    },
    {
      id: 2,
      question: '¿Con qué frecuencia te sientes abrumado/a?',
      background: require('../../assets/onboarding/fondo3.png'),
      options: [
        { id: 'always', text: 'Siempre o casi siempre', emoji: '😵', value: 4 },
        { id: 'often', text: 'Frecuentemente', emoji: '😓', value: 3 },
        { id: 'sometimes', text: 'A veces', emoji: '😕', value: 2 },
        { id: 'rarely', text: 'Rara vez', emoji: '😌', value: 1 }
      ]
    },
    {
      id: 3,
      question: '¿Cómo calificarías tu calidad de sueño?',
      background: require('../../assets/onboarding/fondo4.png'),
      options: [
        { id: 'terrible', text: 'Terrible, no duermo bien', emoji: '😴', value: 4 },
        { id: 'poor', text: 'Mala, me despierto cansado/a', emoji: '😪', value: 3 },
        { id: 'fair', text: 'Regular, podría mejorar', emoji: '😐', value: 2 },
        { id: 'good', text: 'Buena, duermo bien', emoji: '😊', value: 1 }
      ]
    },
    {
      id: 4,
      question: '¿Qué tan difícil te resulta manejar tus emociones?',
      background: require('../../assets/onboarding/fondo5.png'),
      options: [
        { id: 'very-hard', text: 'Muy difícil, me siento perdido/a', emoji: '😭', value: 4 },
        { id: 'hard', text: 'Difícil, necesito ayuda', emoji: '😢', value: 3 },
        { id: 'manageable', text: 'Manejable con esfuerzo', emoji: '😔', value: 2 },
        { id: 'easy', text: 'Fácil, tengo control', emoji: '😊', value: 1 }
      ]
    },
    {
      id: 5,
      question: '¿Con qué frecuencia practicas autocuidado?',
      background: require('../../assets/onboarding/fondo6.png'),
      options: [
        { id: 'never', text: 'Nunca, no tengo tiempo', emoji: '😞', value: 4 },
        { id: 'rarely', text: 'Rara vez, me olvido', emoji: '😕', value: 3 },
        { id: 'sometimes', text: 'A veces, cuando puedo', emoji: '🙂', value: 2 },
        { id: 'regularly', text: 'Regularmente, es prioritario', emoji: '😌', value: 1 }
      ]
    },
    {
      id: 6,
      question: '¿Qué te motivó a buscar una app de bienestar?',
      background: require('../../assets/onboarding/fondo7.png'),
      options: [
        { id: 'crisis', text: 'Estoy en crisis y necesito ayuda urgente', emoji: '🆘', value: 4 },
        { id: 'struggling', text: 'Estoy luchando y busco apoyo', emoji: '💪', value: 3 },
        { id: 'improve', text: 'Quiero mejorar mi bienestar', emoji: '🌱', value: 2 },
        { id: 'maintain', text: 'Quiero mantener mi salud mental', emoji: '✨', value: 1 }
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
      
      // Navegar a la pantalla principal
      navigation.replace('Main');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      navigation.replace('Main');
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
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>Preparando experiencia...</Text>
          <View style={styles.loadingBar}>
            <View style={styles.loadingProgress} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          <Text style={styles.cardProgressText}>{questionIndex.current + 1} de {questions.length}</Text>
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
    paddingTop: 10,
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