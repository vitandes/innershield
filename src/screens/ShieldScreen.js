import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ShieldScreen = () => {
  const [vulnerabilityModalVisible, setVulnerabilityModalVisible] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);
  
  const vulnerabilities = [
    { id: 1, name: 'Work stress', level: 'High', color: '#F44336' },
    { id: 2, name: 'Social anxiety', level: 'Medium', color: '#FF9800' },
    { id: 3, name: 'Perfectionism', level: 'Medium', color: '#FF9800' },
    { id: 4, name: 'Self-criticism', level: 'Low', color: '#4CAF50' },
  ];

  const trainingPrograms = [
    {
      id: 1,
      title: 'Stress Management',
      description: 'Techniques to reduce daily stress',
      duration: '15 min',
      icon: 'leaf',
      color: '#4CAF50',
      completed: false,
    },
    {
      id: 2,
      title: 'Social Confidence',
      description: 'Exercises to improve social interaction',
      duration: '20 min',
      icon: 'people',
      color: '#2196F3',
      completed: true,
    },
    {
      id: 3,
      title: 'Self-Compassion',
      description: 'Develop a kinder relationship with yourself',
      duration: '12 min',
      icon: 'heart',
      color: '#E91E63',
      completed: false,
    },
    {
      id: 4,
      title: 'Daily Mindfulness',
      description: 'Mindfulness practice for everyday life',
      duration: '10 min',
      icon: 'eye',
      color: '#9C27B0',
      completed: false,
    },
  ];

  const handleStartTraining = (training) => {
    Alert.alert(
      'Start Training',
      `Do you want to start "${training.title}"?\n\nDuration: ${training.duration}\n${training.description}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start', 
          onPress: () => {
            Alert.alert(
              '🎯 Training Started',
              `You have started "${training.title}". Follow the instructions and take your time.`,
              [{ text: 'Continue' }]
            );
          }
        },
      ]
    );
  };

  const VulnerabilityScanner = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={vulnerabilityModalVisible}
      onRequestClose={() => setVulnerabilityModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Vulnerability Scanner</Text>
            <TouchableOpacity
              onPress={() => setVulnerabilityModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <Text style={styles.modalDescription}>
              These are the areas that require more attention in your mental wellbeing:
            </Text>
            
            {vulnerabilities.map((vulnerability) => (
              <View key={vulnerability.id} style={styles.vulnerabilityItem}>
                <View style={styles.vulnerabilityInfo}>
                  <Text style={styles.vulnerabilityName}>{vulnerability.name}</Text>
                  <View style={[styles.levelBadge, { backgroundColor: vulnerability.color }]}>
                    <Text style={styles.levelText}>{vulnerability.level}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>Work on this</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Build Your Shield</Text>
          <Text style={styles.headerSubtitle}>
            Strengthen your mental resilience with personalized training
          </Text>
        </View>

        {/* Vulnerability Scanner */}
        <View style={styles.scannerSection}>
          <Text style={styles.sectionTitle}>Vulnerability Scanner</Text>
          <TouchableOpacity
            style={styles.scannerCard}
            onPress={() => setVulnerabilityModalVisible(true)}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF8E8E']}
              style={styles.scannerGradient}
            >
              <Ionicons name="scan" size={40} color="white" />
              <View style={styles.scannerInfo}>
                <Text style={styles.scannerTitle}>Analyze Vulnerabilities</Text>
                <Text style={styles.scannerDescription}>
                  Identify areas for improvement in your wellbeing
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Resilience Training */}
        <View style={styles.trainingSection}>
          <Text style={styles.sectionTitle}>Resilience Training</Text>
          <Text style={styles.sectionDescription}>
            Programs designed to strengthen your mental wellbeing
          </Text>
          
          {trainingPrograms.map((program) => (
            <TouchableOpacity
              key={program.id}
              style={styles.trainingCard}
              onPress={() => handleStartTraining(program)}
            >
              <View style={styles.trainingContent}>
                <View style={[styles.trainingIcon, { backgroundColor: program.color }]}>
                  <Ionicons name={program.icon} size={24} color="white" />
                </View>
                
                <View style={styles.trainingInfo}>
                  <View style={styles.trainingHeader}>
                    <Text style={styles.trainingTitle}>{program.title}</Text>
                    {program.completed && (
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    )}
                  </View>
                  <Text style={styles.trainingDescription}>{program.description}</Text>
                  <Text style={styles.trainingDuration}>{program.duration}</Text>
                </View>
                
                <Ionicons name="play-circle-outline" size={28} color={program.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Progress Summary */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>3</Text>
              <Text style={styles.progressLabel}>Training\nCompleted</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>75%</Text>
              <Text style={styles.progressLabel}>Shield\nLevel</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>12</Text>
              <Text style={styles.progressLabel}>Consecutive\nDays</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <VulnerabilityScanner />
    </View>
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
    paddingTop: StatusBar.currentHeight || 44,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  scannerSection: {
    marginBottom: 30,
  },
  scannerCard: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  scannerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  scannerDescription: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  trainingSection: {
    marginBottom: 30,
  },
  trainingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  trainingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  trainingIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trainingInfo: {
    flex: 1,
    marginLeft: 15,
  },
  trainingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  trainingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  trainingDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  trainingDuration: {
    fontSize: 12,
    color: '#999',
  },
  progressSection: {
    marginBottom: 20,
  },
  progressCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  progressDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  vulnerabilityItem: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  vulnerabilityInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  vulnerabilityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ShieldScreen;