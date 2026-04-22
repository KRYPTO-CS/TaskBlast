// from the firebase docs

/* 
Security Concerns:

Please note that these keys and identifiers are part of the Firebase configuration for a web application. 
They are not considered sensitive information, as they are necessary for the app to connect to Firebase services.
It is important to configure our Firebase security rules as time goes on to protect our database and storage from unauthorized access.

*/

import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  initializeAuth,
} from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAJ5Ftr3TNWIgC6UTWNqiJAz77iYBg2Hpg",
  authDomain: "krypto-project-e3a46.firebaseapp.com",
  databaseURL: "https://krypto-project-e3a46-default-rtdb.firebaseio.com",
  projectId: "krypto-project-e3a46",
  storageBucket: "krypto-project-e3a46.firebasestorage.app",
  messagingSenderId: "712787396331",
  appId: "1:712787396331:web:aea802e61ddad216f8e0ae",
  measurementId: "G-CFG3G1S89B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

function createAuth() {
  try {
    if (Platform.OS === "web") {
      return initializeAuth(app, {
        persistence: browserLocalPersistence,
      });
    }

    const { getReactNativePersistence } = require("firebase/auth/react-native");
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Reuse existing instance during HMR/tests where Auth may already be initialized.
    return getAuth(app);
  }
}

export const auth = createAuth();

export const db = getDatabase(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);