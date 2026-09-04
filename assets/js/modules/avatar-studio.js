import { avatarData, AVATAR_PRESETS, DEFAULT_AVATAR, GAME_CHARACTERS } from "./avatar.js";
import { saveUserDoc } from "./store.js";
import { $ } from "./core.js";

const GAME_CHARACTER_IMAGES = {
  kratos: "https://vignette.wikia.nocookie.net/godofwar/images/5/52/Kratos.png/revision/latest?cb=20180220162022",
  aloy: "https://cdn.mos.cms.futurecdn.net/v2/t%3A0%2Cl%3A420%2Ccw%3A1080%2Cch%3A1080%2Cq%3A80%2Cw%3A1080/7E2bttidPc9eveAwBNYXmG.jpg",
  geralt: "https://assetsio.gnwcdn.com/the-witcher-3-eleito-o-jogo-do-ano-nos-the-game-awards-1449201813732.jpg?auto=webp&enable=upscale&fit=crop&format=png&height=1200&quality=100&width=1200",
  link: "https://cdn.wikimg.net/en/zeldawiki/images/thumb/3/30/HW_Link_Render.png/1200px-HW_Link_Render.png",
  sonic: "https://static.zerochan.net/Sonic.the.Hedgehog.%28Character%29.1024.4209105.webp",
  lara: "https://midia.gruposinos.com.br/_midias/jpg/2016/04/29/photos_of_lara_croft_from_tomb_raider_4-1454636.jpg",
  samus: "https://images2.wikia.nocookie.net/__cb20100215035740/metroid/images/5/58/Mprime_07_big.jpg",
  mario: "https://i.pinimg.com/474x/a9/07/46/a907462c092ecc710299d978f1d3605b.jpg",
  dante: "https://i.pinimg.com/originals/99/85/18/9985183f76e6c81617a5cb2f47ff96e4.jpg",
  "master-chief": "https://s3.crackedcdn.com/phpimages/article/2/9/5/829295_800x450.jpg",
  "2b": "https://vignette.wikia.nocookie.net/vsbattles/images/3/38/YoRHa_No.2_Type_B.png/revision/latest?cb=20170520232846",
};

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

  const render = () => {
    const character = selectedCharacter();
    root.innerHTML = `<button type="button" class="avatar-trigger" id="openAvatarPicker" ${editable ? "" : "disabled"}><img src="${avatarData(state)}" alt="Current avatar"><span class="avatar-trigger-copy"><strong>${character ? character.name : "Choose your avatar"}</strong><span>${character ? `${character.game} · Game character` : "Open the character picker to choose an avatar"}</span></span><span class="avatar-trigger-arrow">›</span></button>`;
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
    modal.innerHTML = `<section class="avatar-modal" role="dialog" aria-modal="true" aria-labelledby="avatarPickerTitle"><div class="avatar-modal-head"><div><h2 id="avatarPickerTitle">Choose your avatar</h2><p>Pick a character from a game, or use one of progLog's original pixel avatars.</p></div><button type="button" class="avatar-modal-close" aria-label="Close"><i data-lucide="x"></i></button></div><div class="avatar-modal-section"><div class="avatar-modal-section-head"><h3>Game characters</h3><span>${GAME_CHARACTERS.length} available</span></div><div class="character-row">${GAME_CHARACTERS.map((c) => `<button type="button" class="character-card ${state.character === c.id ? "selected" : ""}" data-character="${c.id}"><img src="${GAME_CHARACTER_IMAGES[c.id] || ""}" alt="${c.name}" loading="lazy"><span class="character-card-copy"><strong>${c.name}</strong><small>${c.game}</small></span></button>`).join("")}</div></div><div class="avatar-modal-section"><div class="avatar-modal-section-head"><h3>progLog originals</h3><span>Custom pixel avatars</span></div><div class="avatar-choice-grid">${AVATAR_PRESETS.map((p) => `<button type="button" class="avatar-choice ${!state.character && p.id === state.preset ? "selected" : ""}" data-preset="${p.id}"><img src="${avatarData(p)}" alt="${p.name}"><span>${p.name}</span></button>`).join("")}</div></div><div class="avatar-modal-footer"><button type="button" class="btn" id="cancelAvatarPicker">Cancel</button><button type="button" class="btn btn-primary" id="confirmAvatarPicker">Use this avatar</button></div></section>`;
    document.body.appendChild(modal);
    window.lucide?.createIcons();

    const close = () => modal.remove();
    modal.querySelector(".avatar-modal-close")?.addEventListener("click", close);
    modal.querySelector("#cancelAvatarPicker")?.addEventListener("click", close);
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });

    modal.querySelectorAll("[data-character]").forEach((b) => b.addEventListener("click", () => {
      const c = GAME_CHARACTERS.find((x) => x.id === b.dataset.character);
      if (!c) return;
      state = { ...state, character: c.id, game: c.game, imageUrl: GAME_CHARACTER_IMAGES[c.id], preset: "" };
      modal.querySelectorAll(".character-card,.avatar-choice").forEach((x) => x.classList.remove("selected"));
      b.classList.add("selected");
    }));

    modal.querySelectorAll("[data-preset]").forEach((b) => b.addEventListener("click", () => {
      const p = AVATAR_PRESETS.find((x) => x.id === b.dataset.preset);
      if (!p) return;
      state = { ...state, ...p, preset: p.id, character: "", game: "", imageUrl: "" };
      modal.querySelectorAll(".character-card,.avatar-choice").forEach((x) => x.classList.remove("selected"));
      b.classList.add("selected");
    }));

    modal.querySelector("#confirmAvatarPicker")?.addEventListener("click", async () => {
      const button = modal.querySelector("#confirmAvatarPicker");
      button.disabled = true;
      button.textContent = "Saving…";
      try {
        await persist();
        close();
        render();
      } catch (e) {
        console.error(e);
        button.disabled = false;
        button.textContent = "Try again";
      }
    });
  };

  render();
}
