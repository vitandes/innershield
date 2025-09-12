import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateShieldLevel, updateMoodAverage, updateAchievements, calculateWeightedStats } from '../utils/statsUtils';

const { width } = Dimensions.get('window');

const InsightsScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [wellnessMetrics, setWellnessMetrics] = useState(null);
  const [weightedMetrics, setWeightedMetrics] = useState(null);
  const [moodData, setMoodData] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    const initializeData = async () => {
      await initializeWellnessMetrics();
      await initializeMoodData();
      await initializeAchievements();
      await loadData();
    };
    initializeData();
  }, []);

  // Recargar datos cuando la pantalla se enfoque
  useFocusEffect(
    useCallback(() => {
      const updateStats = async () => {
        await initializeMoodData(); // Recalcular colores basados en misiones
        await loadData(); // Recargar datos del estado
      };
      
      updateStats();
    }, [])
  );

  useEffect(() => {
    if (wellnessMetrics) {
      generateInsights();
    }
  }, [wellnessMetrics]);

  // Calculate weighted stats when period changes
  useEffect(() => {
    const loadWeightedStats = async () => {
      const weighted = await calculateWeightedStats(selectedPeriod);
      setWeightedMetrics(weighted);
    };
    
    if (wellnessMetrics) {
      loadWeightedStats();
    }
  }, [selectedPeriod, wellnessMetrics]);

  const loadData = async () => {
    const metrics = await AsyncStorage.getItem('wellnessMetrics');
    const mood = await AsyncStorage.getItem('moodData');
    const ach = await AsyncStorage.getItem('achievements');

    if (metrics) setWellnessMetrics(JSON.parse(metrics));
    if (mood) setMoodData(JSON.parse(mood));
    if (ach) setAchievements(JSON.parse(ach));
  };

  const initializeWellnessMetrics = async () => {
    const defaultMetrics = {
      week: { shieldLevel: 0, moodAverage: 0, activeDays: 0, completedExercises: 0, trend: 'stable' },
      month: { shieldLevel: 0, moodAverage: 0, activeDays: 0, completedExercises: 0, trend: 'stable' },
      year: { shieldLevel: 0, moodAverage: 0, activeDays: 0, completedExercises: 0, trend: 'stable' },
    };
    const storedMetrics = await AsyncStorage.getItem('wellnessMetrics');
    if (!storedMetrics) {
      await AsyncStorage.setItem('wellnessMetrics', JSON.stringify(defaultMetrics));
      
      // Inicializar también el contador de días activos
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem('lastActiveDay', today);
      
      // Inicializar contador de ejercicios completados
      await AsyncStorage.setItem('completedExercises', '0');
    } else {
      // Actualizar día activo si es un nuevo día
      const lastActiveDay = await AsyncStorage.getItem('lastActiveDay');
      const today = new Date().toISOString().split('T')[0];
      
      if (lastActiveDay !== today) {
        await AsyncStorage.setItem('lastActiveDay', today);
        
        // Incrementar contador de días activos
        const metrics = JSON.parse(storedMetrics);
        metrics.week.activeDays += 1;
        metrics.month.activeDays += 1;
        metrics.year.activeDays += 1;
        
        await AsyncStorage.setItem('wellnessMetrics', JSON.stringify(metrics));
      }
    }
  };

  const initializeMoodData = async () => {
    const defaultMoodData = [
      { day: 'Mon', mood: 0, color: '#E0E0E0', completedMissions: 0 },
      { day: 'Tue', mood: 0, color: '#E0E0E0', completedMissions: 0 },
      { day: 'Wed', mood: 0, color: '#E0E0E0', completedMissions: 0 },
      { day: 'Thu', mood: 0, color: '#E0E0E0', completedMissions: 0 },
      { day: 'Fri', mood: 0, color: '#E0E0E0', completedMissions: 0 },
      { day: 'Sat', mood: 0, color: '#E0E0E0', completedMissions: 0 },
      { day: 'Sun', mood: 0, color: '#E0E0E0', completedMissions: 0 },
    ];
    const storedMoodData = await AsyncStorage.getItem('moodData');
    if (!storedMoodData) {
      await AsyncStorage.setItem('moodData', JSON.stringify(defaultMoodData));
    } else {
      // Actualizar colores según las misiones diarias completadas
      const moodData = JSON.parse(storedMoodData);
      
      // Obtener las misiones diarias del día actual
      const dailyMissionsData = await AsyncStorage.getItem('dailyMissions');
      const currentCompletedMissions = dailyMissionsData ? 
        JSON.parse(dailyMissionsData).filter(mission => mission.completed).length : 0;
      
      // Obtener el día actual
      const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const currentDay = dayNames[today];
      
      const updatedMoodData = moodData.map(item => {
        let color = '#E0E0E0'; // Default color (gris)
        let completedMissions = item.completedMissions || 0;
        
        // Si es el día actual, actualizar con las misiones completadas actuales
        if (item.day === currentDay) {
          completedMissions = currentCompletedMissions;
        }
        
        // Asignar color según las misiones completadas
        if (completedMissions === 3) {
          color = '#4CAF50'; // Verde para 3 misiones
        } else if (completedMissions === 2) {
          color = '#FFC107'; // Amarillo para 2 misiones
        } else if (completedMissions === 1 || completedMissions === 0) {
          color = '#F44336'; // Rojo para 0-1 misiones
        }
        
        return { ...item, color, completedMissions };
      });
      
      await AsyncStorage.setItem('moodData', JSON.stringify(updatedMoodData));
    }
  };

  const initializeAchievements = async () => {
    const defaultAchievements = [
      { id: 1, title: '7-Day Streak', description: 'Completed check-ins for 7 consecutive days', icon: 'flame', color: '#FF5722', earned: false, date: null, progress: 0 },
      { id: 2, title: 'Breathing Master', description: 'Completed 50 breathing exercises', icon: 'leaf', color: '#4CAF50', earned: false, date: null, progress: 0 },
      { id: 3, title: 'Strong Shield', description: 'Maintained your shield above 70% for a month', icon: 'shield', color: '#2196F3', earned: false, date: null, progress: 0 },
      { id: 4, title: 'Wellness Explorer', description: 'Tried all available tools', icon: 'compass', color: '#9C27B0', earned: false, date: null, progress: 0 },
    ];
    const storedAchievements = await AsyncStorage.getItem('achievements');
    if (!storedAchievements) {
      await AsyncStorage.setItem('achievements', JSON.stringify(defaultAchievements));
    }
  };

  const generateInsights = () => {
    const newInsights = [];
    const weeklyMetrics = wellnessMetrics.week;

    // Insight about shield level
    if (weeklyMetrics.shieldLevel > 75) {
      newInsights.push({ id: 1, type: 'positive', title: 'Excellent Progress!', description: 'Your shield level is high. Keep it up!', icon: 'trending-up' });
    } else if (weeklyMetrics.shieldLevel > 50) {
      newInsights.push({ id: 1, type: 'positive', title: 'Good Progress', description: 'Your shield level is on the right track. Keep practicing daily exercises.', icon: 'trending-up' });
    } else {
      newInsights.push({ id: 1, type: 'suggestion', title: 'Opportunity for Improvement', description: 'Focus on completing your daily exercises to improve your shield.', icon: 'bulb' });
    }

    // Insight about mood
    if (weeklyMetrics.moodAverage >= 8) {
      newInsights.push({ id: 2, type: 'positive', title: 'Excellent Mood!', description: 'Your mood has been very positive this week.', icon: 'happy' });
    } else if (weeklyMetrics.moodAverage >= 5) {
      newInsights.push({ id: 2, type: 'positive', title: 'Stable Mood', description: 'Your mood has remained stable. Consider practicing more breathing exercises.', icon: 'happy' });
    } else if (weeklyMetrics.moodAverage > 0) {
      newInsights.push({ id: 2, type: 'suggestion', title: 'Take Care of Your Well-being', description: 'Your mood has been low. Try SOS sessions and breathing exercises.', icon: 'medkit' });
    }

    // Insight about challenging days
    const challengingDay = moodData.reduce((prev, curr) => {
      if (curr.mood === 0) return prev;
      return (prev.mood === 0 || prev.mood > curr.mood) ? curr : prev;
    }, { mood: 0 });
    
    if (challengingDay.mood > 0 && challengingDay.mood < 5) {
      newInsights.push({ id: 3, type: 'suggestion', title: 'Challenging Day Identified', description: `${challengingDay.day}s seem to be more challenging. Consider scheduling additional exercises on that day.`, icon: 'calendar' });
    }

    // Insight about achievements
    const streakAchievement = achievements.find(a => a.title === '7-Day Streak');
    if (streakAchievement && !streakAchievement.earned) {
      const daysLeft = 7 - Math.floor(streakAchievement.progress / (100/7));
      if (daysLeft > 0 && daysLeft < 7) {
        newInsights.push({ id: 4, type: 'milestone', title: 'Next Achievement', description: `You are ${daysLeft} days away from a 7-day streak.`, icon: 'flag' });
      }
    }

    // Insight for Breathing Master
    const breathingMasterAchievement = achievements.find(a => a.title === 'Breathing Master');
    if (breathingMasterAchievement && !breathingMasterAchievement.earned && breathingMasterAchievement.progress > 0) {
        const exercisesLeft = 50 - Math.floor(breathingMasterAchievement.progress * 0.5);
        newInsights.push({ id: 5, type: 'milestone', title: 'Breathing On Point!', description: `You're only ${exercisesLeft} breathing exercises away from becoming a Breathing Master!`, icon: 'leaf' });
    }

    // Insight for SOS Sessions
    if (weeklyMetrics.sosSessions > 3) {
        newInsights.push({ id: 6, type: 'suggestion', title: 'High SOS Usage', description: 'We noticed you\'ve used SOS sessions frequently this week. Remember to be kind to yourself.', icon: 'heart' });
    }

    // Insight for Wellness Explorer
    const wellnessExplorerAchievement = achievements.find(a => a.title === 'Wellness Explorer');
    if (wellnessExplorerAchievement && !wellnessExplorerAchievement.earned && wellnessExplorerAchievement.progress > 50) {
        newInsights.push({ id: 7, type: 'milestone', title: 'Almost a Wellness Explorer!', description: 'You are so close to exploring all the tools. Keep it up!', icon: 'compass' });
    }
    
    setInsights(newInsights);
  };

  const periods = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
  ];

  if (!wellnessMetrics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading stats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentMetrics = weightedMetrics || wellnessMetrics[selectedPeriod];

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'remove';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return '#4CAF50';
      case 'down': return '#F44336';
      default: return '#FF9800';
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'positive': return '#4CAF50';
      case 'suggestion': return '#FF9800';
      case 'milestone': return '#2196F3';
      default: return '#666';
    }
  };

  const renderInsight = (insight) => (
    <View key={insight.id} style={styles.insightCard}>
      <View style={[styles.insightIcon, { backgroundColor: getInsightColor(insight.type) }]}>
        <Ionicons name={insight.icon} size={20} color="white" />
      </View>
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>{insight.title}</Text>
        <Text style={styles.insightDescription}>{insight.description}</Text>
      </View>
    </View>
  );



  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Wellness Analysis</Text>
          <Text style={styles.headerSubtitle}>
            Discover patterns and celebrate your progress
          </Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period.key && styles.periodButtonTextActive,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <LinearGradient
                colors={['#4CAF50', '#66BB6A']}
                style={styles.metricGradient}
              >
                <Ionicons name="shield" size={24} color="white" />
                <Text style={styles.metricValue}>{currentMetrics.shieldLevel}%</Text>
                <Text style={styles.metricLabel}>Shield Level</Text>
                <View style={styles.trendContainer}>
                  <Ionicons
                    name={getTrendIcon(currentMetrics.trend)}
                    size={16}
                    color={getTrendColor(currentMetrics.trend)}
                  />
                </View>
              </LinearGradient>
            </View>

            <View style={styles.metricCard}>
              <LinearGradient
                colors={['#2196F3', '#42A5F5']}
                style={styles.metricGradient}
              >
                <Ionicons name="happy" size={24} color="white" />
                <Text style={styles.metricValue}>{currentMetrics.moodAverage}</Text>
                <Text style={styles.metricLabel}>Mood</Text>
                <View style={styles.trendContainer}>
                  <Ionicons
                    name={getTrendIcon(currentMetrics.trend)}
                    size={16}
                    color={getTrendColor(currentMetrics.trend)}
                  />
                </View>
              </LinearGradient>
            </View>

            <View style={styles.metricCard}>
              <LinearGradient
                colors={['#FF9800', '#FFB74D']}
                style={styles.metricGradient}
              >
                <Ionicons name="calendar" size={24} color="white" />
                <Text style={styles.metricValue}>{currentMetrics.activeDays}</Text>
                <Text style={styles.metricLabel}>Active Days</Text>
              </LinearGradient>
            </View>

            <View style={styles.metricCard}>
              <LinearGradient
                colors={['#9C27B0', '#BA68C8']}
                style={styles.metricGradient}
              >
                <Ionicons name="checkmark-circle" size={24} color="white" />
                <Text style={styles.metricValue}>{currentMetrics.completedExercises}</Text>
                <Text style={styles.metricLabel}>Exercises</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Mood Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Weekly Mood</Text>
          <View style={styles.moodChartContainer}>
            {moodData.map((data, index) => {
              // Calcular altura basada en el color
              let heightPercentage;
              if (data.color === '#4CAF50') { // Verde
                heightPercentage = 80;
              } else if (data.color === '#FFC107') { // Amarillo
                heightPercentage = 50;
              } else { // Rojo
                heightPercentage = 25;
              }
              
              return (
                <View key={index} style={styles.moodBarContainer}>
                  <View
                    style={[
                      styles.moodBar,
                      {
                        height: `${heightPercentage}%`,
                        backgroundColor: data.color,
                      },
                    ]}
                  />
                  <Text style={styles.moodBarLabel}>{data.day}</Text>
                  <Text style={styles.moodBarValue}>{data.completedMissions || 0}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Insights */}
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Personalized Insights</Text>
          {insights.length > 0 ? (
            insights.map(renderInsight)
          ) : (
            <Text style={styles.noInsightsText}>No insights available yet. Keep using the app to generate personalized insights.</Text>
          )}
        </View>


      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 20,
  },
  headerSection: {
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 4,
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  periodButtonActive: {
    backgroundColor: '#4CAF50',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: 'white',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  metricsSection: {
    marginBottom: 30,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricGradient: {
    padding: 15,
    alignItems: 'center',
    position: 'relative',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: 'white',
    opacity: 0.9,
    marginTop: 4,
  },
  trendContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 4,
  },
  chartSection: {
    marginBottom: 30,
  },
  moodChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    height: 200,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  moodBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  moodBar: {
    width: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  moodBarLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  moodBarValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  insightsSection: {
    marginBottom: 30,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  insightDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

});

export default InsightsScreen;