"use client" // Explicitly mark as a client module

import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"

// Using the hardcoded config values you provided earlier
const firebaseConfig = {
  apiKey: "AIzaSyDbp5S3KgUyB4hFsJo1DNGNZE_OoywUccI",
  authDomain: "farm-2e0be.firebaseapp.com",
  projectId: "farm-2e0be",
  storageBucket: "farm-2e0be.appspot.com",
  messagingSenderId: "959621827551",
  appId: "1:959621827551:web:4f32c91b7d3609d8d0126a",
  measurementId: "G-X49LESK80M",
}

let app

// Ensure Firebase is initialized only once
if (!getApps().length) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApp() // Get the already initialized app
}

export const auth = getAuth(app)
export const storage = getStorage(app)
