import { auth, db } from "./firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const DEMO_GAMES = [
  {
    id: "demo-elden-ring",
    name: "Elden Ring",
    rawgId: "demo-elden-ring",
    coverUrl:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg",
    backgroundUrl:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/page_bg_generated_v6b.jpg",
    status: "playing",
    playtimeHours: 94,
    genres: ["RPG", "Action"],
    rating: 4.9,
    review: "A massive world that rewards curiosity.",
    achievementCount: 42,
    achievementUnlocked: 36,
    achievements: Array.from({ length: 42 }, (_, i) => ({
      name: [
        "Legendary Armaments",
        "Shardbearer Godrick",
        "Elden Lord",
        "Roundtable Hold",
        "Great Rune",
      ][i % 5],
      description: "Demo achievement",
      unlocked: i < 36,
      imageUrl:
        "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/capsule_184x69.jpg",
    })),
  },
  {
    id: "demo-cyberpunk",
    name: "Cyberpunk 2077",
    rawgId: "demo-cyberpunk",
    coverUrl:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg",
    backgroundUrl:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/page_bg_generated_v6b.jpg",
    status: "playing",
    playtimeHours: 67,
    genres: ["RPG", "Action"],
    rating: 4.8,
    review: "Night City never stops giving you something to do.",
    achievementCount: 44,
    achievementUnlocked: 36,
    achievements: Array.from({ length: 44 }, (_, i) => ({
      name: [
        "Never Fade Away",
        "The World",
        "Frequent Flyer",
        "Gunslinger",
        "True Soldier",
      ][i % 5],
      description: "Demo achievement",
      unlocked: i < 36,
      imageUrl:
        "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/capsule_184x69.jpg",
    })),
  },
  {
    id: "demo-hades",
    name: "Hades",
    rawgId: "demo-hades",
    coverUrl:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/header.jpg",
    backgroundUrl:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/page_bg_generated_v6b.jpg",
    status: "completed",
    playtimeHours: 48,
    genres: ["Action", "Roguelike"],
    rating: 4.9,
    review: "Fast, stylish and absurdly replayable.",
    achievementCount: 49,
    achievementUnlocked: 49,
    achievements: Array.from({ length: 49 }, (_, i) => ({
      name: [
        "Champion of Elysium",
        "Had to Happen",
        "Friends Forever",
        "Weapon Master",
      ][i % 4],
      description: "Demo achievement",
      unlocked: true,
      imageUrl:
        "https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/capsule_184x69.jpg",
    })),
  },
  {
    id: "demo-rdr2",
    name: "Red Dead Redemption 2",
    rawgId: "demo-rdr2",
    coverUrl:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/header.jpg",
    backgroundUrl:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/page_bg_generated_v6b.jpg",
    status: "playing",
    playtimeHours: 100,
    genres: ["Adventure", "Action"],
    rating: 4.8,
    review: "Slow-burn storytelling at its finest.",
    achievementCount: 51,
    achievementUnlocked: 28,
    achievements: Array.from({ length: 51 }, (_, i) => ({
      name: [
        "Outlaw",
        "Best in the West",
        "Friends with Benefits",
        "Paying a Social Call",
      ][i % 4],
      description: "Demo achievement",
      unlocked: i < 28,
      imageUrl:
        "https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/capsule_184x69.jpg",
    })),
  },
  {
    id: "demo-gow",
    name: "God of War",
    rawgId: "demo-gow",
    coverUrl:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1593500/header.jpg",
    backgroundUrl:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1593500/page_bg_generated_v6b.jpg",
    status: "backlog",
    playtimeHours: 25,
    genres: ["Action", "Adventure"],
    rating: 4.7,
    review: "Queued up for the next long weekend.",
    achievementCount: 37,
    achievementUnlocked: 17,
    achievements: Array.from({ length: 37 }, (_, i) => ({
      name: ["Father and Son", "Darkness and Fog", "Like Oil and Water"][i % 3],
      description: "Demo achievement",
      unlocked: i < 17,
      imageUrl:
        "https://cdn.cloudflare.steamstatic.com/steam/apps/1593500/capsule_184x69.jpg",
    })),
  },
  {
    id: "demo-bg3",
    name: "Baldur's Gate 3",
    rawgId: "demo-bg3",
    coverUrl:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/header.jpg",
    backgroundUrl:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/page_bg_generated_v6b.jpg",
    status: "backlog",
    playtimeHours: 12,
    genres: ["RPG"],
    rating: 4.9,
    achievementCount: 54,
    achievementUnlocked: 5,
    achievements: Array.from({ length: 54 }, (_, i) => ({
      name: ["First Blood", "Escape the Nautiloid", "Descent from Avernus"][
        i % 3
      ],
      description: "Demo achievement",
      unlocked: i < 5,
      imageUrl:
        "https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/capsule_184x69.jpg",
    })),
  },
  {
    id: "demo-wukong",
    name: "Black Myth: Wukong",
    rawgId: "demo-wukong",
    coverUrl:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/2358720/header.jpg",
    backgroundUrl:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/2358720/page_bg_generated_v6b.jpg",
    status: "wishlist",
    playtimeHours: 0,
    genres: ["Action", "RPG"],
    rating: 4.6,
    achievementCount: 81,
    achievementUnlocked: 0,
    achievements: [],
  },
  {
    id: "demo-witcher",
    name: "The Witcher 3",
    rawgId: "demo-witcher",
    coverUrl:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/header.jpg",
    backgroundUrl:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/page_bg_generated_v6b.jpg",
    status: "completed",
    playtimeHours: 86,
    genres: ["RPG"],
    rating: 4.9,
    achievementCount: 78,
    achievementUnlocked: 60,
    achievements: Array.from({ length: 78 }, (_, i) => ({
      name: ["Lilac and Gooseberries", "Kingmaker", "Family Counselor"][i % 3],
      description: "Demo achievement",
      unlocked: i < 60,
      imageUrl:
        "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/capsule_184x69.jpg",
    })),
  },
];
const DEMO_SESSIONS = [
  {
    date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    durationMinutes: 134,
    gameId: "demo-hades",
    gameName: "Hades",
    note: "Finished a run and cleaned up a few achievements.",
  },
  {
    date: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    durationMinutes: 91,
    gameId: "demo-cyberpunk",
    gameName: "Cyberpunk 2077",
    note: "Explored Dogtown.",
  },
  {
    date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    durationMinutes: 118,
    gameId: "demo-rdr2",
    gameName: "Red Dead Redemption 2",
    note: "Story mission night.",
  },
  {
    date: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    durationMinutes: 76,
    gameId: "demo-elden-ring",
    gameName: "Elden Ring",
    note: "Boss attempts.",
  },
];
const DEMO_ACTIVITY = [
  {
    kind: "achievement",
    text: "Unlocked 10 achievements in Elden Ring",
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    kind: "playing",
    text: "Started playing Cyberpunk 2077",
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    kind: "session",
    text: "Logged a 2h 14m session in Hades",
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    kind: "completed",
    text: "Completed Red Dead Redemption 2",
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
  {
    kind: "game_added",
    text: "Added Baldur’s Gate 3 to your backlog",
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
  },
];

export async function seedDemoProfile() {
  const user = auth?.currentUser;
  if (!user || !db) return false;
  const ref = doc(db, "users", user.uid),
    snap = await getDoc(ref);
  if (snap.exists() && snap.data()?.demoSeeded) return false;
  await setDoc(
    ref,
    {
      displayName: user.displayName || "Shahisha",
      bio: "Collecting games, chasing achievements and documenting the journey.",
      visibility: "Public",
      activityVisible: true,
      friendCount: 4,
      level: 24,
      xp: 72,
      demoSeeded: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  for (const game of DEMO_GAMES)
    await setDoc(
      doc(db, "users", user.uid, "games", game.id),
      { ...game, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
      { merge: true },
    );
  for (const session of DEMO_SESSIONS)
    await addDoc(collection(db, "users", user.uid, "sessions"), {
      ...session,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  for (const item of DEMO_ACTIVITY)
    await addDoc(collection(db, "users", user.uid, "activity"), {
      ...item,
      createdAt: serverTimestamp(),
    });
  return true;
}
