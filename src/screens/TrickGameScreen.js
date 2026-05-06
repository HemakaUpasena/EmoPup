import { playTap, playFanfare } from '../sounds';
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Alert, Dimensions
} from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const COLORS = [
  { id: 'red', emoji: '❤️', color: '#ff6b6b', label: 'Red' },
  { id: 'blue', emoji: '💙', color: '#4ecdc4', label: 'Blue' },
  { id: 'yellow', emoji: '💛', color: '#ffd700', label: 'Yellow' },
  { id: 'green', emoji: '💚', color: '#6bffb8', label: 'Green' },
];

export default function TrickGameScreen({ navigation }) {
  const [gameState, setGameState] = useState('idle'); // idle, showing, input, won, lost
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [level, setLevel] = useState(1);
  const [bestLevel, setBestLevel] = useState(1);
  const [activeColor, setActiveColor] = useState(null);
  const [userData, setUserData] = useState(null);
  const [message, setMessage] = useState('Watch Buddy\'s sequence then repeat it! 🐾');
  const [score, setScore] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dogAnim = useRef(new Animated.Value(0)).current;
  const celebrateAnim = useRef(new Animated.Value(1)).current;
  const buttonAnims = useRef(
    COLORS.reduce((acc, c) => ({ ...acc, [c.id]: new Animated.Value(1) }), {})
  ).current;

  useEffect(() => {
    fetchUserData();
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 600, useNativeDriver: true
    }).start();
    startDogBounce();
  }, []);

  const startDogBounce = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dogAnim, { toValue: -10, duration: 600, useNativeDriver: true }),
        Animated.timing(dogAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
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
          setBestLevel(data.trickBestLevel || 1);
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

    const startGame = async () => {
    setScore(0);
    setLevel(1);
    setUserSequence([]);
    const firstSequence = [COLORS[Math.floor(Math.random() * COLORS.length)]];
    setSequence(firstSequence);
    setGameState('showing');
    setMessage('Watch carefully! 👀');
    setTimeout(() => playSequence(firstSequence), 800);
  };

  const playSequence = (seq) => {
    let delay = 0;
    seq.forEach((color, index) => {
      setTimeout(() => {
        flashButton(color.id);
        await playTap();
        if (index === seq.length - 1) {
          setTimeout(() => {
            setGameState('input');
            setMessage('Your turn! Repeat the sequence! 🎯');
            setUserSequence([]);
          }, 800);
        }
      }, delay);
      delay += 900;
    });
  };

  const flashButton = (colorId) => {
    setActiveColor(colorId);
    Animated.sequence([
      Animated.timing(buttonAnims[colorId], {
        toValue: 1.3, duration: 200, useNativeDriver: true
      }),
      Animated.timing(buttonAnims[colorId], {
        toValue: 1, duration: 200, useNativeDriver: true
      }),
    ]).start();
    setTimeout(() => setActiveColor(null), 400);
  };

  const handleUserInput = async (color) => {
    if (gameState !== 'input') return;

    flashButton(color.id);
    const newUserSequence = [...userSequence, color];
    setUserSequence(newUserSequence);

    const currentIndex = newUserSequence.length - 1;

    // Check if correct
    if (color.id !== sequence[currentIndex].id) {
      // Wrong!
      setGameState('lost');
      setMessage(`Oops! Wrong one! You reached level ${level} 🐾`);
      if (level > bestLevel) {
        setBestLevel(level);
        saveBestLevel(level);
      }
      Animated.sequence([
        Animated.timing(celebrateAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
        Animated.timing(celebrateAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      return;
    }

    // Check if completed sequence
    if (newUserSequence.length === sequence.length) {
      // Level complete!
      const newLevel = level + 1;
      const newScore = score + level * 10;
      setScore(newScore);
      setLevel(newLevel);
      setGameState('won');
      setMessage(`🎉 Perfect! Level ${level} complete! +${level * 10} points!`);
      await playFanfare();

      // Celebrate
      Animated.sequence([
        Animated.timing(celebrateAnim, { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.timing(celebrateAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      // Next level
      setTimeout(() => {
        const nextSequence = [
          ...sequence,
          COLORS[Math.floor(Math.random() * COLORS.length)]
        ];
        setSequence(nextSequence);
        setUserSequence([]);
        setGameState('showing');
        setMessage(`Level ${newLevel} — Watch carefully! 👀`);
        setTimeout(() => playSequence(nextSequence), 500);
      }, 1500);
    }
  };

  const saveBestLevel = async (level) => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          trickBestLevel: level,
        });
      }
    } catch (e) { console.log(e); }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎭 Trick Training</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Score Board */}
      <View style={styles.scoreBoard}>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreNum}>{level}</Text>
          <Text style={styles.scoreLbl}>Level</Text>
        </View>
        <View style={styles.scoreDivider} />
        <View style={styles.scoreItem}>
          <Text style={styles.scoreNum}>{score}</Text>
          <Text style={styles.scoreLbl}>Score</Text>
        </View>
        <View style={styles.scoreDivider} />
        <View style={styles.scoreItem}>
          <Text style={styles.scoreNum}>{bestLevel}</Text>
          <Text style={styles.scoreLbl}>Best Level</Text>
        </View>
      </View>

      {/* Dog Area */}
      <View style={styles.dogArea}>
        <Animated.Text style={[styles.dogEmoji, {
          transform: [
            { translateY: dogAnim },
            { scale: celebrateAnim }
          ]
        }]}>
          {getDogEmoji()}
        </Animated.Text>
        <Text style={styles.dogMessage}>{message}</Text>

        {/* Sequence Display */}
        {gameState !== 'idle' && (
          <View style={styles.sequenceRow}>
            {sequence.map((color, index) => (
              <View
                key={index}
                style={[styles.seqDot,
                  { backgroundColor: color.color + '44',
                    borderColor: color.color,
                    opacity: index < userSequence.length ? 1 : 0.4 }
                ]}>
                <Text style={styles.seqDotText}>{color.emoji}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Game Buttons */}
      {gameState === 'idle' || gameState === 'lost' ? (
        <TouchableOpacity style={styles.startBtn} onPress={startGame}>
          <Text style={styles.startBtnText}>
            {gameState === 'lost' ? '🔄 Try Again!' : '🎭 Start Training!'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.colorGrid}>
          {COLORS.map((color) => (
            <Animated.View
              key={color.id}
              style={{ transform: [{ scale: buttonAnims[color.id] }] }}>
              <TouchableOpacity
                style={[
                  styles.colorBtn,
                  {
                    backgroundColor: activeColor === color.id
                      ? color.color
                      : color.color + '33',
                    borderColor: color.color,
                  }
                ]}
                onPress={() => handleUserInput(color)}
                disabled={gameState !== 'input'}>
                <Text style={styles.colorBtnEmoji}>{color.emoji}</Text>
                <Text style={[styles.colorBtnLabel, { color: color.color }]}>
                  {color.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      )}

      {/* Level milestones */}
      {level === 5 && gameState !== 'idle' && (
        <Text style={styles.milestone}>🌟 Level 5! You're amazing!</Text>
      )}
      {level === 10 && gameState !== 'idle' && (
        <Text style={styles.milestone}>🏆 Level 10! Trick Master badge!</Text>
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
  title: { fontSize: 20, fontWeight: '800', color: '#fff' },
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
  dogArea: {
    backgroundColor: '#16213e', marginHorizontal: 20,
    borderRadius: 24, padding: 20, alignItems: 'center',
    marginBottom: 20, borderWidth: 1, borderColor: '#6c63ff33',
    minHeight: 160,
  },
  dogEmoji: { fontSize: 56, marginBottom: 10 },
  dogMessage: { fontSize: 13, color: '#e0e0ff', textAlign: 'center', marginBottom: 12 },
  sequenceRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  seqDot: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  seqDotText: { fontSize: 16 },
  startBtn: {
    backgroundColor: '#6c63ff', marginHorizontal: 20,
    borderRadius: 18, padding: 18, alignItems: 'center',
    shadowColor: '#6c63ff', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12,
  },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  colorGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between', paddingHorizontal: 20, gap: 12,
  },
  colorBtn: {
    width: (Dimensions.get('window').width - 56) / 2,
    borderRadius: 20, padding: 20, alignItems: 'center',
    borderWidth: 2,
  },
  colorBtnEmoji: { fontSize: 36, marginBottom: 6 },
  colorBtnLabel: { fontSize: 14, fontWeight: '800' },
  milestone: {
    color: '#ffd700', textAlign: 'center',
    fontSize: 14, fontWeight: '700', marginTop: 16,
  },
});