// firebase.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

// Firebase config (use your own config)
const firebaseConfig = {
    apiKey: "AIzaSyCt5WTn46K0jf6dpGlUgTV_mBZT5t_ALog",
    authDomain: "eighthgroupfriends.firebaseapp.com",
    databaseURL: "https://eighthgroupfriends-default-rtdb.firebaseio.com",
    projectId: "eighthgroupfriends",
    storageBucket: "eighthgroupfriends.firebasestorage.app",
    messagingSenderId: "901906106067",
    appId: "1:901906106067:web:43f50a9423c862e2d4b626",
    measurementId: "G-QCBGVLK2PK"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
