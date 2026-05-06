import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Animated, TouchableOpacity, Alert
} from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const BADGES = [
  { id: 'first_chat', emoji: '💬', name: 'First Chat', desc: 'Had your first conversation', condition: (d) => d.chatCount >= 1 },
  { id: 'mood_tracker', emoji: '😊', name: 'Mood Tracker', desc: 'Logged 5 moods', condition: (d) => (d.moodHistory?.length || 0) >= 5 },
  { id: 'journaler', emoji: '📔', name: 'Journaler', desc: 'Wrote 3 journal entries', condition: (d) => (d.journalEntries?.length || 0) >= 3 },
  { id: 'fetch_pro', emoji: '🎾', name: 'Fetch Pro', desc: 'Caught 10 sticks', condition: (d) => (d.fetchBestScore || 0) >= 10 },
  { id: 'trick_master', emoji: '🎭', name: 'Trick Master', desc: 'Reached level 10', condition: (d) => (d.trickBestLevel || 0) >= 10 },
  { id: 'streak_3', emoji: '🔥', name: '3 Day Streak', desc: 'Used app 3 days in a row', condition: (d) => (d.streak || 0) >= 3 },
  { id: 'streak_7', emoji: '⚡', name: 'Week Warrior', desc: 'Used app 7 days in a row', condition: (d) => (d.streak || 0) >= 7 },
  { id: 'streak_30', emoji: '🌟', name: 'Monthly Hero', desc: '30 day streak!', condition: (d) => (d.streak || 0) >= 30 },
  { id: 'deep_talker', emoji: '💜', name: 'Deep Talker', desc: 'Had 20 conversations', condition: (d) => (d.chatCount || 0) >= 20 },
];

