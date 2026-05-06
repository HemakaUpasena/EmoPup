import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';

import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import BreedSelectScreen from './src/screens/BreedSelectScreen.js';
import HomeScreen from './src/screens/HomeScreen';
import MoodScreen from './src/screens/MoodScreen';
import ChatScreen from './src/screens/ChatScreen';
import JournalScreen from './src/screens/JournalScreen';
import FetchGameScreen from './src/screens/FetchGameScreen';
import TrickGameScreen from './src/screens/TrickGameScreen';
import RewardsScreen from './src/screens/RewardsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: '#1a1a2e', borderTopColor: '#6c63ff' },
        tabBarActiveTintColor: '#6c63ff',
        tabBarInactiveTintColor: '#888',
        headerShown: false,
      }}>
      <Tab.Screen name="Home" component={HomeScreen}
        options={{ tabBarIcon: () => <Text>🏠</Text> }} />
      <Tab.Screen name="Mood" component={MoodScreen}
        options={{ tabBarIcon: () => <Text>😊</Text> }} />
      <Tab.Screen name="Chat" component={ChatScreen}
        options={{ tabBarIcon: () => <Text>💬</Text> }} />
      <Tab.Screen name="Journal" component={JournalScreen}
        options={{ tabBarIcon: () => <Text>📔</Text> }} />
      <Tab.Screen name="Rewards" component={RewardsScreen}
        options={{ tabBarIcon: () => <Text>🏆</Text> }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="BreedSelect" component={BreedSelectScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="FetchGame" component={FetchGameScreen} />
        <Stack.Screen name="TrickGame" component={TrickGameScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
