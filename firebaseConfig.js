// Buildo/firebaseConfig.js

import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";


/*
|--------------------------------------------------------------------------
| IMPORTANT
|--------------------------------------------------------------------------
| We are using React Native Firebase (native SDK).
| DO NOT use:
|   - firebase/app
|   - firebase/auth
|   - firebase/firestore
|   - initializeApp()
|   - getFirestore()
|
| All services are auto-initialized from google-services.json
|--------------------------------------------------------------------------
*/

// 🔐 Authentication
export const authInstance = auth();

// 🗄 Firestore
export const db = firestore();

// 📦 Storage
export const storageInstance = storage();

// For backward compatibility (if used in some files)
export { authInstance as auth, storageInstance as storage };

// OTP verification flag (kept as per your existing logic)
export let otpVerified = false;

export const setOtpVerified = () => {
  otpVerified = true;
};

export const resetOtpVerified = () => {
  otpVerified = false;
};