const PRESETS = [
  {
    id: "wanderer",
    name: "Wanderer",
    skin: "#f3c7a6",
    hair: "#3b2630",
    shirt: "#6f42d8",
    accent: "#f0b94b",
  },
  {
    id: "ranger",
    name: "Ranger",
    skin: "#d99d76",
    hair: "#1e252f",
    shirt: "#3f8f72",
    accent: "#d2b542",
  },
  {
    id: "mage",
    name: "Mage",
    skin: "#f1c5a4",
    hair: "#5a315f",
    shirt: "#7956c7",
    accent: "#b88cff",
  },
  {
    id: "rogue",
    name: "Rogue",
    skin: "#b97858",
    hair: "#171a20",
    shirt: "#35495e",
    accent: "#d97b5d",
  },
  {
    id: "pilot",
    name: "Pilot",
    skin: "#e4ad83",
    hair: "#7b4f31",
    shirt: "#c85b4b",
    accent: "#e8d26a",
  },
  {
    id: "knight",
    name: "Knight",
    skin: "#c58b6a",
    hair: "#302f3a",
    shirt: "#51647c",
    accent: "#d6d9e1",
  },
  {
    id: "builder",
    name: "Builder",
    skin: "#f0bd92",
    hair: "#7a4a2c",
    shirt: "#d28a32",
    accent: "#63a6d8",
  },
  {
    id: "neon",
    name: "Neon",
    skin: "#d89c86",
    hair: "#27204a",
    shirt: "#3e75c9",
    accent: "#e36dd8",
  },
];
const SKINS = [
  "#f3c7a6",
  "#e4ad83",
  "#d99d76",
  "#c58b6a",
  "#b97858",
  "#8f5a45",
];
const HAIRS = [
  "#171a20",
  "#3b2630",
  "#5a315f",
  "#7a4a2c",
  "#302f3a",
  "#27204a",
  "#d6a03c",
];
const SHIRTS = [
  "#6f42d8",
  "#3f8f72",
  "#7956c7",
  "#35495e",
  "#c85b4b",
  "#51647c",
  "#d28a32",
  "#3e75c9",
];
const BACKGROUNDS = [
  "#efe3ff",
  "#e8f2ff",
  "#fff0d2",
  "#e3f3e9",
  "#f6e2ea",
  "#e9e6f7",
];
export const AVATAR_PRESETS = PRESETS;
export const DEFAULT_AVATAR = {
  preset: "wanderer",
  skin: PRESETS[0].skin,
  hair: PRESETS[0].hair,
  shirt: PRESETS[0].shirt,
  accent: PRESETS[0].accent,
  background: BACKGROUNDS[0],
};
export function avatarOptions() {
  return {
    skins: SKINS,
    hairs: HAIRS,
    shirts: SHIRTS,
    backgrounds: BACKGROUNDS,
  };
}
function esc(v) {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
export function avatarData(input = {}) {
  const p = PRESETS.find((x) => x.id === input.preset) || PRESETS[0];
  const a = { ...DEFAULT_AVATAR, ...p, ...input };
  const px = 16,
    rect = (x, y, w, h, c) =>
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${esc(c)}"/>`;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">`;
  s += rect(0, 0, 16, 16, a.background);
  // shadow
  s += rect(3, 14, 10, 1, "#00000022");
  // hair/back + ears + face
  s += rect(4, 4, 8, 8, a.skin);
  s += rect(3, 6, 1, 4, a.skin);
  s += rect(12, 6, 1, 4, a.skin);
  s += rect(4, 3, 8, 2, a.hair);
  s += rect(3, 4, 2, 3, a.hair);
  s += rect(11, 4, 2, 3, a.hair);
  s += rect(5, 2, 6, 1, a.hair);
  // eyes / nose
  s += rect(5, 7, 1, 1, "#16181d");
  s += rect(10, 7, 1, 1, "#16181d");
  s += rect(7, 8, 2, 1, "#b56f61");
  // neck + shirt
  s += rect(7, 10, 2, 2, a.skin);
  s += rect(4, 11, 8, 4, a.shirt);
  s += rect(3, 12, 1, 3, a.shirt);
  s += rect(12, 12, 1, 3, a.shirt);
  // collar / accent
  s += rect(6, 11, 4, 1, a.accent);
  s += rect(7, 12, 2, 2, a.accent);
  // tiny accessory unique to preset
  if (a.preset === "mage")
    s += rect(12, 2, 2, 1, a.accent) + rect(13, 3, 1, 2, a.accent);
  if (a.preset === "ranger")
    s += rect(2, 9, 1, 3, a.accent) + rect(13, 9, 1, 3, a.accent);
  if (a.preset === "pilot")
    s += rect(5, 3, 6, 1, "#e8e8e8") + rect(4, 4, 8, 1, a.hair);
  if (a.preset === "knight")
    s += rect(3, 7, 1, 4, "#d6d9e1") + rect(12, 7, 1, 4, "#d6d9e1");
  if (a.preset === "builder") s += rect(4, 2, 8, 1, a.accent);
  if (a.preset === "neon")
    s += rect(4, 5, 1, 2, a.accent) + rect(11, 5, 1, 2, a.accent);
  s += "</svg>";
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(s)}`;
}
export function avatarConfigFromUser(user) {
  return {
    ...DEFAULT_AVATAR,
    ...(user?.avatar || {}),
    preset: user?.avatar?.preset || user?.avatarPreset || DEFAULT_AVATAR.preset,
  };
}
export function avatarMarkup(config = {}, className = "avatar") {
  return `<img class="${className}" src="${avatarData(config)}" alt="Pixel avatar">`;
}
