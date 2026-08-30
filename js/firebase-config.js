// Firebase Configuration
// Replace these values with your Firebase project config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
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

// Configure Firestore settings
db.settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});
db.enablePersistence()
  .catch(function(err) {
    console.warn('Firestore persistence error:', err);
  });

// Export for use in other scripts
window.PROGLOG_FIREBASE = {
  auth: auth,
  db: db,
  storage: storage,
  config: firebaseConfig
};

// Track authentication state
window.PROGLOG_FIREBASE.auth.onAuthStateChanged(function(user) {
  if (user) {
    console.log('User signed in:', user.uid);
    localStorage.setItem('proglog_firebase_user', JSON.stringify({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    }));
  } else {
    console.log('User signed out');
    localStorage.removeItem('proglog_firebase_user');
  }
});