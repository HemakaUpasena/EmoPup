import { Audio } from 'expo-av';

export const playWoof = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: 'https://www.soundjay.com/animals/sounds/dog-barking-1.mp3' },
      { shouldPlay: true, volume: 0.5 }
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) sound.unloadAsync();
    });
  } catch (e) { console.log('Sound error:', e); }
};

export const playSuccess = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: 'https://www.soundjay.com/buttons/sounds/button-09.mp3' },
      { shouldPlay: true, volume: 0.6 }
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) sound.unloadAsync();
    });
  } catch (e) { console.log('Sound error:', e); }
};

export const playBounce = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: 'https://www.soundjay.com/misc/sounds/ball-bouncing-1.mp3' },
      { shouldPlay: true, volume: 0.5 }
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) sound.unloadAsync();
    });
  } catch (e) { console.log('Sound error:', e); }
};

export const playTap = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: 'https://www.soundjay.com/buttons/sounds/button-16.mp3' },
      { shouldPlay: true, volume: 0.4 }
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) sound.unloadAsync();
    });
  } catch (e) { console.log('Sound error:', e); }
};

export const playFanfare = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: 'https://www.soundjay.com/misc/sounds/fanfare-1.mp3' },
      { shouldPlay: true, volume: 0.6 }
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) sound.unloadAsync();
    });
  } catch (e) { console.log('Sound error:', e); }
};