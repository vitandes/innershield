// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';




const firebaseConfig = {
  apiKey: "AIzaSyACvTZXL3Za6skZcI7rqGzuUlSu5kGkmwo",
  authDomain: "innershield-a6c20.firebaseapp.com",
  projectId: "innershield-a6c20",
  storageBucket: "innershield-a6c20.firebasestorage.app",
  messagingSenderId: "723865358816",
  appId: "1:723865358816:web:d66ae20999b038e6769b85",
  measurementId: "G-M9SDHGR03M"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);