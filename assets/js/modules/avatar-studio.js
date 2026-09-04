import { avatarData, AVATAR_PRESETS, DEFAULT_AVATAR } from "./avatar.js";
import { saveUserDoc } from "./store.js";
import { $ } from "./core.js";

export function setupAvatarStudio(initial = {}, editable = true) {
  const root = $("#avatarStudio");
  if (!root) return;
  let state = { ...DEFAULT_AVATAR, ...(initial?.avatar || initial) };
  const render = () => {
    root.innerHTML = `
   <div class="avatar-studio-head"><div><span class="eyebrow">Character</span><h2>Choose your avatar</h2><p class="muted">Pick a pixel character, then tune the colors to make it yours.</p></div><div class="avatar-preview-wrap"><img id="avatarPreview" class="avatar-preview" src="${avatarData(state)}" alt="Current pixel avatar"><span class="avatar-preview-label">Your avatar</span></div></div>
   <div class="avatar-preset-grid">${AVATAR_PRESETS.map((p) => `<button type="button" class="avatar-preset ${p.id === state.preset ? "selected" : ""}" data-preset="${p.id}" ${editable ? "" : "disabled"}><img src="${avatarData(p)}" alt="${p.name} avatar"><span>${p.name}</span></button>`).join("")}</div>
   <div class="avatar-custom-grid">
     ${[
       ["skin", "Skin"],
       ["hair", "Hair"],
       ["shirt", "Outfit"],
       ["background", "Backdrop"],
       ["accent", "Accent"],
     ]
       .map(
         ([key, label]) =>
           `<label class="color-field"><span>${label}</span><input type="color" data-avatar-color="${key}" value="${state[key] || DEFAULT_AVATAR[key] || "#ffffff"}" ${editable ? "" : "disabled"}></label>`,
       )
       .join("")}
   </div>
   ${editable ? '<div class="avatar-studio-actions"><button type="button" class="btn btn-primary" id="saveAvatar"><i data-lucide="save"></i> Save avatar</button><button type="button" class="btn" id="randomAvatar"><i data-lucide="shuffle"></i> Surprise me</button></div>' : ""}`;
    root.querySelectorAll("[data-preset]").forEach((b) =>
      b.addEventListener("click", () => {
        const p = AVATAR_PRESETS.find((x) => x.id === b.dataset.preset);
        if (!p) return;
        state = { ...state, ...p, preset: p.id };
        render();
      }),
    );
    root.querySelectorAll("[data-avatar-color]").forEach((i) =>
      i.addEventListener("input", () => {
        state[i.dataset.avatarColor] = i.value;
        const preview = $("#avatarPreview");
        if (preview) preview.src = avatarData(state);
      }),
    );
    $("#randomAvatar")?.addEventListener("click", () => {
      const p =
        AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)];
      state = { ...state, ...p, preset: p.id };
      render();
    });
    $("#saveAvatar")?.addEventListener("click", async () => {
      const b = $("#saveAvatar");
      b.disabled = true;
      try {
        localStorage.setItem("proglog-avatar", JSON.stringify(state));
        await saveUserDoc({ avatar: state, avatarPreset: state.preset });
        document
          .querySelectorAll("[data-user-avatar]")
          .forEach((x) => (x.src = avatarData(state)));
        b.innerHTML = '<i data-lucide="check"></i> Saved';
        setTimeout(() => {
          b.innerHTML = '<i data-lucide="save"></i> Save avatar';
          b.disabled = false;
          window.lucide?.createIcons();
        }, 1000);
      } catch (e) {
        b.disabled = false;
        console.error(e);
      } finally {
        window.lucide?.createIcons();
      }
    });
    window.lucide?.createIcons();
  };
  render();
}
