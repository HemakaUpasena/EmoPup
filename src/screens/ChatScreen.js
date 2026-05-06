import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Animated, KeyboardAvoidingView,
  Platform, ActivityIndicator
} from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

const DOG_RESPONSES = {
  greetings: [
    "Woof woof! 🐾 So happy you're here! Tell me everything!",
    "Hey there! 💜 I've been wagging my tail waiting for you!",
    "You came to chat! This is the best part of my day! 🎉",
  ],
  lonely: [
    "Oh no, feeling lonely? 🤗 Come here, I'm always right beside you! You're never truly alone when you have me!",
    "Loneliness is so hard 💜 But you know what? You reached out today and that's so brave! I'm here with you.",
    "I understand that feeling 🐾 Sometimes we all need a quiet companion. I'll always be here, no matter what.",
  ],
  sad: [
    "I can feel you're sad and I just want to give you the biggest paw-hug! 🐾💜 Want to tell me more?",
    "It's okay to feel sad sometimes 🌙 Even the happiest dogs have cloudy days. I'm right here with you.",
    "Your feelings are so valid 💜 Take your time. I'm not going anywhere — I'll stay right here beside you.",
  ],
  anxious: [
    "Hey, take a deep breath with me 🌬️ In for 4... hold for 4... out for 4. You're safe right now, I promise.",
    "Anxiety is so tough 😰 But you're stronger than you think! One small step at a time, and I'll walk with you.",
    "I can sense you're worried 💜 Remember — you've gotten through every hard day so far. That's 100%! You've got this!",
  ],
  angry: [
    "I hear you! 🌊 It's okay to feel angry. Want to shake it off? I know a great fetch game that helps me! 🎾",
    "Anger is just hurt looking for a way out 💜 I'm here to listen without judgment. Tell me what happened.",
    "Take it out on me — I can handle it! 🐾 Tell me everything. I promise I won't judge you one bit.",
  ],
  happy: [
    "YESSS! 🎉 Your happiness makes my tail wag SO fast! Tell me what's making you happy!",
    "Oh this is the BEST news! 🌟 Happy you = happy me! Let's celebrate together!",
    "I can feel your positive energy and it's CONTAGIOUS! 🐾 Keep shining, you amazing human!",
  ],
  stressed: [
    "Stress is so exhausting 😮‍💨 Have you tried taking a 5 minute walk? Even I feel better after a little stroll!",
    "When I get stressed I shake it off — literally! 🐾 Maybe try stretching or some deep breaths?",
    "You're carrying so much 💜 Remember — it's okay to put some things down. You don't have to do everything at once.",
  ],
  tired: [
    "Rest is so important 😴 Even I take long naps! Your body is telling you something — please listen to it 💜",
    "Being tired isn't weakness — it means you've been working hard! 🐾 Time to recharge!",
    "Sleep is healing 🌙 If you can, try to rest a little. I'll be here when you wake up!",
  ],
  compliment: [
    "Awww you're making me blush! 🐾 But honestly, YOU are the amazing one for taking care of your mental health!",
    "Thank you! 💜 But the real star here is YOU for showing up for yourself today!",
    "You're too kind! 🎉 I just love being your companion. You deserve all the good things!",
  ],
  games: [
    "Oh YES let's play! 🎾 Head to the Home screen and tap 'Play Fetch' — I LOVE that game!",
    "Games are the best stress relief! 🎭 Try the Trick Training game — it's so fun!",
    "Let's go play! 🐾 I'll be waiting for you on the Home screen!",
  ],
  default: [
    "I hear you 💜 Tell me more — I'm all ears and all paws!",
    "That sounds really meaningful 🐾 How does that make you feel?",
    "I'm so glad you're sharing this with me 💜 You can always talk to me about anything.",
    "Woof! 🐾 I might be a dog but I understand more than you think! Keep going...",
    "You know what I love about you? 💜 You keep showing up. That takes real courage.",
    "I'm listening so carefully 🐾 Every word you say matters to me!",
    "Thank you for trusting me with this 💜 That means everything to me.",
  ],
};

