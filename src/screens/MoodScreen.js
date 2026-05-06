import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ScrollView, TextInput, Alert
} from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';

const MOODS = [
  { emoji: '😊', label: 'Happy', color: '#6bffb8', message: 'That\'s wonderful! Your happiness is contagious! 🌟', tip: 'Share your joy with someone today!' },
  { emoji: '😐', label: 'Neutral', color: '#a0a0c0', message: 'Just going through the day? That\'s okay too 🌙', tip: 'Try a 5 minute walk to shift your energy.' },
  { emoji: '😢', label: 'Sad', color: '#4ecdc4', message: 'I\'m so sorry you\'re feeling sad. I\'m right here 🤗', tip: 'It\'s okay to feel this way. Be gentle with yourself.' },
  { emoji: '😰', label: 'Anxious', color: '#ffd700', message: 'Take a deep breath. You are safe right now 💜', tip: 'Try box breathing: in 4, hold 4, out 4, hold 4.' },
  { emoji: '😡', label: 'Angry', color: '#ff6b6b', message: 'I hear you. Let\'s work through this together 🌊', tip: 'Try writing down what\'s bothering you.' },
];

export default function MoodScreen({ navigation }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [userData, setUserData] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dogAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 600, useNativeDriver: true
    }).start();
    fetchUserData();
    startDogBounce();
  }, []);

  const startDogBounce = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dogAnim, { toValue: -10, duration: 700, useNativeDriver: true }),
        Animated.timing(dogAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  };

  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) setUserData(docSnap.data());
      }
    } catch (e) { console.log(e); }
  };

  const getDogEmoji = () => {
    const breed = userData?.breed?.id;
    const emojis = {
      golden: '🐕', husky: '🐺', poodle: '🐩',
      shiba: '🦊', labrador: '🐶', corgi: '🐾'
    };
    return emojis[breed] || '🐶';
  };

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
    setSaved(false);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const handleSave = async () => {
    if (!selectedMood) {
      Alert.alert('Oops!', 'Please select how you\'re feeling first 🐾');
      return;
    }
    try {
      const user = auth.currentUser;
      if (user) {
        const moodEntry = {
          mood: selectedMood.label,
          emoji: selectedMood.emoji,
          note: note,
          timestamp: new Date().toISOString(),
        };
        await updateDoc(doc(db, 'users', user.uid), {
          lastMood: selectedMood.label,
          lastMoodTime: new Date().toISOString(),
          moodHistory: arrayUnion(moodEntry),
        });
        setSaved(true);
        Alert.alert(
          'Mood Saved! 🐾',
          `${getDogEmoji()} ${selectedMood.message}`,
          [{ text: 'Thanks!', style: 'default' }]
        );
      }
    } catch (e) {
      Alert.alert('Error', 'Could not save mood. Try again.');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View style={{ opacity: fadeAnim }}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mood Check-in</Text>
          <Text style={styles.subtitle}>How are you feeling right now?</Text>
        </View>

        {/* Dog Reaction */}
        <View style={styles.dogArea}>
          <Animated.Text style={[styles.dogEmoji, {
            transform: [
              { translateY: dogAnim },
              { scale: scaleAnim }
            ]
          }]}>
            {selectedMood ? selectedMood.emoji : getDogEmoji()}
          </Animated.Text>
          <Text style={styles.dogMessage}>
            {selectedMood ? selectedMood.message : `${getDogEmoji()} Tell me how you're feeling...`}
          </Text>
          {selectedMood && (
            <View style={[styles.tipBox, { borderColor: selectedMood.color + '66' }]}>
              <Text style={styles.tipText}>💡 {selectedMood.tip}</Text>
            </View>
          )}
        </View>

        {/* Mood Options */}
        <Text style={styles.sectionLabel}>SELECT YOUR MOOD</Text>
        <View style={styles.moodGrid}>
          {MOODS.map((mood) => (
            <TouchableOpacity
              key={mood.label}
              style={[
                styles.moodCard,
                selectedMood?.label === mood.label && {
                  borderColor: mood.color,
                  backgroundColor: mood.color + '22',
                }
              ]}
              onPress={() => handleMoodSelect(mood)}>
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text style={[styles.moodLabel,
                selectedMood?.label === mood.label && { color: mood.color }
              ]}>
                {mood.label}
              </Text>
              {selectedMood?.label === mood.label && (
                <Text style={styles.selectedCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Optional Note */}
        <Text style={styles.sectionLabel}>ADD A NOTE (OPTIONAL)</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="What's on your mind? Your pup is listening... 🐾"
          placeholderTextColor="#555"
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
        />

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, saved && styles.saveBtnDone]}
          onPress={handleSave}>
          <Text style={styles.saveBtnText}>
            {saved ? '✓ Mood Saved! 🐾' : 'Tell Buddy How You Feel 🐾'}
          </Text>
        </TouchableOpacity>

        {/* Chat Button */}
        {selectedMood && (
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => navigation.navigate('Chat')}>
            <Text style={styles.chatBtnText}>
              💬 Talk to {userData?.breed?.name?.split(' ')[0] || 'Buddy'} about it
            </Text>
          </TouchableOpacity>
        )}

      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', paddingHorizontal: 20, paddingTop: 50 },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 14, color: '#a0a0c0', marginTop: 4 },
  dogArea: {
    backgroundColor: '#16213e', borderRadius: 24, padding: 20,
    alignItems: 'center', marginBottom: 24,
    borderWidth: 1, borderColor: '#6c63ff33',
  },
  dogEmoji: { fontSize: 64, marginBottom: 10 },
  dogMessage: { fontSize: 14, color: '#e0e0ff', textAlign: 'center', lineHeight: 20 },
  tipBox: {
    marginTop: 12, backgroundColor: '#ffffff11',
    borderRadius: 12, padding: 10, borderWidth: 1,
  },
  tipText: { fontSize: 12, color: '#a0a0c0', textAlign: 'center' },
  sectionLabel: { fontSize: 11, color: '#a0a0c0', fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  moodCard: {
    backgroundColor: '#16213e', borderRadius: 16, padding: 14,
    width: '18%', alignItems: 'center', borderWidth: 2,
    borderColor: 'transparent', marginBottom: 8,
  },
  moodEmoji: { fontSize: 28 },
  moodLabel: { fontSize: 10, color: '#888', marginTop: 4, fontWeight: '600' },
  selectedCheck: { fontSize: 10, color: '#6c63ff', fontWeight: '700' },
  noteInput: {
    backgroundColor: '#16213e', color: '#fff', borderRadius: 16,
    padding: 14, fontSize: 14, borderWidth: 1,
    borderColor: '#6c63ff33', marginBottom: 16,
    textAlignVertical: 'top', minHeight: 80,
  },
  saveBtn: {
    backgroundColor: '#6c63ff', borderRadius: 16,
    padding: 16, alignItems: 'center', marginBottom: 12,
  },
  saveBtnDone: { backgroundColor: '#6bffb844', borderWidth: 1, borderColor: '#6bffb8' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  chatBtn: {
    backgroundColor: '#16213e', borderRadius: 16, padding: 14,
    alignItems: 'center', marginBottom: 30,
    borderWidth: 1, borderColor: '#6c63ff44',
  },
  chatBtnText: { color: '#6c63ff', fontSize: 14, fontWeight: '700' },
});