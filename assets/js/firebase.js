import {
  initializeApp,
  getApps,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { firebaseConfig as fallbackConfig } from "./firebase-config.js";

async function loadConfig() {
  try {
    const response = await fetch("/__/firebase/init.json", {
      cache: "no-store",
    });
    if (response.ok) {
      const config = await response.json();
      if (config?.projectId) return config;
    }
  } catch (_) {}
  return fallbackConfig;
}

const config = await loadConfig();
const configured = Boolean(config.apiKey && config.appId && config.projectId);
let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (configured) {
  app = getApps().length ? getApps()[0] : initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
}

export { config, configured, app, auth, db, googleProvider };
