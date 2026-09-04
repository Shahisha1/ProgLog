import {
  initializeApp,
  getApps,
  getApp,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { firebaseConfig } from "../firebase-config.js";
export let configured = false,
  app = null,
  auth = null,
  db = null,
  googleProvider = null;
const usable = Boolean(
  firebaseConfig?.apiKey && firebaseConfig?.projectId && firebaseConfig?.appId,
);
if (usable) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    configured = true;
  } catch (e) {
    console.warn("Firebase init failed", e);
  }
}
export const getCurrentUser = () => auth?.currentUser || null;
