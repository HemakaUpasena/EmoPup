import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Animated, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const BREEDS = [
  { id: 'golden', name: 'Golden Retriever', emoji: '🐕', personality: 'Warm & cheerful' },
  { id: 'husky', name: 'Husky', emoji: '🐺', personality: 'Energetic & playful' },
  { id: 'poodle', name: 'Poodle', emoji: '🐩', personality: 'Smart & gentle' },
  { id: 'shiba', name: 'Shiba Inu', emoji: '🦊', personality: 'Calm & loyal' },
  { id: 'labrador', name: 'Labrador', emoji: '🐶', personality: 'Friendly & caring' },
  { id: 'corgi', name: 'Corgi', emoji: '🐾', personality: 'Cute & comforting' },
];

export default function RegisterScreen({ navigation }) {
  const [step, setStep] = useState(1); // Step 1: details, Step 2: breed
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedBreed, setSelectedBreed] = useState(null);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goToStep2 = () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Oops!', 'Please fill in all fields 🐾');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Oops!', 'Passwords do not match!');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Oops!', 'Password must be at least 6 characters.');
      return;
    }
    // Animate transition
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    setStep(2);
  };

  const handleRegister = async () => {
    if (!selectedBreed) {
      Alert.alert('Choose your pup!', 'Please select a dog breed to continue 🐶');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });

      // Save user data to Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email,
        breed: selectedBreed,
        streak: 0,
        badges: [],
        createdAt: new Date().toISOString(),
      });

      navigation.replace('Main');
    } catch (error) {
      let msg = 'Registration failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') msg = 'This email is already registered.';
      if (error.code === 'auth/invalid-email') msg = 'Please enter a valid email address.';
      Alert.alert('Error', msg);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <Text style={styles.title}>EmoPup 🐾</Text>
        <Text style={styles.subtitle}>
          {step === 1 ? "Create your account" : "Choose your companion!"}
        </Text>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
        </View>

        <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>

          {/* STEP 1 - Account Details */}
          {step === 1 && (
            <View>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor="#888"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Password (min 6 characters)"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor="#888"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              <TouchableOpacity style={styles.btn} onPress={goToStep2}>
                <Text style={styles.btnText}>Next — Choose Your Pup 🐶</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2 - Breed Selection */}
          {step === 2 && (
            <View>
              <Text style={styles.breedTitle}>Which dog speaks to your soul? 🐾</Text>
              <View style={styles.breedGrid}>
                {BREEDS.map((breed) => (
                  <TouchableOpacity
                    key={breed.id}
                    style={[
                      styles.breedCard,
                      selectedBreed?.id === breed.id && styles.breedCardSelected
                    ]}
                    onPress={() => setSelectedBreed(breed)}>
                    <Text style={styles.breedEmoji}>{breed.emoji}</Text>
                    <Text style={styles.breedName}>{breed.name}</Text>
                    <Text style={styles.breedPersonality}>{breed.personality}</Text>
                    {selectedBreed?.id === breed.id && (
                      <Text style={styles.selectedBadge}>✓ Selected</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {selectedBreed && (
                <View style={styles.selectedInfo}>
                  <Text style={styles.selectedInfoText}>
                    {selectedBreed.emoji} You chose a {selectedBreed.name}!
                  </Text>
                  <Text style={styles.selectedInfoSub}>
                    {selectedBreed.personality} — perfect for you 💜
                  </Text>
                </View>
              )}

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => setStep(1)}>
                  <Text style={styles.backBtnText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnFlex]}
                  onPress={handleRegister}
                  disabled={loading}>
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.btnText}>Let's Go! 🐾</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Login link */}
        {step === 1 && (
          <TouchableOpacity
            style={{ marginTop: 20 }}
            onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginHighlight}>Login</Text>
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scroll: { flexGrow: 1, alignItems: 'center', padding: 24, paddingTop: 50 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#6c63ff', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#a0a0b0', textAlign: 'center', marginTop: 6, marginBottom: 20 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  stepDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#333' },
  stepDotActive: { backgroundColor: '#6c63ff' },
  stepLine: { width: 60, height: 2, backgroundColor: '#6c63ff44', marginHorizontal: 6 },
  input: {
    backgroundColor: '#16213e', color: '#fff', borderRadius: 14,
    padding: 16, marginBottom: 14, fontSize: 15, width: '100%',
    borderWidth: 1, borderColor: '#6c63ff44',
  },
  btn: {
    backgroundColor: '#6c63ff', borderRadius: 14,
    padding: 16, alignItems: 'center', marginTop: 4, width: '100%',
  },
  btnFlex: { flex: 1, width: undefined, marginLeft: 10 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  breedTitle: { color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  breedGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  breedCard: {
    backgroundColor: '#16213e', borderRadius: 16, padding: 14,
    width: '48%', marginBottom: 12, alignItems: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  breedCardSelected: { borderColor: '#6c63ff', backgroundColor: '#1e1e3f' },
  breedEmoji: { fontSize: 36, marginBottom: 6 },
  breedName: { color: '#fff', fontWeight: 'bold', fontSize: 13, textAlign: 'center' },
  breedPersonality: { color: '#888', fontSize: 11, textAlign: 'center', marginTop: 3 },
  selectedBadge: { color: '#6c63ff', fontSize: 11, fontWeight: 'bold', marginTop: 5 },
  selectedInfo: {
    backgroundColor: '#16213e', borderRadius: 14, padding: 14,
    alignItems: 'center', marginVertical: 12,
    borderWidth: 1, borderColor: '#6c63ff44',
  },
  selectedInfoText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  selectedInfoSub: { color: '#a0a0b0', fontSize: 13, marginTop: 4 },
  btnRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  backBtn: {
    backgroundColor: '#16213e', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#6c63ff44',
  },
  backBtnText: { color: '#6c63ff', fontSize: 15, fontWeight: 'bold' },
  loginText: { color: '#a0a0b0', fontSize: 14 },
  loginHighlight: { color: '#6c63ff', fontWeight: 'bold' },
});