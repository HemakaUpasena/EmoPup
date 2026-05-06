import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const BREEDS = [
  { id: 'golden', name: 'Golden Retriever', emoji: '🐕', personality: 'Warm & cheerful' },
  { id: 'husky', name: 'Husky', emoji: '🐺', personality: 'Energetic & playful' },
  { id: 'poodle', name: 'Poodle', emoji: '🐩', personality: 'Smart & gentle' },
  { id: 'shiba', name: 'Shiba Inu', emoji: '🦊', personality: 'Calm & loyal' },
  { id: 'labrador', name: 'Labrador', emoji: '🐶', personality: 'Friendly & caring' },
  { id: 'corgi', name: 'Corgi', emoji: '🐾', personality: 'Cute & comforting' },
];

export default function BreedSelectScreen({ navigation }) {
  const handleSelect = async (breed) => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), { breed });
      }
      navigation.replace('Main');
    } catch (e) {
      navigation.replace('Main');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Choose Your Pup! 🐾</Text>
      <Text style={styles.subtitle}>Which dog speaks to your soul?</Text>
      <View style={styles.grid}>
        {BREEDS.map((breed) => (
          <TouchableOpacity
            key={breed.id}
            style={styles.card}
            onPress={() => handleSelect(breed)}>
            <Text style={styles.emoji}>{breed.emoji}</Text>
            <Text style={styles.name}>{breed.name}</Text>
            <Text style={styles.personality}>{breed.personality}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', paddingHorizontal: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#a0a0c0', textAlign: 'center', marginTop: 6, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    backgroundColor: '#16213e', borderRadius: 18, padding: 16,
    width: '48%', marginBottom: 14, alignItems: 'center',
    borderWidth: 2, borderColor: '#6c63ff33',
  },
  emoji: { fontSize: 42, marginBottom: 8 },
  name: { fontSize: 13, fontWeight: '800', color: '#fff', textAlign: 'center' },
  personality: { fontSize: 11, color: '#a0a0c0', textAlign: 'center', marginTop: 4 },
});