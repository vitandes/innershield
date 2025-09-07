import React, { useState } from 'react';
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

const { width } = Dimensions.get('window');

const InsightsScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  
  const periods = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
  ];

  const wellnessMetrics = {
    week: {
      shieldLevel: 75,
      moodAverage: 7.2,
      activeDays: 5,
      completedExercises: 12,
      trend: 'up',
    },
    month: {
      shieldLevel: 68,
      moodAverage: 6.8,
      activeDays: 22,
      completedExercises: 45,
      trend: 'up',
    },
    year: {
      shieldLevel: 72,
      moodAverage: 7.0,
      activeDays: 280,
      completedExercises: 520,
      trend: 'stable',
    },
  };

  const moodData = [
    { day: 'Mon', mood: 6, color: '#FF9800' },
    { day: 'Tue', mood: 8, color: '#4CAF50' },
    { day: 'Wed', mood: 7, color: '#4CAF50' },
    { day: 'Thu', mood: 5, color: '#FF9800' },
    { day: 'Fri', mood: 9, color: '#4CAF50' },
    { day: 'Sat', mood: 8, color: '#4CAF50' },
    { day: 'Sun', mood: 7, color: '#4CAF50' },
  ];

  const achievements = [
    {
      id: 1,
      title: '7-Day Streak',
      description: 'Completed check-ins for 7 consecutive days',
      icon: 'flame',
      color: '#FF5722',
      earned: true,
      date: '2024-01-15',
    },
    {
      id: 2,
      title: 'Breathing Master',
      description: 'Completed 50 breathing exercises',
      icon: 'leaf',
      color: '#4CAF50',
      earned: true,
      date: '2024-01-10',
    },
    {
      id: 3,
      title: 'Strong Shield',
      description: 'Kept your shield above 70% for a month',
      icon: 'shield',
      color: '#2196F3',
      earned: false,
      progress: 85,
    },
    {
      id: 4,
      title: 'Wellness Explorer',
      description: 'Tried all available tools',
      icon: 'compass',
      color: '#9C27B0',
      earned: false,
      progress: 60,
    },
  ];

  const insights = [
    {
      id: 1,
      type: 'positive',
      title: 'Excellent progress',
      description: 'Your shield level has improved 15% this week. Keep it up!',
      icon: 'trending-up',
    },
    {
      id: 2,
      type: 'suggestion',
      title: 'Improvement opportunity',
      description: 'Thursdays seem to be more challenging. Consider scheduling extra exercises that day.',
      icon: 'bulb',
    },
    {
      id: 3,
      type: 'milestone',
      title: 'Next milestone',
      description: 'You are only 3 days away from completing your first 30-day streak.',
      icon: 'flag',
    },
  ];

  const currentMetrics = wellnessMetrics[selectedPeriod];

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
          <View style={styles.moodChart}>
            {moodData.map((data, index) => (
              <View key={index} style={styles.moodBar}>
                <View
                  style={[
                    styles.moodBarFill,
                    {
                      height: `${data.mood * 10}%`,
                      backgroundColor: data.color,
                    },
                  ]}
                />
                <Text style={styles.moodBarLabel}>{data.day}</Text>
                <Text style={styles.moodBarValue}>{data.mood}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Insights */}
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Personalized Insights</Text>
          {insights.map((insight) => (
            <View key={insight.id} style={styles.insightCard}>
              <View style={[styles.insightIcon, { backgroundColor: getInsightColor(insight.type) }]}>
                <Ionicons name={insight.icon} size={20} color="white" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightDescription}>{insight.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Achievements */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.achievementsContainer}>
              {achievements.map((achievement) => (
                <View key={achievement.id} style={styles.achievementCard}>
                  <View
                    style={[
                      styles.achievementIcon,
                      {
                        backgroundColor: achievement.earned ? achievement.color : '#E0E0E0',
                      },
                    ]}
                  >
                    <Ionicons
                      name={achievement.icon}
                      size={24}
                      color={achievement.earned ? 'white' : '#999'}
                    />
                  </View>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  <Text style={styles.achievementDescription}>
                    {achievement.description}
                  </Text>
                  {achievement.earned ? (
                    <Text style={styles.achievementDate}>
                      Earned: {achievement.date}
                    </Text>
                  ) : (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${achievement.progress}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>{achievement.progress}%</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
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
  moodChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    height: 150,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  moodBar: {
    alignItems: 'center',
    flex: 1,
  },
  moodBarFill: {
    width: 20,
    backgroundColor: '#4CAF50',
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
  achievementsSection: {
    marginBottom: 20,
  },
  achievementsContainer: {
    flexDirection: 'row',
  },
  achievementCard: {
    width: 200,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 16,
  },
  achievementDate: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '500',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#666',
  },
});

export default InsightsScreen;