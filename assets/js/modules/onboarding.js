import { db } from "./firebase.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { avatarData, AVATAR_PRESETS, DEFAULT_AVATAR, GAME_CHARACTERS, GAME_CHARACTER_IMAGES } from "./avatar.js";
import { $, esc } from "./core.js";

const addStyles = () => {
  if (document.querySelector('link[data-profile-settings-style]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `${location.pathname.includes("/pages/") ? "../" : "./"}assets/css/profile-settings.css`;
  link.dataset.profileSettingsStyle = "1";
  document.head.appendChild(link);
};

export async function maybeOnboard(user) {
  if (!user || user.isDemo || !db || !user.uid || !location.pathname.endsWith("overview.html")) return;
  addStyles();
  let done = false;
  try { done = localStorage.getItem(`proglog-onboarding-${user.uid}`) === "1"; } catch (e) {}
  if (done) return;

  const modal = document.createElement("div");
  modal.className = "onboarding-backdrop";
  modal.innerHTML = `<section class="onboarding" role="dialog" aria-modal="true" aria-labelledby="onboardTitle"><button class="onboarding-close" type="button" aria-label="Close setup"><i data-lucide="x"></i></button><div class="onboarding-art"><img src="${location.pathname.includes("/pages/") ? "../" : "./"}assets/images/proglog-logo.png" alt="progLog controller logo"></div><div class="onboarding-body"><div class="eyebrow">Quick setup</div><h2 id="onboardTitle">Make progLog yours.</h2><p class="onboard-copy">Pick a name and a character. You can change everything later from Profile.</p><div class="field"><label for="onboardName">Display name</label><input id="onboardName" value="${esc(user.displayName || "Gamer")}" maxlength="32" autocomplete="nickname"></div><div class="onboard-label"><span>Your avatar</span><small>Choose one below</small></div><button type="button" class="onboard-avatar-trigger" id="openOnboardAvatar"><img id="onboardAvatarPreview" src="${avatarData(DEFAULT_AVATAR)}" alt="Selected avatar"><span class="onboard-avatar-trigger-copy"><strong id="onboardAvatarName">Choose a character</strong><span id="onboardAvatarGame">Browse characters by game</span></span><span class="avatar-trigger-arrow">›</span></button><div class="onboard-footer"><span class="onboard-step"><i></i><i class="active"></i><i></i></span><button class="btn btn-primary" id="finishOnboarding" type="button">Enter progLog <i data-lucide="arrow-right"></i></button></div></div></section>`;
  document.body.appendChild(modal);
  window.lucide?.createIcons();

  let selected = { ...DEFAULT_AVATAR };
  const groupedCharacters = () => { const groups = new Map(); GAME_CHARACTERS.forEach((c) => { if (!groups.has(c.game)) groups.set(c.game, []); groups.get(c.game).push(c); }); return [...groups.entries()]; };

  const openPicker = () => {
    const picker = document.createElement("div");
    picker.className = "avatar-modal-backdrop onboard-avatar-modal";
    const rows = groupedCharacters().map(([game, chars], index) => `<section class="netflix-avatar-row" data-avatar-row="${index}"><div class="netflix-row-head"><div><span class="netflix-row-kicker">Game</span><h3>${game}</h3></div><div class="netflix-row-controls"><button type="button" class="avatar-row-arrow" data-scroll="prev" aria-label="Previous ${game} characters">‹</button><button type="button" class="avatar-row-arrow" data-scroll="next" aria-label="Next ${game} characters">›</button></div></div><div class="netflix-character-track">${chars.map((c) => `<button type="button" class="netflix-character ${selected.character === c.id ? "selected" : ""}" data-character="${c.id}"><span class="netflix-character-art"><img src="${GAME_CHARACTER_IMAGES[c.id] || ""}" alt="${c.name}" loading="lazy" onerror="this.classList.add('image-missing')"></span><strong>${c.name}</strong></button>`).join("")}</div></section>`).join("");
    picker.innerHTML = `<section class="avatar-modal netflix-avatar-modal" role="dialog" aria-modal="true" aria-labelledby="onboardPickerTitle"><div class="avatar-modal-head"><div><span class="netflix-eyebrow">Profile icon library</span><h2 id="onboardPickerTitle">Choose your avatar</h2><p>Browse your favourite game worlds and choose a character.</p></div><button type="button" class="avatar-modal-close" aria-label="Close"><i data-lucide="x"></i></button></div><div class="netflix-avatar-library">${rows}</div><section class="netflix-avatar-row originals-row"><div class="netflix-row-head"><div><span class="netflix-row-kicker">progLog</span><h3>Original avatars</h3></div><span class="netflix-row-count">${AVATAR_PRESETS.length} styles</span></div><div class="netflix-character-track">${AVATAR_PRESETS.map((p) => `<button type="button" class="netflix-character original-character ${!selected.character && p.id === selected.preset ? "selected" : ""}" data-preset="${p.id}"><span class="netflix-character-art"><img src="${avatarData(p)}" alt="${p.name}"></span><strong>${p.name}</strong></button>`).join("")}</div></section><div class="avatar-modal-footer"><span class="avatar-selection-note">${GAME_CHARACTERS.length} characters across ${groupedCharacters().length} games</span><div><button type="button" class="btn" id="closeOnboardPicker">Cancel</button><button type="button" class="btn btn-primary" id="useOnboardAvatar">Use this avatar</button></div></div></section>`;
    document.body.appendChild(picker);
    window.lucide?.createIcons();
    const close = () => picker.remove();
    picker.querySelector(".avatar-modal-close")?.addEventListener("click", close);
    picker.querySelector("#closeOnboardPicker")?.addEventListener("click", close);
    picker.addEventListener("click", (e) => { if (e.target === picker) close(); });
    picker.querySelectorAll("[data-scroll]").forEach((button) => button.addEventListener("click", () => { const track = button.closest(".netflix-avatar-row")?.querySelector(".netflix-character-track"); track?.scrollBy({ left: button.dataset.scroll === "next" ? 430 : -430, behavior: "smooth" }); }));
    picker.querySelectorAll("[data-character]").forEach((b) => b.addEventListener("click", () => { const c = GAME_CHARACTERS.find((x) => x.id === b.dataset.character); if (!c) return; selected = { ...selected, character:c.id, game:c.game, imageUrl:GAME_CHARACTER_IMAGES[c.id], preset:"" }; picker.querySelectorAll(".netflix-character").forEach((x) => x.classList.remove("selected")); b.classList.add("selected"); }));
    picker.querySelectorAll("[data-preset]").forEach((b) => b.addEventListener("click", () => { const p = AVATAR_PRESETS.find((x) => x.id === b.dataset.preset); if (!p) return; selected = { ...selected, ...p, preset:p.id, character:"", game:"", imageUrl:"" }; picker.querySelectorAll(".netflix-character").forEach((x) => x.classList.remove("selected")); b.classList.add("selected"); }));
    picker.querySelector("#useOnboardAvatar")?.addEventListener("click", () => { const c = GAME_CHARACTERS.find((x) => x.id === selected.character); $("#onboardAvatarPreview").src = avatarData(selected); $("#onboardAvatarName").textContent = c?.name || AVATAR_PRESETS.find((x) => x.id === selected.preset)?.name || "Custom avatar"; $("#onboardAvatarGame").textContent = c?.game || "progLog original pixel avatar"; close(); });
  };

  modal.querySelector("#openOnboardAvatar")?.addEventListener("click", openPicker);
  const close = () => { modal.classList.add("closing"); setTimeout(() => modal.remove(), 160); };
  modal.querySelector(".onboarding-close").addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  modal.querySelector("#finishOnboarding").addEventListener("click", async () => {
    const btn = modal.querySelector("#finishOnboarding"); btn.disabled = true; btn.innerHTML = "Saving…";
    try { const displayName = modal.querySelector("#onboardName").value.trim() || "Gamer"; await setDoc(doc(db, "users", user.uid), { displayName, avatar:selected, onboardingComplete:true, updatedAt:new Date() }, { merge:true }); try { localStorage.setItem(`proglog-onboarding-${user.uid}`, "1"); localStorage.setItem("proglog-avatar", JSON.stringify(selected)); } catch (e) {} close(); setTimeout(() => location.reload(), 180); }
    catch (e) { btn.disabled = false; btn.innerHTML = "Try again"; console.error(e); }
  });
}