const getResponse = (input) => {
  const text = input.toLowerCase();
  if (text.match(/hi|hello|hey|sup|what'?s up/))
    return DOG_RESPONSES.greetings;
  if (text.match(/lonely|alone|isolated|no one|nobody/))
    return DOG_RESPONSES.lonely;
  if (text.match(/sad|unhappy|depressed|down|cry|crying|tears/))
    return DOG_RESPONSES.sad;
  if (text.match(/anxious|anxiety|nervous|worried|panic|scared|fear/))
    return DOG_RESPONSES.anxious;
  if (text.match(/angry|anger|mad|frustrated|annoyed|furious/))
    return DOG_RESPONSES.angry;
  if (text.match(/happy|great|good|excited|joy|wonderful|amazing/))
    return DOG_RESPONSES.happy;
  if (text.match(/stress|stressed|overwhelm|pressure|busy|too much/))
    return DOG_RESPONSES.stressed;
  if (text.match(/tired|exhausted|sleepy|fatigue|worn out/))
    return DOG_RESPONSES.tired;
  if (text.match(/love you|good dog|best|cute|adorable|thank/))
    return DOG_RESPONSES.compliment;
  if (text.match(/play|game|fetch|trick|fun/))
    return DOG_RESPONSES.games;
  return DOG_RESPONSES.default;
};

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const scrollRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchUserData();
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 600, useNativeDriver: true
    }).start();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setMessages([{
            id: 1,
            sender: 'dog',
            text: `🐾 Hey ${data.name || 'friend'}! I'm your ${data.breed?.name || 'pup'} and I'm so happy to see you! How are you feeling today? I'm all ears! 💜`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }]);
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

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    const userInput = input.trim();
    setInput('');
    setLoading(true);

    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 800));

    const responses = getResponse(userInput);
    const reply = responses[Math.floor(Math.random() * responses.length)];

    setMessages(prev => [...prev, {
      id: Date.now() + 1,
      sender: 'dog',
      text: reply,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);

    // Update chat count in Firebase
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          chatCount: increment(1),
        });
      }
    } catch (e) { console.log(e); }

    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.dogAvatar}>{getDogEmoji()}</Text>
        <View>
          <Text style={styles.dogName}>{userData?.breed?.name || 'Your Pup'}</Text>
          <Text style={styles.onlineText}>● Online & listening 💜</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}>
        {messages.map((msg) => (
          <Animated.View
            key={msg.id}
            style={[
              styles.msgRow,
              msg.sender === 'user' && styles.msgRowUser,
              { opacity: fadeAnim }
            ]}>
            {msg.sender === 'dog' && (
              <Text style={styles.msgAvatar}>{getDogEmoji()}</Text>
            )}
            <View style={[
              styles.msgBubble,
              msg.sender === 'user' ? styles.msgBubbleUser : styles.msgBubbleDog
            ]}>
              <Text style={styles.msgText}>{msg.text}</Text>
              <Text style={styles.msgTime}>{msg.time}</Text>
            </View>
          </Animated.View>
        ))}
        {loading && (
          <View style={styles.msgRow}>
            <Text style={styles.msgAvatar}>{getDogEmoji()}</Text>
            <View style={styles.typingBubble}>
              <ActivityIndicator size="small" color="#6c63ff" />
              <Text style={styles.typingText}>
                {userData?.breed?.name?.split(' ')[0] || 'Buddy'} is thinking...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={`Talk to ${userData?.breed?.name?.split(' ')[0] || 'Buddy'}...`}
          placeholderTextColor="#555"
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={300}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || loading}>
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 20, paddingTop: 50,
    borderBottomWidth: 1, borderBottomColor: '#6c63ff22',
    backgroundColor: '#16213e',
  },
  dogAvatar: { fontSize: 40 },
  dogName: { fontSize: 16, fontWeight: '800', color: '#fff' },
  onlineText: { fontSize: 11, color: '#6bffb8', marginTop: 2 },
  messagesContainer: { flex: 1, padding: 16 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  msgRowUser: { flexDirection: 'row-reverse' },
  msgAvatar: { fontSize: 24, marginHorizontal: 6 },
  msgBubble: { maxWidth: '75%', borderRadius: 18, padding: 12 },
  msgBubbleDog: {
    backgroundColor: '#6c63ff22', borderWidth: 1,
    borderColor: '#6c63ff44', borderBottomLeftRadius: 4,
  },
  msgBubbleUser: { backgroundColor: '#6c63ff', borderBottomRightRadius: 4 },
  msgText: { fontSize: 14, color: '#fff', lineHeight: 20 },
  msgTime: { fontSize: 10, color: '#ffffff66', marginTop: 4, textAlign: 'right' },
  typingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#6c63ff22', borderRadius: 18, padding: 12,
    borderWidth: 1, borderColor: '#6c63ff44',
  },
  typingText: { fontSize: 12, color: '#a0a0c0' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 16, borderTopWidth: 1, borderTopColor: '#6c63ff22',
    backgroundColor: '#16213e',
  },
  input: {
    flex: 1, backgroundColor: '#1a1a2e', color: '#fff',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, borderWidth: 1, borderColor: '#6c63ff44',
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#6c63ff', borderRadius: 50,
    width: 44, height: 44, justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#6c63ff44' },
  sendIcon: { color: '#fff', fontSize: 16 },
});