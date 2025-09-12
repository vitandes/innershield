import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateShieldLevel, updateMoodAverage } from '../utils/statsUtils';

const JournalScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [currentEntry, setCurrentEntry] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);

  // Cargar entradas guardadas al iniciar
  useEffect(() => {
    const loadEntries = async () => {
      try {
        const storedEntries = await AsyncStorage.getItem('journalEntries');
        if (storedEntries) {
          setJournalEntries(JSON.parse(storedEntries));
        }
      } catch (error) {
        console.error('Error loading journal entries:', error);
      }
    };
    
    loadEntries();
  }, []);

  const moods = [
    { id: 'happy', emoji: '😊', label: 'Happy', color: '#4CAF50', value: 10 },
    { id: 'calm', emoji: '😌', label: 'Calm', color: '#2196F3', value: 8 },
    { id: 'anxious', emoji: '😰', label: 'Anxious', color: '#FF9800', value: 4 },
    { id: 'sad', emoji: '😢', label: 'Sad', color: '#9C27B0', value: 3 },
    { id: 'stressed', emoji: '😤', label: 'Stressed', color: '#F44336', value: 2 },
    { id: 'grateful', emoji: '🙏', label: 'Grateful', color: '#E91E63', value: 9 }
  ];

  const prompts = [
    "What am I grateful for today?",
    "How did I take care of myself today?",
    "What challenged me and how did I handle it?",
    "What made me smile today?",
    "What would I like to improve tomorrow?",
    "How am I feeling right now?"
  ];

  const handleSaveEntry = async () => {
    if (!currentEntry.trim()) {
      Alert.alert('Empty Entry', 'Please write something before saving.');
      return;
    }

    if (!selectedMood) {
      Alert.alert('Select Mood', 'Please select how you\'re feeling today.');
      return;
    }

    const newEntry = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      mood: selectedMood,
      entry: currentEntry,
      time: new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    const updatedEntries = [newEntry, ...journalEntries];
    setJournalEntries(updatedEntries);
    setCurrentEntry('');
    setSelectedMood(null);
    
    try {
      // Guardar entradas en AsyncStorage
      await AsyncStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
      
      // Actualizar datos de ánimo para el día actual
      const selectedMoodOption = moods.find(m => m.id === selectedMood);
      const moodValue = selectedMoodOption ? selectedMoodOption.value : 5;
      
      // Obtener día de la semana actual
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = days[new Date().getDay()];
      
      // Actualizar datos de ánimo para el día actual
      const storedMoodData = await AsyncStorage.getItem('moodData');
      let moodData = storedMoodData ? JSON.parse(storedMoodData) : [];
      
      // Buscar la entrada de hoy y actualizarla
      const todayIndex = moodData.findIndex(item => item.day === today);
      if (todayIndex !== -1) {
        moodData[todayIndex].mood = moodValue;
        moodData[todayIndex].color = selectedMoodOption.color;
      }
      
      await AsyncStorage.setItem('moodData', JSON.stringify(moodData));
      
      // Actualizar métricas de bienestar
      const storedMetrics = await AsyncStorage.getItem('wellnessMetrics');
      let metrics = storedMetrics ? JSON.parse(storedMetrics) : {
        week: { shieldLevel: 0, moodAverage: 0, activeDays: 0, completedExercises: 0, trend: 'stable' },
        month: { shieldLevel: 0, moodAverage: 0, activeDays: 0, completedExercises: 0, trend: 'stable' },
        year: { shieldLevel: 0, moodAverage: 0, activeDays: 0, completedExercises: 0, trend: 'stable' },
      };
      
      // Actualizar nivel de escudo y promedio de ánimo
      await updateShieldLevel();
      await updateMoodAverage();
      
      Alert.alert(
        'Entry Saved! 📝',
        'Your journal entry has been saved successfully.',
        [{ text: 'Great!' }]
      );
    } catch (error) {
      console.error('Error saving journal entry:', error);
      Alert.alert('Error', 'Failed to save your journal entry. Please try again.');
    }
  };

  const handlePromptSelect = (prompt) => {
    setCurrentEntry(currentEntry + (currentEntry ? '\n\n' : '') + prompt + '\n');
  };

  const getMoodEmoji = (moodId) => {
    const mood = moods.find(m => m.id === moodId);
    return mood ? mood.emoji : '😊';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Journal</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <LinearGradient colors={['#F3E5F5', '#E1BEE7']} style={styles.welcomeCard}>
            <Ionicons name="book" size={32} color="#7B1FA2" />
            <Text style={styles.welcomeTitle}>Daily Reflection</Text>
            <Text style={styles.welcomeText}>
              Take a moment to reflect on your day and capture your thoughts.
            </Text>
          </LinearGradient>
        </View>

        {/* Mood Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>How are you feeling?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.moodsContainer}>
              {moods.map((mood) => (
                <TouchableOpacity
                  key={mood.id}
                  style={[
                    styles.moodButton,
                    selectedMood === mood.id && { 
                      backgroundColor: mood.color,
                      transform: [{ scale: 1.1 }]
                    }
                  ]}
                  onPress={() => setSelectedMood(mood.id)}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={[
                    styles.moodLabel,
                    selectedMood === mood.id && { color: 'white', fontWeight: 'bold' }
                  ]}>
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Writing Prompts */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Writing Prompts</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.promptsContainer}>
              {prompts.map((prompt, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.promptCard}
                  onPress={() => handlePromptSelect(prompt)}
                >
                  <Ionicons name="bulb-outline" size={16} color="#FF9800" />
                  <Text style={styles.promptText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Text Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Entry</Text>
          <TextInput
            style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
            multiline
            numberOfLines={8}
            placeholder="What's on your mind today? Share your thoughts, feelings, or experiences..."
            placeholderTextColor={colors.textSecondary}
            value={currentEntry}
            onChangeText={setCurrentEntry}
            textAlignVertical="top"
          />
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveEntry}>
            <LinearGradient colors={['#BA68C8', '#9C27B0']} style={styles.saveGradient}>
              <Ionicons name="save" size={20} color="white" />
              <Text style={styles.saveButtonText}>Save Entry</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Previous Entries */}
        {journalEntries.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Previous Entries</Text>
            {journalEntries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryDateContainer}>
                    <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                    <Text style={styles.entryTime}>{entry.time}</Text>
                  </View>
                  <Text style={styles.entryMood}>{getMoodEmoji(entry.mood)}</Text>
                </View>
                <Text style={styles.entryText}>{entry.entry}</Text>
              </View>
            ))}
          </View>
        )}
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
  scrollContent: {
    paddingBottom: 30,
  },
  welcomeSection: {
    padding: 20,
  },
  welcomeCard: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B1FA2',
    marginTop: 10,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#8E24AA',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  moodsContainer: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  moodButton: {
    alignItems: 'center',
    padding: 12,
    marginRight: 15,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    minWidth: 70,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    color: '#666',
  },
  promptsContainer: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  promptCard: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 12,
    marginRight: 15,
    minWidth: 180,
    maxWidth: 250,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptText: {
    fontSize: 12,
    color: '#E65100',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 16,
    flexWrap: 'wrap',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    minHeight: 120,
    backgroundColor: '#FAFAFA',
    marginBottom: 15,
  },
  saveButton: {
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#9C27B0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  entryCard: {
    backgroundColor: '#FAFAFA',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#BA68C8',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  entryDateContainer: {
    flex: 1,
  },
  entryDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  entryTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  entryMood: {
    fontSize: 24,
  },
  entryText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
});

export default JournalScreen;