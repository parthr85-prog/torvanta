import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDTzEhZTYtsddIOkmXIY7WEJDAPqMVj0QU",
  authDomain: "buildo-940cd.firebaseapp.com",
  projectId: "buildo-940cd",
  storageBucket: "buildo-940cd.firebasestorage.app",
  messagingSenderId: "202195180104",
  appId: "1:202195180104:web:f62e63b86ddfe1697f967d"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
