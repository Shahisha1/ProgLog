// Firebase Configuration - Replace with your actual values
const firebaseConfig = {
  apiKey: "AIzaSyDqj2EU0aDBaHTBAG6HLw_YqvMGBlak6oA",
  authDomain: "proglog-fa459.firebaseapp.com",
  projectId: "proglog-fa459",
  storageBucket: "proglog-fa459.firebasestorage.app",
  messagingSenderId: "477703109132",
  appId: "1:477703109132:web:3252acf829a5a66fd18c29",
  measurementId: "G-R958WLQ5BB"
};


// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Enable persistence (offline support)
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch(function(error) {
    console.warn('Auth persistence error:', error);
  });

// Firestore settings
db.settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Enable offline persistence
db.enablePersistence()
  .catch(function(err) {
    console.warn('Firestore persistence error:', err);
  });

// Export for use in other scripts
window.PROGLOG_FIREBASE = {
  auth: auth,
  db: db,
  storage: storage
};

// Track authentication state
auth.onAuthStateChanged(function(user) {
  if (user) {
    console.log('User signed in:', user.uid);
    // Store user info
    localStorage.setItem('proglog_firebase_user', JSON.stringify({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified
    }));
    
    // Load user data from Firestore
    db.collection('users').doc(user.uid).get()
      .then(function(doc) {
        if (doc.exists) {
          var data = doc.data();
          localStorage.setItem('proglog_firebase_profile', JSON.stringify(data));
        }
      })
      .catch(function(err) {
        console.warn('Error loading user profile:', err);
      });
  } else {
    console.log('User signed out');
    localStorage.removeItem('proglog_firebase_user');
    localStorage.removeItem('proglog_firebase_profile');
  }
});