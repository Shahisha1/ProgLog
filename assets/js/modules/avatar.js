const PRESETS = [
  { id: "wanderer", name: "Wanderer", skin: "#f3c7a6", hair: "#3b2630", shirt: "#6f42d8", accent: "#f0b94b" },
  { id: "ranger", name: "Ranger", skin: "#d99d76", hair: "#1e252f", shirt: "#3f8f72", accent: "#d2b542" },
  { id: "mage", name: "Mage", skin: "#f1c5a4", hair: "#5a315f", shirt: "#7956c7", accent: "#b88cff" },
  { id: "rogue", name: "Rogue", skin: "#b97858", hair: "#171a20", shirt: "#35495e", accent: "#d97b5d" },
  { id: "pilot", name: "Pilot", skin: "#e4ad83", hair: "#7b4f31", shirt: "#c85b4b", accent: "#e8d26a" },
  { id: "knight", name: "Knight", skin: "#c58b6a", hair: "#302f3a", shirt: "#51647c", accent: "#d6d9e1" },
  { id: "builder", name: "Builder", skin: "#f0bd92", hair: "#7a4a2c", shirt: "#d28a32", accent: "#63a6d8" },
  { id: "neon", name: "Neon", skin: "#d89c86", hair: "#27204a", shirt: "#3e75c9", accent: "#e36dd8" },
];

export const GAME_CHARACTERS = [
  { id: "kratos", name: "Kratos", game: "God of War", wiki: "Kratos_(God_of_War)" },
  { id: "aloy", name: "Aloy", game: "Horizon", wiki: "Aloy" },
  { id: "geralt", name: "Geralt", game: "The Witcher", wiki: "Geralt_of_Rivia" },
  { id: "arthur", name: "Arthur Morgan", game: "Red Dead Redemption 2", wiki: "Arthur_Morgan" },
  { id: "v", name: "V", game: "Cyberpunk 2077", wiki: "V_(Cyberpunk_2077)" },
  { id: "link", name: "Link", game: "The Legend of Zelda", wiki: "Link_(The_Legend_of_Zelda)" },
  { id: "samus", name: "Samus Aran", game: "Metroid", wiki: "Samus_Aran" },
  { id: "dante", name: "Dante", game: "Devil May Cry", wiki: "Dante_(Devil_May_Cry)" },
  { id: "mario", name: "Mario", game: "Super Mario", wiki: "Mario" },
  { id: "sonic", name: "Sonic", game: "Sonic the Hedgehog", wiki: "Sonic_the_Hedgehog_(character)" },
  { id: "lara", name: "Lara Croft", game: "Tomb Raider", wiki: "Lara_Croft" },
  { id: "master-chief", name: "Master Chief", game: "Halo", wiki: "Master_Chief_(Halo)" },
];

const SKINS = ["#f3c7a6", "#e4ad83", "#d99d76", "#c58b6a", "#b97858", "#8f5a45"];
const HAIRS = ["#171a20", "#3b2630", "#5a315f", "#7a4a2c", "#302f3a", "#27204a", "#d6a03c"];
const SHIRTS = ["#6f42d8", "#3f8f72", "#7956c7", "#35495e", "#c85b4b", "#51647c", "#d28a32", "#3e75c9"];
const BACKGROUNDS = ["#efe3ff", "#e8f2ff", "#fff0d2", "#e3f3e9", "#f6e2ea", "#e9e6f7"];

export const AVATAR_PRESETS = PRESETS;
export const DEFAULT_AVATAR = {
  preset: "wanderer",
  skin: PRESETS[0].skin,
  hair: PRESETS[0].hair,
  shirt: PRESETS[0].shirt,
  accent: PRESETS[0].accent,
  background: BACKGROUNDS[0],
  imageUrl: "",
  character: "",
  game: "",
};

export function avatarOptions() {
  return { skins: SKINS, hairs: HAIRS, shirts: SHIRTS, backgrounds: BACKGROUNDS };
}

function esc(v) {
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function avatarData(input = {}) {
  if (input.imageUrl) return input.imageUrl;
  const p = PRESETS.find((x) => x.id === input.preset) || PRESETS[0];
  const a = { ...DEFAULT_AVATAR, ...p, ...input };
  const rect = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${esc(c)}"/>`;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">`;
  s += rect(0, 0, 16, 16, a.background);
  s += rect(3, 14, 10, 1, "#00000022");
  s += rect(4, 4, 8, 8, a.skin) + rect(3, 6, 1, 4, a.skin) + rect(12, 6, 1, 4, a.skin);
  s += rect(4, 3, 8, 2, a.hair) + rect(3, 4, 2, 3, a.hair) + rect(11, 4, 2, 3, a.hair) + rect(5, 2, 6, 1, a.hair);
  s += rect(5, 7, 1, 1, "#16181d") + rect(10, 7, 1, 1, "#16181d") + rect(7, 8, 2, 1, "#b56f61");
  s += rect(7, 10, 2, 2, a.skin) + rect(4, 11, 8, 4, a.shirt) + rect(3, 12, 1, 3, a.shirt) + rect(12, 12, 1, 3, a.shirt);
  s += rect(6, 11, 4, 1, a.accent) + rect(7, 12, 2, 2, a.accent);
  if (a.preset === "mage") s += rect(12, 2, 2, 1, a.accent) + rect(13, 3, 1, 2, a.accent);
  if (a.preset === "ranger") s += rect(2, 9, 1, 3, a.accent) + rect(13, 9, 1, 3, a.accent);
  if (a.preset === "pilot") s += rect(5, 3, 6, 1, "#e8e8e8") + rect(4, 4, 8, 1, a.hair);
  if (a.preset === "knight") s += rect(3, 7, 1, 4, "#d6d9e1") + rect(12, 7, 1, 4, "#d6d9e1");
  if (a.preset === "builder") s += rect(4, 2, 8, 1, a.accent);
  if (a.preset === "neon") s += rect(4, 5, 1, 2, a.accent) + rect(11, 5, 1, 2, a.accent);
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(s + "</svg>")}`;
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
