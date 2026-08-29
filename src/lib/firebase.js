import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase web app config. These are public client identifiers (they ship in
// every deployed bundle); env vars can override them per environment.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDs6tU-jj1f6y_fKgZz8N9TSVkc-x5hYWc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "baseball-sigs.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "baseball-sigs",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "baseball-sigs.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "488467011165",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:488467011165:web:30e52303a1d41e93855fb4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
