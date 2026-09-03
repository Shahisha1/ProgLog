import { auth, configured, googleProvider } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signInAnonymously,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { $, showToast } from "./core.js";
import { seedDemoProfile, seedLocalDemoProfile } from "./demo.js";
export function initAuth() {
  const form = $("#authForm");
  if (!form) return;
  let mode = "signin";
  const setMode = (m) => {
    mode = m;
    $("#authHeading").textContent =
      m === "signin" ? "Welcome back" : "Create your progLog account";
    $("#authSubmit").textContent =
      m === "signin" ? "Sign in" : "Create account";
    $("#authSwitch").textContent =
      m === "signin"
        ? "New to progLog? Create an account"
        : "Already have an account? Sign in";
    $("#passwordConfirmField").classList.toggle("hidden", m !== "signup");
  };
  setMode("signin");
  $("#authSwitch").addEventListener("click", (e) => {
    e.preventDefault();
    setMode(mode === "signin" ? "signup" : "signin");
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!configured || !auth)
      return showToast("Add your Firebase Web App config first.", "error");
    const email = $("#authEmail").value.trim(),
      p = $("#authPassword").value,
      c = $("#authPasswordConfirm").value;
    if (!email || p.length < 6)
      return showToast("Enter an email and a 6+ character password.", "error");
    if (mode === "signup" && p !== c)
      return showToast("Passwords do not match.", "error");
    try {
      if (mode === "signup")
        await createUserWithEmailAndPassword(auth, email, p);
      else await signInWithEmailAndPassword(auth, email, p);
      location.href = "../overview.html";
    } catch (err) {
      showToast(
        err.message
          .replace("Firebase: ", "")
          .replace(/ \(auth\/[^)]+\)\.?$/, ""),
        "error",
      );
    }
  });
  $("#googleAuth")?.addEventListener("click", async () => {
    if (!configured || !auth)
      return showToast("Configure Firebase first.", "error");
    try {
      await signInWithPopup(auth, googleProvider);
      location.href = "../overview.html";
    } catch (e) {
      showToast(e.message, "error");
    }
  });
  $("#demoAuth")?.addEventListener("click", async () => {
    const b = $("#demoAuth");
    b.disabled = true;
    b.innerHTML = '<i data-lucide="loader-circle"></i> Starting demo…';
    try {
      seedLocalDemoProfile();
      try {
        if (configured && auth) {
          await signInAnonymously(auth);
          await seedDemoProfile();
        }
      } catch (e) {
        console.info("Using local demo session:", e.message);
      }
      sessionStorage.setItem("proglog-demo-session", "1");
      location.href = "../overview.html";
    } catch (e) {
      b.disabled = false;
      b.innerHTML = '<i data-lucide="play-circle"></i> Enter demo profile';
      showToast("Could not start the demo profile.", "error");
    } finally {
      window.lucide?.createIcons();
    }
  });
  $("#resetPassword")?.addEventListener("click", async () => {
    if (!configured) return showToast("Configure Firebase first.", "error");
    const email = $("#authEmail").value.trim();
    if (!email) return showToast("Enter your email first.", "error");
    try {
      await sendPasswordResetEmail(auth, email);
      showToast("Password reset email sent.");
    } catch (e) {
      showToast(e.message, "error");
    }
  });
  window.lucide?.createIcons();
}