export default function RewardsScreen() {
  const [userData, setUserData] = useState(null);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const streakAnim = useRef(new Animated.Value(0.8)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchUserData();
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 600, useNativeDriver: true
    }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -8, duration: 600, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();
    Animated.spring(streakAnim, {
      toValue: 1, friction: 3, useNativeDriver: true
    }).start();
  }, []);

  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          // Check which badges are earned
          const earned = BADGES.filter(badge => badge.condition(data));
          setEarnedBadges(earned.map(b => b.id));
          // Save newly earned badges
          if (earned.length > (data.badges?.length || 0)) {
            await updateDoc(doc(db, 'users', user.uid), {
              badges: earned.map(b => b.id),
            });
          }
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

  const getStreakMessage = () => {
    const streak = userData?.streak || 0;
    if (streak === 0) return 'Start your streak today! 🌱';
    if (streak < 3) return 'Great start! Keep going! 💪';
    if (streak < 7) return 'You\'re on fire! 🔥';
    if (streak < 30) return 'Incredible dedication! ⚡';
    return 'You\'re a legend! 🌟';
  };

  const getProgressToNextBadge = () => {
    if (!userData) return null;
    const unearned = BADGES.filter(b => !earnedBadges.includes(b.id));
    if (unearned.length === 0) return 'You\'ve earned all badges! 🏆';
    return `Next: ${unearned[0].name} — ${unearned[0].desc}`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View style={{ opacity: fadeAnim }}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🏆 Achievements</Text>
          <Text style={styles.subtitle}>Your journey with your pup 💜</Text>
        </View>

        {/* Dog Celebration */}
        <View style={styles.dogArea}>
          <Animated.Text style={[styles.dogEmoji, {
            transform: [{ translateY: bounceAnim }]
          }]}>
            {getDogEmoji()}
          </Animated.Text>
          <Text style={styles.dogMessage}>
            {earnedBadges.length > 0
              ? `Woof! You've earned ${earnedBadges.length} badge${earnedBadges.length > 1 ? 's' : ''}! I'm so proud! 🎉`
              : 'Complete activities to earn badges! 🐾'}
          </Text>
        </View>

        {/* Streak Card */}
        <Animated.View style={[styles.streakCard, { transform: [{ scale: streakAnim }] }]}>
          <View style={styles.streakLeft}>
            <Text style={styles.streakFire}>🔥</Text>
            <View>
              <Text style={styles.streakNum}>{userData?.streak || 0}</Text>
              <Text style={styles.streakLbl}>Day Streak</Text>
            </View>
          </View>
          <Text style={styles.streakMessage}>{getStreakMessage()}</Text>
        </Animated.View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{userData?.chatCount || 0}</Text>
            <Text style={styles.statLbl}>💬 Chats</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{userData?.moodHistory?.length || 0}</Text>
            <Text style={styles.statLbl}>😊 Moods</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{userData?.journalEntries?.length || 0}</Text>
            <Text style={styles.statLbl}>📔 Entries</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{userData?.fetchBestScore || 0}</Text>
            <Text style={styles.statLbl}>🎾 Best</Text>
          </View>
        </View>

        {/* Next Badge Progress */}
        <View style={styles.nextBadgeCard}>
          <Text style={styles.nextBadgeTitle}>🎯 Next Goal</Text>
          <Text style={styles.nextBadgeText}>{getProgressToNextBadge()}</Text>
        </View>

        {/* Badges Grid */}
        <Text style={styles.sectionLabel}>
          BADGES ({earnedBadges.length}/{BADGES.length})
        </Text>

        <View style={styles.badgesGrid}>
          {BADGES.map((badge) => {
            const earned = earnedBadges.includes(badge.id);
            return (
              <TouchableOpacity
                key={badge.id}
                style={[styles.badgeCard, earned && styles.badgeCardEarned]}
                onPress={() => {
                  if (earned) {
                    Alert.alert(
                      `${badge.emoji} ${badge.name}`,
                      `✅ ${badge.desc}\n\nYou earned this badge! 🎉`,
                    );
                  } else {
                    Alert.alert(
                      `🔒 ${badge.name}`,
                      `How to earn: ${badge.desc}`,
                    );
                  }
                }}>
                <Text style={[styles.badgeEmoji, !earned && styles.badgeLocked]}>
                  {earned ? badge.emoji : '🔒'}
                </Text>
                <Text style={[styles.badgeName, earned && styles.badgeNameEarned]}>
                  {badge.name}
                </Text>
                <Text style={styles.badgeDesc} numberOfLines={2}>
                  {badge.desc}
                </Text>
                {earned && <Text style={styles.earnedCheck}>✓ Earned</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

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
    alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: '#6c63ff33',
  },
  dogEmoji: { fontSize: 56, marginBottom: 10 },
  dogMessage: { fontSize: 14, color: '#e0e0ff', textAlign: 'center' },
  streakCard: {
    backgroundColor: '#ff9f4322', borderRadius: 20, padding: 20,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: '#ff9f4366',
  },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streakFire: { fontSize: 36 },
  streakNum: { fontSize: 36, fontWeight: '800', color: '#ff9f43' },
  streakLbl: { fontSize: 12, color: '#a0a0c0' },
  streakMessage: { fontSize: 13, color: '#ff9f43', fontWeight: '700', flex: 1, textAlign: 'right' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statCard: {
    backgroundColor: '#16213e', borderRadius: 16, padding: 12,
    alignItems: 'center', flex: 1, marginHorizontal: 3,
    borderWidth: 1, borderColor: '#6c63ff22',
  },
  statNum: { fontSize: 22, fontWeight: '800', color: '#ffd700' },
  statLbl: { fontSize: 10, color: '#a0a0c0', marginTop: 3 },
  nextBadgeCard: {
    backgroundColor: '#16213e', borderRadius: 16, padding: 14,
    marginBottom: 20, borderWidth: 1, borderColor: '#6c63ff33',
  },
  nextBadgeTitle: { fontSize: 13, fontWeight: '700', color: '#6c63ff', marginBottom: 4 },
  nextBadgeText: { fontSize: 13, color: '#a0a0c0' },
  sectionLabel: { fontSize: 11, color: '#a0a0c0', fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  badgeCard: {
    backgroundColor: '#16213e', borderRadius: 18, padding: 14,
    width: '48%', marginBottom: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#ffffff11',
  },
  badgeCardEarned: { borderColor: '#ffd700', backgroundColor: '#ffd70011' },
  badgeEmoji: { fontSize: 32, marginBottom: 6 },
  badgeLocked: { opacity: 0.4 },
  badgeName: { fontSize: 13, fontWeight: '800', color: '#888', textAlign: 'center' },
  badgeNameEarned: { color: '#ffd700' },
  badgeDesc: { fontSize: 10, color: '#555', textAlign: 'center', marginTop: 4 },
  earnedCheck: { fontSize: 11, color: '#ffd700', fontWeight: '700', marginTop: 6 },
});