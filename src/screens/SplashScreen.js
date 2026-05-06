import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function SplashScreen({ navigation }) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.5);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
        <Text style={styles.emoji}>🐾</Text>
        <Text style={styles.title}>EmoPup</Text>
        <Text style={styles.subtitle}>Your emotional support companion</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 80, textAlign: 'center', marginBottom: 20 },
  title: { fontSize: 48, fontWeight: 'bold', color: '#6c63ff', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#a0a0b0', textAlign: 'center', marginTop: 10 },
});