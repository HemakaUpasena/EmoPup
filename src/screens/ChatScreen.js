import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Animated, KeyboardAvoidingView,
  Platform, ActivityIndicator
} from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
          // Welcome message
          setMessages([{
            id: 1,
            sender: 'dog',
            text: `🐾 Hey ${data.name || 'friend'}! I'm ${data.breed?.name || 'your pup'} and I'm so happy to see you! How are you feeling today? I'm all ears! 💜`,
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

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          system: `You are ${userData?.breed?.name || 'a friendly dog'}, an AI-powered virtual emotional support dog in the EmoPup app. Your personality is: ${userData?.breed?.personality || 'warm and caring'}. 
          
You are talking to ${userData?.name || 'a user'} who may be introverted and looking for emotional support and companionship.

Rules:
- Always respond as the dog, using dog-related expressions naturally (tail wagging, paw, woof etc.)
- Be warm, empathetic and supportive
- Keep responses short (2-4 sentences max)
- Never give clinical advice - always suggest professional help for serious issues
- Use emojis naturally
- Detect the user's emotional tone and respond accordingly
- Occasionally suggest playing a game or journaling if user seems stressed`,
          messages: [
            ...messages.map(m => ({
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: m.text,
            })),
            { role: 'user', content: userInput }
          ],
        }),
      });

      const data = await response.json();
      const dogReply = data.content?.[0]?.text || "Woof! I'm having trouble thinking right now 🐾 Try again?";

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'dog',
        text: dogReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'dog',
        text: '🐾 Woof! Something went wrong. But I\'m still here for you! Try again?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }
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
              <Text style={styles.typingText}>Buddy is thinking...</Text>
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