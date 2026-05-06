import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ScrollView, Alert
} from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const MOOD_OPTIONS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😰', label: 'Anxious' },
  { emoji: '😡', label: 'Angry' },
];

export default function HomeScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const tailAnim = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    fetchUserData();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 800, useNativeDriver: true
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -15, duration: 600, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(tailAnim, { toValue: 12, duration: 300, useNativeDriver: true }),
        Animated.timing(tailAnim, { toValue: -12, duration: 300, useNativeDriver: true }),
      ])
    ).start();
  };

  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      }
    } catch (error) {
      console.log('Error fetching user data:', error);
    }
  };

  const handleMoodSelect = async (mood) => {
    setSelectedMood(mood);
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          lastMood: mood.label,
          lastMoodTime: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.log('Error saving mood:', error);
    }
  };

  const getDogEmoji = () => {
    const breed = userData?.breed?.id;
    const emojis = {
      golden: '🐕', husky: '🐺', poodle: '🐩',
      shiba: '🦊', labrador: '🐶', corgi: '🐾'
    };
    return emojis[breed] || '🐶';
  };

  const getDogMessage = () => {
    if (!selectedMood) return '💜 Happy to see you!';
    const messages = {
      Happy: '🎉 Yay! Your happiness makes me so excited!',
      Neutral: '🌙 I\'m here with you, always.',
      Sad: '🤗 Come here, let me cheer you up!',
      Anxious: '💜 Take a deep breath. I\'ve got you.',
      Angry: '🌊 Let\'s calm down together, okay?',
    };
    return messages[selectedMood.label] || '💜 I\'m here for you!';
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View style={{ opacity: fadeAnim }}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getTimeGreeting()},</Text>
            <Text style={styles.userName}>
              {userData?.name || auth.currentUser?.displayName || 'Friend'} 👋
            </Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {userData?.streak || 0} Day Streak</Text>
          </View>
        </View>

        {/* Dog Area */}
        <View style={styles.dogArea}>
          <Animated.Text style={[styles.dogEmoji, { transform: [{ translateY: bounceAnim }] }]}>
            {getDogEmoji()}
          </Animated.Text>
          <Animated.Text style={[styles.tailEmoji, { transform: [{ translateX: tailAnim }] }]}>
            🐾
          </Animated.Text>
          <Text style={styles.dogName}>
            {userData?.breed?.name || 'Your Pup'}
          </Text>
          <Text style={styles.dogMessage}>{getDogMessage()}</Text>
        </View>

        {/* Mood Quick Select */}
        <Text style={styles.sectionLabel}>HOW ARE YOU FEELING?</Text>
        <View style={styles.moodRow}>
          {MOOD_OPTIONS.map((mood) => (
            <TouchableOpacity
              key={mood.label}
              style={[styles.moodBtn, selectedMood?.label === mood.label && styles.moodBtnSelected]}
              onPress={() => handleMoodSelect(mood)}>
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Cards */}
        <Text style={styles.sectionLabel}>WHAT WOULD YOU LIKE TO DO?</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Chat')}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionLabel}>Chat with{'\n'}{userData?.breed?.name?.split(' ')[0] || 'Buddy'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Journal')}>
            <Text style={styles.actionIcon}>📔</Text>
            <Text style={styles.actionLabel}>My{'\n'}Journal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.actionCardGame]}
            onPress={() => navigation.navigate('FetchGame')}>
            <Text style={styles.actionIcon}>🎾</Text>
            <Text style={styles.actionLabel}>Play{'\n'}Fetch!</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.actionCardGame]}
            onPress={() => navigation.navigate('TrickGame')}>
            <Text style={styles.actionIcon}>🎭</Text>
            <Text style={styles.actionLabel}>Trick{'\n'}Training</Text>
          </TouchableOpacity>
        </View>

        {/* Mindfulness Tip */}
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>🌙 Daily Mindfulness</Text>
          <Text style={styles.tipText}>
            Take 3 deep breaths. Breathe in for 4 counts, hold for 4, out for 4. You've got this! 💜
          </Text>
        </View>

      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', paddingHorizontal: 20, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 13, color: '#a0a0c0' },
  userName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  streakBadge: { backgroundColor: '#ff9f4322', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#ff9f4366' },
  streakText: { fontSize: 12, fontWeight: '700', color: '#ff9f43' },
  dogArea: {
    backgroundColor: '#16213e', borderRadius: 24, padding: 20,
    alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: '#6c63ff33',
    shadowColor: '#6c63ff', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12,
  },
  dogEmoji: { fontSize: 72 },
  tailEmoji: { fontSize: 24, marginTop: -8 },
  dogName: { fontSize: 16, fontWeight: '700', color: '#6c63ff', marginTop: 8 },
  dogMessage: { fontSize: 13, color: '#a0a0c0', marginTop: 4, textAlign: 'center' },
  sectionLabel: { fontSize: 11, color: '#a0a0c0', fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  moodBtn: {
    backgroundColor: '#16213e', borderRadius: 14, padding: 10,
    flex: 1, marginHorizontal: 3, alignItems: 'center',
    borderWidth: 1, borderColor: 'transparent',
  },
  moodBtnSelected: { borderColor: '#6c63ff', backgroundColor: '#6c63ff22' },
  moodEmoji: { fontSize: 22 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  actionCard: {
    backgroundColor: '#16213e', borderRadius: 18, padding: 16,
    width: '48%', marginBottom: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#6c63ff33',
  },
  actionCardGame: { borderColor: '#ff9f4333', backgroundColor: '#1e1a2e' },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionLabel: { fontSize: 12, color: '#a0a0c0', fontWeight: '600', textAlign: 'center' },
  tipCard: {
    backgroundColor: '#16213e', borderRadius: 18, padding: 16,
    marginBottom: 30, borderWidth: 1, borderColor: '#6c63ff22',
  },
  tipTitle: { fontSize: 14, fontWeight: '700', color: '#6c63ff', marginBottom: 6 },
  tipText: { fontSize: 13, color: '#a0a0c0', lineHeight: 20 },
});