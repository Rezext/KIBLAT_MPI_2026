// Firebase Configuration
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
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Collection references
const todoCollection = db.collection('todos');
const jadwalCollection = db.collection('jadwal');
const absensiCollection = db.collection('absensi');
const absensiSessionsCollection = db.collection('absensi_sessions');

console.log('🔥 Firebase initialized successfully!');
