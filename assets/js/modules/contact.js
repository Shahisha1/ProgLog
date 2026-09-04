import { auth, db } from "./firebase.js";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { $, showToast } from "./core.js";
export function initContact() {
  const form = $("#contactForm");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
      name: $("#contactName").value.trim(),
      email: $("#contactEmail").value.trim(),
      subject: $("#contactSubject").value.trim(),
      message: $("#contactMessage").value.trim(),
    };
    if (!data.name || !data.email || !data.message)
      return showToast("Complete the required fields.", "error");
    try {
      if (!db || !auth?.currentUser) throw new Error("signin");
      await addDoc(collection(db, "contactMessages"), {
        ...data,
        uid: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
      location.href = "thank-you.html";
    } catch {
      localStorage.setItem("proglog.lastEnquiry", JSON.stringify(data));
      location.href = "thank-you.html";
    }
  });
}
