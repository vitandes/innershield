import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { dailyMessages } from '../data/dailyMessages';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = ({ navigation }) => {
  const { colors, styles: themeStyles } = useTheme();

  const [dailyMessage, setDailyMessage] = useState('');

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
          // If no update is needed, load the last used message
          if (usedIndices.length > 0) {
            const lastUsedIndex = usedIndices[usedIndices.length - 1];
            setDailyMessage(dailyMessages[lastUsedIndex]);
          } else {
            // Fallback to a random message if something is wrong
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
    const interval = setInterval(updateDailyMessage, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, []);
  
  // Daily missions state - Updated to reflect only available functionalities
  const [dailyMissions, setDailyMissions] = useState([
    { id: 1, title: 'Breathing exercise', completed: false, icon: 'leaf' },
    { id: 2, title: 'Journal writing', completed: false, icon: 'book' },
    { id: 3, title: 'Sleep melodies', completed: false, icon: 'moon' }
  ]);

  // Load daily missions from AsyncStorage on component mount
  useEffect(() => {
    const loadDailyMissions = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const lastMissionDate = await AsyncStorage.getItem('lastMissionDate');
        
        const defaultMissions = [
          { id: 1, title: 'Breathing exercise', completed: false, icon: 'leaf' },
          { id: 2, title: 'Journal writing', completed: false, icon: 'book' },
          { id: 3, title: 'Sleep melodies', completed: false, icon: 'moon' }
        ];
        
        // Si es un nuevo día o no hay fecha guardada, reiniciar misiones
        if (!lastMissionDate || lastMissionDate !== today) {
          await AsyncStorage.setItem('dailyMissions', JSON.stringify(defaultMissions));
          await AsyncStorage.setItem('lastMissionDate', today);
          setDailyMissions(defaultMissions);
        } else {
          // Cargar misiones existentes del mismo día
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
  }, []);
  
  const completedMissions = dailyMissions.filter(mission => mission.completed).length;
  const totalMissions = dailyMissions.length;
  const progressPercentage = Math.round((completedMissions / totalMissions) * 100);

  const handleSOSPress = () => {
    navigation.navigate('SOS');
  };

  // Function to get progress color
  const getProgressColor = (percentage) => {
    if (percentage >= 80) return '#B39DDB'; // Púrpura
    if (percentage >= 50) return '#F8BBD9'; // Rosa suave
    return '#F44336'; // Rojo
  };

  // Function to toggle mission status and navigate to corresponding screen
  const toggleMission = async (missionId) => {
    const updatedMissions = dailyMissions.map(mission => 
      mission.id === missionId 
        ? { ...mission, completed: !mission.completed }
        : mission
    );
    
    setDailyMissions(updatedMissions);
    
    try {
      // Save updated missions to AsyncStorage
      await AsyncStorage.setItem('dailyMissions', JSON.stringify(updatedMissions));
      
      // Update mood data colors based on completed missions
      const completedCount = updatedMissions.filter(mission => mission.completed).length;
      
      // Get current mood data
      const storedMoodData = await AsyncStorage.getItem('moodData');
      if (storedMoodData) {
        const moodData = JSON.parse(storedMoodData);
        
        // Get current day
        const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const currentDay = dayNames[today];
        
        // Update today's mood data with mission completion
        const updatedMoodData = moodData.map(item => {
          if (item.day === currentDay) {
            let color = '#E0E0E0'; // Default color (gris)
            
            // Assign color based on completed missions
            if (completedCount === 3) {
              color = '#4CAF50'; // Verde para 3 misiones
            } else if (completedCount === 2) {
              color = '#FFC107'; // Amarillo para 2 misiones
            } else if (completedCount === 1 || completedCount === 0) {
              color = '#F44336'; // Rojo para 0-1 misiones
            }
            
            return { ...item, color, completedMissions: completedCount };
          }
          return item;
        });
        
        await AsyncStorage.setItem('moodData', JSON.stringify(updatedMoodData));
      }
    } catch (error) {
      console.error('Error updating missions and mood data:', error);
    }
    
    // Navigate to corresponding screen when mission is activated
    const mission = dailyMissions.find(m => m.id === missionId);
    if (mission && !mission.completed) {
      switch (missionId) {
        case 1: // Breathing exercise
          navigation.navigate('Breathing');
          break;
        case 2: // Journal writing
          navigation.navigate('Journal');
          break;
        case 3: // Sleep melodies
          navigation.navigate('SleepMelodies');
          break;
        default:
          break;
      }
    }
  };



  const handleBreathingGuided = () => {
    navigation.navigate('Breathing');
  };

  const handleGroundingTechniques = () => {
    Alert.alert(
      'Grounding Techniques',
      '5-4-3-2-1 technique to connect with the present:\n\n• 5 things you can SEE\n• 4 things you can TOUCH\n• 3 things you can HEAR\n• 2 things you can SMELL\n• 1 thing you can TASTE',
      [{ text: 'Got it' }]
    );
  };

  const handleMyRecord = () => {
    navigation.navigate('Journal');
  };

  // Funcionalidades comentadas para implementar después
  /*
  const handleVisualization = () => {
    Alert.alert(
      'Visualization',
      'Guided visualization exercises:\n\n🌅 Safe place\n🌊 Beach relaxation\n🏔️ Mountain of calm\n🌸 Garden of peace\n\nChoose a visualization to begin.',
      [{ text: 'Start' }]
    );
  };
  */

  const handleSleepSounds = () => {
    navigation.navigate('SleepMelodies');
  };



  const styles = getStyles(colors);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Personalized greeting */}
        <View style={styles.welcomeSection}>
          <View>
            <Text style={styles.welcomeText}>Hello! 👋</Text>
            <Text style={styles.welcomeSubtext}>Your wellbeing is our priority</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-circle-outline" size={40} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Prominent SOS Button */}
        <TouchableOpacity style={styles.sosButton} onPress={handleSOSPress}>
          <LinearGradient
            colors={['#FF6B6B', '#FF8E8E']}
            style={styles.sosGradient}
          >
            <Ionicons name="warning" size={40} color="white" />
            <Text style={styles.sosButtonText}>SOS</Text>
            <Text style={styles.sosButtonSubtext}>Immediate help</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Daily Missions */}
        <View style={styles.dailyMissionsSection}>
          <View style={styles.missionHeader}>
            <Text style={styles.sectionTitle}>Daily Missions</Text>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: getProgressColor(progressPercentage) }]}>
                <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
              </View>
            </View>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.missionsSlider}
          >
            {dailyMissions.map((mission) => (
              <TouchableOpacity 
                key={mission.id} 
                style={[
                  styles.missionCard,
                  mission.completed && styles.missionCardCompleted
                ]}
                onPress={() => toggleMission(mission.id)}
              >
                <View style={[
                  styles.missionIcon,
                  { backgroundColor: mission.completed ? '#B39DDB' : '#E0E0E0' }
                ]}>
                  <Ionicons 
                    name={mission.completed ? 'checkmark' : mission.icon} 
                    size={20} 
                    color={mission.completed ? 'white' : '#666'} 
                  />
                </View>
                <Text style={[
                  styles.missionTitle,
                  mission.completed && styles.missionTitleCompleted
                ]}>
                  {mission.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <Text style={styles.progressText}>
            {completedMissions} of {totalMissions} missions completed
          </Text>
        </View>

        {/* Main Tools Section */}
        <View style={styles.mainToolsSection}>
          <Text style={styles.sectionTitle}>Start here</Text>
          
          {/* First row */}
           <View style={styles.toolsRow}>
             <TouchableOpacity style={styles.toolCard} onPress={handleBreathingGuided}>
               <LinearGradient colors={['#4FC3F7', '#29B6F6']} style={styles.toolGradient}>
                 <Ionicons name="leaf" size={32} color="white" />
                 <Text style={styles.toolTitle}>Breathe</Text>
               </LinearGradient>
             </TouchableOpacity>
             
             {/* Lessons - Comentado para implementar después */}
             {/*
             <TouchableOpacity style={styles.toolCard} onPress={() => navigation.navigate('Shield')}>
               <LinearGradient colors={['#81C784', '#66BB6A']} style={styles.toolGradient}>
                 <Ionicons name="shield-checkmark" size={32} color="white" />
                 <Text style={styles.toolTitle}>Lessons</Text>
               </LinearGradient>
             </TouchableOpacity>
             */}
             
             <TouchableOpacity style={styles.toolCard} onPress={handleMyRecord}>
               <LinearGradient colors={['#BA68C8', '#AB47BC']} style={styles.toolGradient}>
                 <Ionicons name="book" size={32} color="white" />
                 <Text style={styles.toolTitle}>Journal</Text>
               </LinearGradient>
             </TouchableOpacity>
           </View>
          
          {/* Second row */}
           <View style={styles.toolsRow}>
             {/* Play - Comentado para implementar después */}
             {/*
             <TouchableOpacity style={styles.toolCard} onPress={handleGroundingTechniques}>
               <LinearGradient colors={['#FFB74D', '#FFA726']} style={styles.toolGradient}>
                 <Ionicons name="game-controller" size={32} color="white" />
                 <Text style={styles.toolTitle}>Play</Text>
               </LinearGradient>
             </TouchableOpacity>
             */}
             
             <TouchableOpacity style={styles.toolCard} onPress={handleSleepSounds}>
               <LinearGradient colors={['#5C6BC0', '#3F51B5']} style={styles.toolGradient}>
                 <Ionicons name="moon" size={32} color="white" />
                 <Text style={styles.toolTitle}>Sleep melodies</Text>
               </LinearGradient>
             </TouchableOpacity>
           </View>
          
          {/* Third row - Comentado para implementar después */}
           {/*
           <View style={styles.toolsRow}>
             <TouchableOpacity style={styles.toolCard} onPress={handleVisualization}>
               <LinearGradient colors={['#FF8A65', '#FF7043']} style={styles.toolGradient}>
                 <Ionicons name="eye" size={32} color="white" />
                 <Text style={styles.toolTitle}>Visualize</Text>
               </LinearGradient>
             </TouchableOpacity>
           </View>
           */}
        </View>


        
        {/* Daily Motivational Message */}
          <View style={styles.motivationalSection}>
            <LinearGradient colors={['#E1BEE7', '#CE93D8']} style={styles.motivationalCard}>
              <Ionicons name="heart" size={24} color="#7B1FA2" />
              <Text style={styles.motivationalTitle}>Message of the Day</Text>
              <Text style={styles.motivationalText}>{dailyMessage}</Text>
            </LinearGradient>
          </View>

         

         {/* Wellness reminder */}
         <View style={styles.reminderSection}>
          <View style={styles.reminderCard}>
            <Ionicons name="bulb-outline" size={24} color="#FF9800" />
            <Text style={styles.reminderText}>
              Remember: Small daily steps build a strong shield.
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
  scrollContent: {
    padding: 20,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  // Botón SOS
  sosButton: {
    marginBottom: 25,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sosGradient: {
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosButtonText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  sosButtonSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  // Sección Principal de Herramientas
  mainToolsSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  toolCard: {
    flex: 1,
    marginHorizontal: 8,

    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  toolGradient: {
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 8,
  },

  // Misiones Diarias
  dailyMissionsSection: {
    marginBottom: 25,
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 15,
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  missionsSlider: {
    paddingHorizontal: 5,
    paddingBottom: 15,
  },
  missionCard: {
    width: 120,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginRight: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  missionCardCompleted: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  missionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  missionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  missionTitleCompleted: {
    color: '#4CAF50',
    textDecorationLine: 'line-through',
  },
  progressText: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Mensaje Motivacional
  motivationalSection: {
    marginBottom: 25,
  },
  motivationalCard: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  motivationalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B1FA2',
    marginTop: 8,
    marginBottom: 10,
  },
  motivationalText: {
    fontSize: 16,
    color: '#7B1FA2',
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  // Estadísticas Inferiores
  bottomStatsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  statCard: {
    alignItems: 'center',
    padding: 15,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    
  },
  reminderSection: {
    marginBottom: 20,
  },
  reminderCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  reminderText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#E65100',
    flex: 1,
    lineHeight: 20,
  },
});

export default HomeScreen;