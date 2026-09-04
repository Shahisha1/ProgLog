import { db } from "./firebase.js";
import {
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { avatarData, AVATAR_PRESETS, DEFAULT_AVATAR } from "./avatar.js";
import { $, esc } from "./core.js";

export async function maybeOnboard(user) {
  if (
    !user ||
    user.isDemo ||
    !db ||
    !user.uid ||
    !location.pathname.endsWith("overview.html")
  )
    return;
  let done = false;
  try {
    done = localStorage.getItem(`proglog-onboarding-${user.uid}`) === "1";
  } catch (e) {}
  if (done) return;
  const modal = document.createElement("div");
  modal.className = "onboarding-backdrop";
  modal.innerHTML = `
    <section class="onboarding" role="dialog" aria-modal="true" aria-labelledby="onboardTitle">
      <button class="onboarding-close" type="button" aria-label="Close setup"><i data-lucide="x"></i></button>
      <div class="onboarding-art"><img src="${location.pathname.includes("/pages/") ? "../" : "./"}assets/images/proglog-logo.png" alt="progLog controller logo"></div>
      <div class="onboarding-body">
        <div class="eyebrow">Quick setup</div><h2 id="onboardTitle">Make progLog yours.</h2>
        <p class="onboard-copy">Pick a name and a character. You can change everything later from Profile.</p>
        <div class="field"><label for="onboardName">Display name</label><input id="onboardName" value="${esc(user.displayName || "Gamer")}" maxlength="32" autocomplete="nickname"></div>
        <div class="onboard-label"><span>Choose your character</span><small>8 starting looks</small></div>
        <div class="onboard-avatars">${AVATAR_PRESETS.map((p, i) => `<button type="button" class="onboard-avatar ${i === 0 ? "selected" : ""}" data-preset="${p.id}" aria-label="${p.name}"><img src="${avatarData(p)}" alt=""><span>${p.name}</span></button>`).join("")}</div>
        <div class="onboard-footer"><span class="onboard-step"><i></i><i class="active"></i><i></i></span><button class="btn btn-primary" id="finishOnboarding" type="button">Enter progLog <i data-lucide="arrow-right"></i></button></div>
      </div>
    </section>`;
  document.body.appendChild(modal);
  window.lucide?.createIcons();
  let selected = { ...DEFAULT_AVATAR };
  modal.querySelectorAll("[data-preset]").forEach((b) =>
    b.addEventListener("click", () => {
      modal
        .querySelectorAll(".onboard-avatar")
        .forEach((x) => x.classList.remove("selected"));
      b.classList.add("selected");
      const p = AVATAR_PRESETS.find((x) => x.id === b.dataset.preset);
      if (p) selected = { ...selected, ...p, preset: p.id };
    }),
  );
  const close = () => {
    modal.classList.add("closing");
    setTimeout(() => modal.remove(), 160);
  };
  modal.querySelector(".onboarding-close").addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });
  modal
    .querySelector("#finishOnboarding")
    .addEventListener("click", async () => {
      const btn = modal.querySelector("#finishOnboarding");
      btn.disabled = true;
      btn.innerHTML = "Saving…";
      try {
        const displayName =
          modal.querySelector("#onboardName").value.trim() || "Gamer";
        await setDoc(
          doc(db, "users", user.uid),
          {
            displayName,
            avatar: selected,
            onboardingComplete: true,
            updatedAt: new Date(),
          },
          { merge: true },
        );
        try {
          localStorage.setItem(`proglog-onboarding-${user.uid}`, "1");
          localStorage.setItem("proglog-avatar", JSON.stringify(selected));
        } catch (e) {}
        close();
        setTimeout(() => location.reload(), 180);
      } catch (e) {
        btn.disabled = false;
        btn.innerHTML = "Try again";
        console.error(e);
      }
    });
}
