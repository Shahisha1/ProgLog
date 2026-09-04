import { avatarData, AVATAR_PRESETS, DEFAULT_AVATAR, GAME_CHARACTERS, GAME_CHARACTER_IMAGES } from "./avatar.js";
import { saveUserDoc } from "./store.js";
import { $ } from "./core.js";

const ensureStyles = () => {
  if (document.querySelector('link[data-profile-settings-style]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `${location.pathname.includes("/pages/") ? "../" : "./"}assets/css/profile-settings.css`;
  link.dataset.profileSettingsStyle = "1";
  document.head.appendChild(link);
};

export function setupAvatarStudio(initial = {}, editable = true) {
  const root = $("#avatarStudio");
  if (!root) return;
  ensureStyles();
  let state = { ...DEFAULT_AVATAR, ...(initial?.avatar || initial) };
  const selectedCharacter = () => GAME_CHARACTERS.find((x) => x.id === state.character);
  const groupedCharacters = () => {
    const groups = new Map();
    GAME_CHARACTERS.forEach((c) => {
      if (!groups.has(c.game)) groups.set(c.game, []);
      groups.get(c.game).push(c);
    });
    return [...groups.entries()];
  };

  const render = () => {
    const character = selectedCharacter();
    root.innerHTML = `<button type="button" class="avatar-trigger" id="openAvatarPicker" ${editable ? "" : "disabled"}><img src="${avatarData(state)}" alt="Current avatar"><span class="avatar-trigger-copy"><strong>${character ? character.name : "Edit avatar"}</strong><span>${character ? `${character.game} · Selected character` : "Choose a game character"}</span></span><span class="avatar-trigger-arrow">›</span></button>`;
    $("#openAvatarPicker")?.addEventListener("click", openPicker);
  };

  const persist = async () => {
    localStorage.setItem("proglog-avatar", JSON.stringify(state));
    if (editable) await saveUserDoc({ avatar: state, avatarPreset: state.preset || "character" });
    document.querySelectorAll("[data-user-avatar]").forEach((x) => (x.src = avatarData(state)));
  };

  const openPicker = () => {
    const modal = document.createElement("div");
    modal.className = "avatar-modal-backdrop";
    const rows = groupedCharacters().map(([game, chars], index) => `<section class="netflix-avatar-row" data-avatar-row="${index}"><div class="netflix-row-head"><div><span class="netflix-row-kicker">Game</span><h3>${game}</h3></div><div class="netflix-row-controls"><button type="button" class="avatar-row-arrow" data-scroll="prev" aria-label="Previous ${game} characters">‹</button><button type="button" class="avatar-row-arrow" data-scroll="next" aria-label="Next ${game} characters">›</button></div></div><div class="netflix-character-track">${chars.map((c) => `<button type="button" class="netflix-character ${state.character === c.id ? "selected" : ""}" data-character="${c.id}"><span class="netflix-character-art"><img src="${GAME_CHARACTER_IMAGES[c.id] || ""}" alt="${c.name}" loading="lazy" onerror="this.classList.add('image-missing')"></span><strong>${c.name}</strong></button>`).join("")}</div></section>`).join("");
    modal.innerHTML = `<section class="avatar-modal netflix-avatar-modal" role="dialog" aria-modal="true" aria-labelledby="avatarPickerTitle"><div class="avatar-modal-head"><div><span class="netflix-eyebrow">Profile icon library</span><h2 id="avatarPickerTitle">Choose your avatar</h2><p>Browse characters by game and pick the one that feels like you.</p></div><button type="button" class="avatar-modal-close" aria-label="Close"><i data-lucide="x"></i></button></div><div class="netflix-avatar-library">${rows}</div><section class="netflix-avatar-row originals-row"><div class="netflix-row-head"><div><span class="netflix-row-kicker">progLog</span><h3>Original avatars</h3></div><span class="netflix-row-count">${AVATAR_PRESETS.length} styles</span></div><div class="netflix-character-track">${AVATAR_PRESETS.map((p) => `<button type="button" class="netflix-character original-character ${!state.character && p.id === state.preset ? "selected" : ""}" data-preset="${p.id}"><span class="netflix-character-art"><img src="${avatarData(p)}" alt="${p.name}"></span><strong>${p.name}</strong></button>`).join("")}</div></section><div class="avatar-modal-footer"><span class="avatar-selection-note">${GAME_CHARACTERS.length} characters across ${groupedCharacters().length} games</span><div><button type="button" class="btn" id="cancelAvatarPicker">Cancel</button><button type="button" class="btn btn-primary" id="confirmAvatarPicker">Use this avatar</button></div></div></section>`;
    document.body.appendChild(modal);
    window.lucide?.createIcons();

    const close = () => modal.remove();
    modal.querySelector(".avatar-modal-close")?.addEventListener("click", close);
    modal.querySelector("#cancelAvatarPicker")?.addEventListener("click", close);
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
    modal.querySelectorAll("[data-scroll]").forEach((button) => button.addEventListener("click", () => {
      const track = button.closest(".netflix-avatar-row")?.querySelector(".netflix-character-track");
      track?.scrollBy({ left: button.dataset.scroll === "next" ? 430 : -430, behavior: "smooth" });
    }));
    modal.querySelectorAll("[data-character]").forEach((b) => b.addEventListener("click", () => {
      const c = GAME_CHARACTERS.find((x) => x.id === b.dataset.character);
      if (!c) return;
      state = { ...state, character: c.id, game: c.game, imageUrl: GAME_CHARACTER_IMAGES[c.id], preset: "" };
      modal.querySelectorAll(".netflix-character").forEach((x) => x.classList.remove("selected"));
      b.classList.add("selected");
    }));
    modal.querySelectorAll("[data-preset]").forEach((b) => b.addEventListener("click", () => {
      const p = AVATAR_PRESETS.find((x) => x.id === b.dataset.preset);
      if (!p) return;
      state = { ...state, ...p, preset: p.id, character: "", game: "", imageUrl: "" };
      modal.querySelectorAll(".netflix-character").forEach((x) => x.classList.remove("selected"));
      b.classList.add("selected");
    }));
    modal.querySelector("#confirmAvatarPicker")?.addEventListener("click", async () => {
      const button = modal.querySelector("#confirmAvatarPicker");
      button.disabled = true;
      button.textContent = "Saving…";
      try { await persist(); close(); render(); }
      catch (e) { console.error(e); button.disabled = false; button.textContent = "Try again"; }
    });
  };
  render();
}
