// Buildo/firebaseConfig.js

import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import {
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // ✅ ADD THIS

export const firebaseConfig = {
  apiKey: "AIzaSyDTzEhZTYtsddIOkmXIY7WEJDAPqMVj0QU",
  authDomain: "buildo-940cd.firebaseapp.com",
  projectId: "buildo-940cd",
  storageBucket: "buildo-940cd.firebasestorage.app", // ✅ IMPORTANT FIX
  messagingSenderId: "202195180104",
  appId: "1:202195180104:web:f62e63b86ddfe1697f967d",
};

// 🔥 Initialize Firebase
export const app = initializeApp(firebaseConfig);

// 🔐 Auth with persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// 🗄 Firestore
export const db = getFirestore(app);

// 📦 Storage (THIS FIXES YOUR ERROR)
export const storage = getStorage(app);

// OTP flag (unchanged)
export let otpVerified = false;
export const setOtpVerified = () => {
  otpVerified = true;
};
