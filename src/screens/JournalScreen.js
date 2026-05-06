import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Animated, Alert,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const PROMPTS = [
  "What made you smile today? 😊",
  "What's one thing you're grateful for right now? 🌟",
  "What's been on your mind lately? 💭",
  "Describe your perfect calm moment 🌙",
  "What's one small win you had today? 🏆",
  "What would you tell your past self? 💜",
];

export default function JournalScreen() {
  const [entries, setEntries] = useState([]);
  const [writing, setWriting] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [title, setTitle] = useState('');
  const [userData, setUserData] = useState(null);
  const [prompt, setPrompt] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    fetchUserData();
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setEntries(data.journalEntries || []);
        }
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

  const saveEntry = async () => {
    if (!journalText.trim()) {
      Alert.alert('Oops!', 'Please write something first 🐾');
      return;
    }
    try {
      const user = auth.currentUser;
      if (user) {
        const entry = {
          id: Date.now().toString(),
          title: title.trim() || 'My Thoughts',
          text: journalText.trim(),
          date: new Date().toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
          }),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date().toISOString(),
        };
        await updateDoc(doc(db, 'users', user.uid), {
          journalEntries: arrayUnion(entry),
        });
        setEntries(prev => [entry, ...prev]);
        setJournalText('');
        setTitle('');
        setWriting(false);
        Alert.alert('Saved! 🐾', `${getDogEmoji()} Your thoughts are safe with me 💜`);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not save entry. Try again.');
    }
  };

  const getNewPrompt = () => {
    const newPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    setPrompt(newPrompt);
    setJournalText('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>My Journal 📔</Text>
            <Text style={styles.subtitle}>Your private space to reflect 💜</Text>
          </View>

          {/* Dog Encouragement */}
          <View style={styles.dogCard}>
            <Text style={styles.dogEmoji}>{getDogEmoji()}</Text>
            <View style={styles.dogTextArea}>
              <Text style={styles.dogSays}>
                {writing
                  ? "I'm listening... take your time 💜"
                  : `Today's prompt: "${prompt}"`}
              </Text>
              {!writing && (
                <TouchableOpacity onPress={getNewPrompt}>
                  <Text style={styles.refreshPrompt}>🔄 New prompt</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Write Button or Editor */}
          {!writing ? (
            <TouchableOpacity
              style={styles.newEntryBtn}
              onPress={() => setWriting(true)}>
              <Text style={styles.newEntryIcon}>✏️</Text>
              <Text style={styles.newEntryText}>Write a new entry</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editor}>
              <TextInput
                style={styles.titleInput}
                placeholder="Entry title (optional)"
                placeholderTextColor="#555"
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                style={styles.journalInput}
                placeholder={prompt}
                placeholderTextColor="#555"
                value={journalText}
                onChangeText={setJournalText}
                multiline
                numberOfLines={8}
                autoFocus
              />
              <View style={styles.editorBtns}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => { setWriting(false); setJournalText(''); setTitle(''); }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={saveEntry}>
                  <Text style={styles.saveBtnText}>Save Entry 🐾</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Past Entries */}
          <Text style={styles.sectionLabel}>PAST ENTRIES ({entries.length})</Text>

          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📔</Text>
              <Text style={styles.emptyText}>No entries yet.</Text>
              <Text style={styles.emptySubText}>
                Start writing — your pup keeps your secrets safe! 🐾
              </Text>
            </View>
          ) : (
            [...entries].reverse().map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{entry.title}</Text>
                  <Text style={styles.entryDate}>{entry.date}</Text>
                </View>
                <Text style={styles.entryText} numberOfLines={3}>
                  {entry.text}
                </Text>
                <Text style={styles.entryTime}>{entry.time}</Text>
              </View>
            ))
          )}

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', paddingHorizontal: 20, paddingTop: 50 },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 14, color: '#a0a0c0', marginTop: 4 },
  dogCard: {
    backgroundColor: '#16213e', borderRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 20, borderWidth: 1, borderColor: '#6c63ff33',
  },
  dogEmoji: { fontSize: 36 },
  dogTextArea: { flex: 1 },
  dogSays: { fontSize: 13, color: '#e0e0ff', lineHeight: 18 },
  refreshPrompt: { fontSize: 12, color: '#6c63ff', marginTop: 6, fontWeight: '700' },
  newEntryBtn: {
    backgroundColor: '#6c63ff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginBottom: 24,
  },
  newEntryIcon: { fontSize: 20 },
  newEntryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  editor: {
    backgroundColor: '#16213e', borderRadius: 20, padding: 16,
    marginBottom: 24, borderWidth: 1, borderColor: '#6c63ff33',
  },
  titleInput: {
    color: '#fff', fontSize: 16, fontWeight: '700',
    borderBottomWidth: 1, borderBottomColor: '#6c63ff33',
    paddingBottom: 10, marginBottom: 12,
  },
  journalInput: {
    color: '#fff', fontSize: 14, lineHeight: 22,
    textAlignVertical: 'top', minHeight: 160,
  },
  editorBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: {
    flex: 1, backgroundColor: '#ffffff11', borderRadius: 12,
    padding: 12, alignItems: 'center',
  },
  cancelBtnText: { color: '#a0a0c0', fontWeight: '700' },
  saveBtn: {
    flex: 2, backgroundColor: '#6c63ff', borderRadius: 12,
    padding: 12, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '800' },
  sectionLabel: { fontSize: 11, color: '#a0a0c0', fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#fff', fontWeight: '700' },
  emptySubText: { fontSize: 13, color: '#a0a0c0', textAlign: 'center', marginTop: 6 },
  entryCard: {
    backgroundColor: '#16213e', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#6c63ff22',
  },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  entryTitle: { fontSize: 15, fontWeight: '800', color: '#fff', flex: 1 },
  entryDate: { fontSize: 11, color: '#6c63ff', fontWeight: '600' },
  entryText: { fontSize: 13, color: '#a0a0c0', lineHeight: 20 },
  entryTime: { fontSize: 11, color: '#555', marginTop: 8 },
});