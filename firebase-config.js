// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBsUD_rxmmW5BCFK37k_0LxF1RQzYsQThI",
    authDomain: "kiblat-mpi-2026.firebaseapp.com",
    projectId: "kiblat-mpi-2026",
    storageBucket: "kiblat-mpi-2026.firebasestorage.app",
    messagingSenderId: "466657139642",
    appId: "1:466657139642:web:6981463f755ecb1b82db83",
    measurementId: "G-D77ENTXG61"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

// Export untuk digunakan di script.js
export { db, storage, analytics };
