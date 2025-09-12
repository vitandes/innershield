import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Utility functions for calculating and updating user statistics
 */

/**
 * Calculate weighted statistics based on user's days in app
 * @param {string} period - 'week', 'month', or 'year'
 * @returns {Object} - Weighted metrics for the specified period
 */
export const calculateWeightedStats = async (period) => {
  try {
    // Get app installation date or first usage date
    let appStartDate = await AsyncStorage.getItem('appStartDate');
    if (!appStartDate) {
      // If no start date, set it to today (first time user)
      appStartDate = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem('appStartDate', appStartDate);
    }
    
    const startDate = new Date(appStartDate);
    const today = new Date();
    const totalDaysInApp = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // Define period limits
    const periodLimits = {
      week: 7,
      month: 30,
      year: 365
    };
    
    const periodLimit = periodLimits[period];
    const effectiveDays = Math.min(totalDaysInApp, periodLimit);
    
    // Get current metrics
    const storedMetrics = await AsyncStorage.getItem('wellnessMetrics');
    const metrics = storedMetrics ? JSON.parse(storedMetrics) : {
      week: { shieldLevel: 0, moodAverage: 0, activeDays: 0, completedExercises: 0, trend: 'stable' },
      month: { shieldLevel: 0, moodAverage: 0, activeDays: 0, completedExercises: 0, trend: 'stable' },
      year: { shieldLevel: 0, moodAverage: 0, activeDays: 0, completedExercises: 0, trend: 'stable' }
    };
    
    const currentMetrics = metrics[period];
    
    // Calculate weighted values based on actual usage days
    const weightedMetrics = {
      ...currentMetrics,
      // Adjust active days to show percentage of period used
      activeDays: Math.min(currentMetrics.activeDays, effectiveDays),
      // Weight exercises based on days in app
      completedExercises: currentMetrics.completedExercises,
      // Add usage efficiency metric
      usageEfficiency: effectiveDays > 0 ? Math.round((currentMetrics.activeDays / effectiveDays) * 100) : 0,
      totalDaysInApp: totalDaysInApp,
      effectiveDays: effectiveDays
    };
    
    return weightedMetrics;
  } catch (error) {
    console.error('Error calculating weighted stats:', error);
    return null;
  }
};

/**
 * Calculate shield level based on user activities
 * Shield level is a percentage (0-100) that represents the user's overall wellness engagement
 * @param {Object} activities - Object containing counts of different activities
 * @returns {Number} - Shield level percentage (0-100)
 */
export const calculateShieldLevel = async () => {
  try {
    // Get current metrics and activities data
    const storedMetrics = await AsyncStorage.getItem('wellnessMetrics');
    const metrics = storedMetrics ? JSON.parse(storedMetrics) : null;
    
    if (!metrics) return 0;
    
    // Get activity counts from various sources
    const activeDaysWeek = metrics.week.activeDays || 0;
    const completedExercises = metrics.week.completedExercises || 0;
    
    // Get journal entries count
    const journalEntries = await AsyncStorage.getItem('journalEntries');
    const journalCount = journalEntries ? JSON.parse(journalEntries).length : 0;
    
    // Get completed daily missions
    const dailyMissions = await AsyncStorage.getItem('dailyMissions');
    const completedMissions = dailyMissions ? 
      JSON.parse(dailyMissions).filter(mission => mission.completed).length : 0;
    
    // Calculate shield level based on a point system
    // Maximum possible points in a week:
    // - Active days: 7 days * 10 points = 70 points
    // - Breathing exercises: ~10 exercises * 5 points = 50 points
    // - Journal entries: ~7 entries * 5 points = 35 points
    // - Daily missions: ~14 missions * 3 points = 42 points
    // - Sleep melodies: ~7 uses * 3 points = 21 points
    // Total maximum: ~218 points
    
    // Points allocation
    const activeDaysPoints = activeDaysWeek * 10; // 10 points per active day
    const exercisesPoints = completedExercises * 5; // 5 points per breathing exercise
    const journalPoints = journalCount * 5; // 5 points per journal entry
    const missionsPoints = completedMissions * 3; // 3 points per completed mission
    
    // Get sleep melody usage
    const sleepUsage = await AsyncStorage.getItem('sleepMelodyUsage');
    const sleepCount = sleepUsage ? JSON.parse(sleepUsage) : 0;
    const sleepPoints = sleepCount * 3; // 3 points per sleep melody usage
    
    // Calculate total points
    const totalPoints = activeDaysPoints + exercisesPoints + journalPoints + missionsPoints + sleepPoints;
    
    // Convert to percentage (max 100%)
    // Using 200 as the denominator to make it challenging but achievable
    const shieldLevel = Math.min(Math.round((totalPoints / 200) * 100), 100);
    
    return shieldLevel;
  } catch (error) {
    console.error('Error calculating shield level:', error);
    return 0;
  }
};

