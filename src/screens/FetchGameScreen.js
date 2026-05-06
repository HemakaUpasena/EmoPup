import { playBounce, playSuccess } from '../sounds';
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Alert, Dimensions
} from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

export default function FetchGameScreen({ navigation }) {
  const [gameState, setGameState] = useState('idle'); // idle, throwing, fetching, caught, missed
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [userData, setUserData] = useState(null);
  const [message, setMessage] = useState('Tap the button to throw the stick! 🎾');

  // Animations
  const stickX = useRef(new Animated.Value(width * 0.6)).current;
  const stickY = useRef(new Animated.Value(80)).current;
  const dogX = useRef(new Animated.Value(30)).current;
  const dogBounce = useRef(new Animated.Value(0)).current;
  const stickRotate = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchUserData();
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 600, useNativeDriver: true
    }).start();
    startIdleBounce();
  }, []);

  const startIdleBounce = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dogBounce, { toValue: -8, duration: 500, useNativeDriver: true }),
        Animated.timing(dogBounce, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  };

  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setBestScore(data.fetchBestScore || 0);
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

  const throwStick = () => {
    if (gameState !== 'idle') return;
    setGameState('throwing');
    await playBounce();
    setMessage('Stick is flying! 🪵');

    // Reset positions
    stickX.setValue(width * 0.6);
    stickY.setValue(80);
    dogX.setValue(30);
    stickRotate.setValue(0);

    // Throw stick animation
    Animated.parallel([
      Animated.timing(stickX, { toValue: width * 0.75, duration: 400, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(stickY, { toValue: 30, duration: 200, useNativeDriver: true }),
        Animated.timing(stickY, { toValue: 80, duration: 200, useNativeDriver: true }),
      ]),
      Animated.timing(stickRotate, { toValue: 360, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      setGameState('fetching');
      setMessage(`Go fetch it ${userData?.breed?.name?.split(' ')[0] || 'Buddy'}! 🏃`);
      runDogToStick();
    });
  };

  const runDogToStick = () => {
    // Dog runs to stick
    Animated.timing(dogX, {
      toValue: width * 0.55,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      // Dog catches stick
      setGameState('caught');
      const newScore = score + 1;
      setScore(newScore);
      setMessage(`${getDogEmoji()} Caught it! Good boy! 🎉`);
      await playSuccess();

      // Success flash
      Animated.sequence([
        Animated.timing(successAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(successAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();

      // Dog runs back
      setTimeout(() => {
        Animated.timing(dogX, {
          toValue: 30,
          duration: 800,
          useNativeDriver: true,
        }).start(() => {
          setGameState('idle');
          setMessage('Great catch! Throw again! 🎾');
          // Update best score
          if (newScore > bestScore) {
            setBestScore(newScore);
            saveBestScore(newScore);
          }
        });
      }, 600);
    });
  };

  const saveBestScore = async (score) => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          fetchBestScore: score,
        });
      }
    } catch (e) { console.log(e); }
  };

  const resetGame = () => {
    setScore(0);
    setGameState('idle');
    setMessage('Tap the button to throw the stick! 🎾');
    dogX.setValue(30);
    stickX.setValue(width * 0.6);
    stickY.setValue(80);
  };

  const stickRotateInterpolate = stickRotate.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎾 Fetch!</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Score Board */}
      <View style={styles.scoreBoard}>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreNum}>{score}</Text>
          <Text style={styles.scoreLbl}>Catches</Text>
        </View>
        <View style={styles.scoreDivider} />
        <View style={styles.scoreItem}>
          <Text style={styles.scoreNum}>{bestScore}</Text>
          <Text style={styles.scoreLbl}>Best</Text>
        </View>
        <View style={styles.scoreDivider} />
        <View style={styles.scoreItem}>
          <Text style={styles.scoreNum}>
            {score >= 10 ? '🌟' : score >= 5 ? '⭐' : '🎾'}
          </Text>
          <Text style={styles.scoreLbl}>Reward</Text>
        </View>
      </View>

      {/* Game Field */}
      <Animated.View style={[styles.gameField,
        { backgroundColor: successAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['#16213e', '#6c63ff33']
        })}
      ]}>
        {/* Sky decoration */}
        <Text style={styles.clouds}>☁️      ☁️</Text>
        <Text style={styles.sun}>☀️</Text>

        {/* Stick */}
        <Animated.Text style={[styles.stick, {
          transform: [
            { translateX: stickX },
            { translateY: stickY },
            { rotate: stickRotateInterpolate }
          ]
        }]}>
          🪵
        </Animated.Text>

        {/* Dog */}
        <Animated.Text style={[styles.dog, {
          transform: [
            { translateX: dogX },
            { translateY: dogBounce }
          ]
        }]}>
          {getDogEmoji()}
        </Animated.Text>

        {/* Ground */}
        <View style={styles.ground} />
      </Animated.View>

      {/* Message */}
      <View style={styles.messageBox}>
        <Text style={styles.messageText}>{message}</Text>
      </View>

      {/* Throw Button */}
      <TouchableOpacity
        style={[styles.throwBtn, gameState !== 'idle' && styles.throwBtnDisabled]}
        onPress={throwStick}
        disabled={gameState !== 'idle'}>
        <Text style={styles.throwBtnText}>
          {gameState === 'idle' ? '👆 THROW THE STICK!' :
           gameState === 'throwing' ? '🪵 Flying...' :
           gameState === 'fetching' ? '🏃 Fetching...' :
           '🎉 Caught!'}
        </Text>
      </TouchableOpacity>

      {/* Reset */}
      {score > 0 && (
        <TouchableOpacity style={styles.resetBtn} onPress={resetGame}>
          <Text style={styles.resetBtnText}>🔄 Reset Score</Text>
        </TouchableOpacity>
      )}

      {/* Fun messages at milestones */}
      {score === 5 && (
        <Text style={styles.milestone}>🌟 5 catches! You're a great trainer!</Text>
      )}
      {score === 10 && (
        <Text style={styles.milestone}>🏆 10 catches! Badge unlocked!</Text>
      )}

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', paddingTop: 50 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, marginBottom: 16,
  },
  backBtn: { color: '#6c63ff', fontSize: 15, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  placeholder: { width: 50 },
  scoreBoard: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: '#16213e', marginHorizontal: 20,
    borderRadius: 20, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#6c63ff33',
  },
  scoreItem: { alignItems: 'center' },
  scoreNum: { fontSize: 28, fontWeight: '800', color: '#ffd700' },
  scoreLbl: { fontSize: 11, color: '#a0a0c0', marginTop: 2 },
  scoreDivider: { width: 1, backgroundColor: '#6c63ff33' },
  gameField: {
    marginHorizontal: 20, borderRadius: 24, height: 200,
    overflow: 'hidden', marginBottom: 16,
    borderWidth: 1, borderColor: '#6c63ff33',
    position: 'relative',
  },
  clouds: { position: 'absolute', top: 10, left: 10, fontSize: 16, color: '#ffffff44' },
  sun: { position: 'absolute', top: 8, right: 14, fontSize: 18 },
  stick: { position: 'absolute', bottom: 40, fontSize: 24 },
  dog: { position: 'absolute', bottom: 30, fontSize: 44 },
  ground: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 30, backgroundColor: '#2d4a3e',
    borderRadius: 0,
  },
  messageBox: {
    backgroundColor: '#16213e', marginHorizontal: 20,
    borderRadius: 14, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#6c63ff22',
  },
  messageText: { color: '#e0e0ff', fontSize: 14, textAlign: 'center', fontWeight: '600' },
  throwBtn: {
    backgroundColor: '#6c63ff', marginHorizontal: 20,
    borderRadius: 18, padding: 18, alignItems: 'center',
    shadowColor: '#6c63ff', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, marginBottom: 12,
  },
  throwBtnDisabled: { backgroundColor: '#6c63ff66' },
  throwBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  resetBtn: {
    marginHorizontal: 20, borderRadius: 14, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#6c63ff33',
  },
  resetBtnText: { color: '#a0a0c0', fontSize: 14, fontWeight: '600' },
  milestone: {
    color: '#ffd700', textAlign: 'center', fontSize: 14,
    fontWeight: '700', marginTop: 8,
  },
});