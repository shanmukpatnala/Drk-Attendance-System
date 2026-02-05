// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  updateDoc,
  doc,
  query,
  onSnapshot,
  orderBy,
  serverTimestamp,
  where,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyC7fsX00zywhuvCzR_h8xTzv7V47ffy578",
  authDomain: "drk-attendance-app.firebaseapp.com",
  projectId: "drk-attendance-app",
  storageBucket: "drk-attendance-app.firebasestorage.app",
  messagingSenderId: "652472229762",
  appId: "1:652472229762:web:abe2cfa416c1ec6e0c799b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const appId = "drk-attendance-app";

export {
  app,
  auth,
  db,
  storage,
  appId,
  signInAnonymously,
  onAuthStateChanged,
  collection,
  addDoc,
  setDoc,
  updateDoc,
  doc,
  query,
  onSnapshot,
  orderBy,
  serverTimestamp,
  where,
  getDocs,
  getDoc,
  storageRef,
  uploadBytes,
  getDownloadURL
};
