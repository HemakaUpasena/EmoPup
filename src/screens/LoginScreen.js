import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Animated, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Animations
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const tailAnim = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 800, useNativeDriver: true,
    }).start();

    // Bounce puppy
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -18, duration: 500, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    ).start();

    // Wag tail
    Animated.loop(
      Animated.sequence([
        Animated.timing(tailAnim, { toValue: 10, duration: 300, useNativeDriver: true }),
        Animated.timing(tailAnim, { toValue: -10, duration: 300, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Oops!', 'Please enter your email and password 🐾');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.replace('Main');
    } catch (error) {
      let msg = 'Something went wrong. Please try again.';
      if (error.code === 'auth/user-not-found') msg = 'No account found with this email.';
      if (error.code === 'auth/wrong-password') msg = 'Incorrect password. Try again!';
      if (error.code === 'auth/invalid-email') msg = 'Please enter a valid email address.';
      Alert.alert('Login Failed', msg);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Puppy Animation */}
        <Animated.View style={[styles.puppyContainer, { opacity: fadeAnim }]}>
          <Animated.Text style={[styles.puppy, { transform: [{ translateY: bounceAnim }] }]}>
            🐶
          </Animated.Text>
          <Animated.Text style={[styles.tail, { transform: [{ translateX: tailAnim }] }]}>
            🐾
          </Animated.Text>
        </Animated.View>

        {/* Title */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.title}>EmoPup</Text>
          <Text style={styles.subtitle}>Welcome back! Your pup missed you 💜</Text>
        </Animated.View>

        {/* Login Form */}
        <Animated.View style={[styles.form, { opacity: fadeAnim }]}>
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
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.loginBtnText}>Login 🐾</Text>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign Up Link */}
          <TouchableOpacity
            style={styles.signUpBtn}
            onPress={() => navigation.navigate('Register')}>
            <Text style={styles.signUpText}>
              New here? <Text style={styles.signUpHighlight}>Create an account 🐕</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footer}>Your safe space for emotional support 🌙</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  puppyContainer: { alignItems: 'center', marginBottom: 10 },
  puppy: { fontSize: 90 },
  tail: { fontSize: 28, marginTop: -10 },
  title: { fontSize: 42, fontWeight: 'bold', color: '#6c63ff', textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#a0a0b0', textAlign: 'center', marginTop: 6, marginBottom: 30 },
  form: { width: '100%' },
  input: {
    backgroundColor: '#16213e', color: '#fff', borderRadius: 14,
    padding: 16, marginBottom: 14, fontSize: 15,
    borderWidth: 1, borderColor: '#6c63ff44',
  },
  loginBtn: {
    backgroundColor: '#6c63ff', borderRadius: 14,
    padding: 16, alignItems: 'center', marginTop: 4,
  },
  loginBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#6c63ff44' },
  dividerText: { color: '#888', marginHorizontal: 12, fontSize: 13 },
  signUpBtn: { alignItems: 'center', padding: 12 },
  signUpText: { color: '#a0a0b0', fontSize: 15 },
  signUpHighlight: { color: '#6c63ff', fontWeight: 'bold' },
  footer: { color: '#555', fontSize: 12, marginTop: 30, textAlign: 'center' },
});