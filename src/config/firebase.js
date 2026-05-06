import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBy37I74ghai63aTSVzhq5H0WGPwQBwdK8",
  authDomain: "emopup-3aa45.firebaseapp.com",
  projectId: "emopup-3aa45",
  storageBucket: "emopup-3aa45.firebasestorage.app",
  messagingSenderId: "337751861118",
  appId: "1:337751861118:web:0c98f6c8fc0567ff95752f",
  measurementId: "G-D2YNFCKF88"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;