/**
 * Función centralizada para actualizar todos los logros del usuario
 * @returns {Promise<void>}
 */
export const updateAchievements = async () => {
  try {
    const storedAchievements = await AsyncStorage.getItem('achievements');
    if (!storedAchievements) return;
    
    const achievements = JSON.parse(storedAchievements);
    let achievementsUpdated = false;
    
    // Update Strong Shield achievement
    const shieldLevel = await calculateShieldLevel();
    const strongShieldAchievement = achievements.find(a => a.id === 3);
    
    if (strongShieldAchievement && !strongShieldAchievement.earned) {
      if (shieldLevel >= 70) {
        const newProgress = Math.min(strongShieldAchievement.progress + (100/30), 100); // 30 days for shield
        strongShieldAchievement.progress = newProgress;
        
        if (newProgress >= 100) {
          strongShieldAchievement.earned = true;
          strongShieldAchievement.date = new Date().toISOString().split('T')[0];
        }
        achievementsUpdated = true;
      } else {
        if (strongShieldAchievement.progress > 0) {
          strongShieldAchievement.progress = 0;
          achievementsUpdated = true;
        }
      }
    }
    
    // Update 7-Day Streak achievement
    const streakAchievement = achievements.find(a => a.id === 1);
    if (streakAchievement && !streakAchievement.earned) {
      const lastCheckIn = await AsyncStorage.getItem('lastActiveDay');
      const today = new Date().toISOString().split('T')[0];
      
      let streakData = await AsyncStorage.getItem('streakData');
      streakData = streakData ? JSON.parse(streakData) : { count: 0, lastDate: null };

      if (lastCheckIn && lastCheckIn !== streakData.lastDate) {
        const lastDate = new Date(streakData.lastDate || 0);
        const currentDate = new Date(lastCheckIn);
        const diffDays = Math.ceil((currentDate - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          streakData.count += 1;
        } else {
          streakData.count = 1;
        }
        streakData.lastDate = lastCheckIn;
        
        const newProgress = Math.min((streakData.count / 7) * 100, 100);
        streakAchievement.progress = newProgress;

        if (newProgress >= 100) {
          streakAchievement.earned = true;
          streakAchievement.date = today;
        }
        await AsyncStorage.setItem('streakData', JSON.stringify(streakData));
        achievementsUpdated = true;
      }
    }
    
    // Update Breathing Master achievement
    const breathingAchievement = achievements.find(a => a.id === 2);
    if (breathingAchievement && !breathingAchievement.earned) {
      const breathingExercisesStr = await AsyncStorage.getItem('breathingExercises');
      const breathingExercises = breathingExercisesStr ? parseInt(breathingExercisesStr) : 0;
      
      const newProgress = Math.min((breathingExercises / 50) * 100, 100);
      breathingAchievement.progress = newProgress;
      
      if (newProgress >= 100) {
        breathingAchievement.earned = true;
        breathingAchievement.date = new Date().toISOString().split('T')[0];
      }
      achievementsUpdated = true;
    }
    
    // Update Wellness Explorer achievement
    const explorerAchievement = achievements.find(a => a.id === 4);
    if (explorerAchievement && !explorerAchievement.earned) {
      const toolsUsed = new Set();
      
      const breathingExercisesStr = await AsyncStorage.getItem('breathingExercises');
      if (breathingExercisesStr && parseInt(breathingExercisesStr) > 0) {
        toolsUsed.add('breathing');
      }
      
      const journalEntries = await AsyncStorage.getItem('journalEntries');
      if (journalEntries && JSON.parse(journalEntries).length > 0) {
        toolsUsed.add('journal');
      }
      
      const sleepUsage = await AsyncStorage.getItem('sleepMelodyUsage');
      if (sleepUsage && parseInt(sleepUsage) > 0) {
        toolsUsed.add('sleep');
      }
      
      const dailyMissions = await AsyncStorage.getItem('dailyMissions');
      if (dailyMissions && JSON.parse(dailyMissions).some(mission => mission.completed)) {
        toolsUsed.add('missions');
      }
      
      const newProgress = Math.min((toolsUsed.size / 4) * 100, 100);
      explorerAchievement.progress = newProgress;
      
      if (newProgress >= 100) {
        explorerAchievement.earned = true;
        explorerAchievement.date = new Date().toISOString().split('T')[0];
      }
      achievementsUpdated = true;
    }
    
    if (achievementsUpdated) {
      await AsyncStorage.setItem('achievements', JSON.stringify(achievements));
    }
    
    return achievements;
  } catch (error) {
    console.error('Error updating achievements:', error);
    return null;
  }
};

/**
 * Update shield level in AsyncStorage
 * @returns {Promise<void>}
 */
export const updateShieldLevel = async () => {
  try {
    // Calculate current shield level
    const shieldLevel = await calculateShieldLevel();
    
    // Get current metrics
    const storedMetrics = await AsyncStorage.getItem('wellnessMetrics');
    let metrics = storedMetrics ? JSON.parse(storedMetrics) : {
      week: { shieldLevel: 0, moodAverage: 0, activeDays: 0, completedExercises: 0, trend: 'stable' },
      month: { shieldLevel: 0, moodAverage: 0, activeDays: 0, completedExercises: 0, trend: 'stable' },
      year: { shieldLevel: 0, moodAverage: 0, activeDays: 0, completedExercises: 0, trend: 'stable' },
    };
    
    // Determine trend
    const previousShieldLevel = metrics.week.shieldLevel;
    let trend = 'stable';
    
    if (shieldLevel > previousShieldLevel) {
      trend = 'up';
    } else if (shieldLevel < previousShieldLevel) {
      trend = 'down';
    }
    
    // Update metrics
    metrics.week.shieldLevel = shieldLevel;
    metrics.week.trend = trend;
    
    // For month and year, we take a weighted average approach
    // Month: 75% previous + 25% current week
    metrics.month.shieldLevel = Math.round(metrics.month.shieldLevel * 0.75 + shieldLevel * 0.25);
    
    // Year: 90% previous + 10% current week
    metrics.year.shieldLevel = Math.round(metrics.year.shieldLevel * 0.9 + shieldLevel * 0.1);
    
    // Update trends for month and year
    if (metrics.month.shieldLevel > previousShieldLevel) {
      metrics.month.trend = 'up';
    } else if (metrics.month.shieldLevel < previousShieldLevel) {
      metrics.month.trend = 'down';
    }
    
    if (metrics.year.shieldLevel > previousShieldLevel) {
      metrics.year.trend = 'up';
    } else if (metrics.year.shieldLevel < previousShieldLevel) {
      metrics.year.trend = 'down';
    }
    
    // Save updated metrics
    await AsyncStorage.setItem('wellnessMetrics', JSON.stringify(metrics));
    
    // Update achievements
    await updateAchievements();
    
    return shieldLevel;
  } catch (error) {
    console.error('Error updating shield level:', error);
    return 0;
  }
};

/**
 * Calculate average mood based on feedback data
 * @returns {Promise<Number>} - Average mood value (1-10)
 */
export const calculateMoodAverage = async () => {
  try {
    // Get mood data from feedback screens
    const moodData = await AsyncStorage.getItem('moodData');
    if (!moodData) return 0;
    
    const moods = JSON.parse(moodData);
    
    // Filter out entries with mood = 0 (no data)
    const validMoods = moods.filter(m => m.mood > 0);
    
    if (validMoods.length === 0) return 0;
    
    // Calculate average
    const sum = validMoods.reduce((total, current) => total + current.mood, 0);
    const average = Math.round(sum / validMoods.length);
    
    return average;
  } catch (error) {
    console.error('Error calculating mood average:', error);
    return 0;
  }
};

/**
 * Update mood average in AsyncStorage
 * @returns {Promise<void>}
 */
export const updateMoodAverage = async () => {
  try {
    // Calculate current mood average
    const moodAverage = await calculateMoodAverage();
    
    // Get current metrics
    const storedMetrics = await AsyncStorage.getItem('wellnessMetrics');
    let metrics = storedMetrics ? JSON.parse(storedMetrics) : {
      week: { shieldLevel: 0, moodAverage: 0, activeDays: 0, completedExercises: 0, trend: 'stable' },
      month: { shieldLevel: 0, moodAverage: 0, activeDays: 0, completedExercises: 0, trend: 'stable' },
      year: { shieldLevel: 0, moodAverage: 0, activeDays: 0, completedExercises: 0, trend: 'stable' },
    };
    
    // Update metrics
    metrics.week.moodAverage = moodAverage;
    
    // For month and year, we take a weighted average approach
    metrics.month.moodAverage = Math.round(metrics.month.moodAverage * 0.75 + moodAverage * 0.25);
    metrics.year.moodAverage = Math.round(metrics.year.moodAverage * 0.9 + moodAverage * 0.1);
    
    // Save updated metrics
    await AsyncStorage.setItem('wellnessMetrics', JSON.stringify(metrics));
    
    return moodAverage;
  } catch (error) {
    console.error('Error updating mood average:', error);
    return 0;
  }
};