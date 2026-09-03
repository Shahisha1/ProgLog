import { auth, db } from "./firebase.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  where,
  increment,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
const LOCAL_PREFIX = "proglog.";
export const localGet = (k, f = []) => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_PREFIX + k)) ?? f;
  } catch {
    return f;
  }
};
export const localSet = (k, v) =>
  localStorage.setItem(LOCAL_PREFIX + k, JSON.stringify(v));
export const uid = () => auth?.currentUser?.uid || null;
export async function getUserDoc() {
  if (!uid() || !db) return localGet("profile", null);
  const s = await getDoc(doc(db, "users", uid()));
  return s.exists() ? { id: s.id, ...s.data() } : null;
}
export async function saveUserDoc(data) {
  if (!uid() || !db) {
    localSet("profile", { ...localGet("profile", {}), ...data });
    return;
  }
  return setDoc(
    doc(db, "users", uid()),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
export async function listGames(owner = uid()) {
  if (!owner || !db) return localGet("games", []);
  try {
    const s = await getDocs(
      query(
        collection(db, "users", owner, "games"),
        orderBy("createdAt", "desc"),
      ),
    );
    return s.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn(e);
    return localGet("games", []);
  }
}
export async function getGame(id) {
  if (!id) return null;
  if (!uid() || !db) {
    return (
      localGet("games", []).find(
        (x) => String(x.rawgId) === String(id) || x.id === id,
      ) || null
    );
  }
  const s = await getDoc(doc(db, "users", uid(), "games", String(id)));
  return s.exists() ? { id: s.id, ...s.data() } : null;
}
export async function saveGame(game) {
  const id = String(game.id || `rawg-${game.rawgId}`);
  const payload = { ...game, updatedAt: serverTimestamp() };
  if (uid() && db) {
    await setDoc(doc(db, "users", uid(), "games", id), payload, {
      merge: true,
    });
  } else {
    const games = localGet("games", []).filter(
      (g) => g.id !== id && String(g.rawgId) !== String(game.rawgId),
    );
    games.unshift({ ...game, id });
    localSet("games", games);
  }
  return { ...game, id };
}
export async function deleteGame(gameId) {
  if (uid() && db)
    await deleteDoc(doc(db, "users", uid(), "games", String(gameId)));
  else
    localSet(
      "games",
      localGet("games", []).filter((g) => g.id !== gameId),
    );
}
export async function listSessions() {
  if (!uid() || !db) return localGet("sessions", []);
  try {
    const s = await getDocs(
      query(
        collection(db, "users", uid(), "sessions"),
        orderBy("date", "desc"),
      ),
    );
    return s.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    return localGet("sessions", []);
  }
}
export async function saveSession(data) {
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
    createdAt: data.createdAt || serverTimestamp(),
  };
  let id = data.id;
  if (uid() && db) {
    const ref = id
      ? doc(db, "users", uid(), "sessions", id)
      : doc(collection(db, "users", uid(), "sessions"));
    await setDoc(ref, payload, { merge: true });
    id = ref.id;
  } else {
    const arr = localGet("sessions", []);
    id = id || crypto.randomUUID();
    arr.unshift({ ...data, id });
    localSet("sessions", arr);
  }
  return { ...data, id };
}
export async function deleteSession(id) {
  if (uid() && db) await deleteDoc(doc(db, "users", uid(), "sessions", id));
  else
    localSet(
      "sessions",
      localGet("sessions", []).filter((x) => x.id !== id),
    );
}
export async function addActivity(kind, text, data = {}) {
  const item = { kind, text, data, createdAt: new Date().toISOString() };
  if (uid() && db) {
    await addDoc(collection(db, "users", uid(), "activity"), {
      ...item,
      createdAt: serverTimestamp(),
    });
  } else {
    const a = localGet("activity", []);
    a.unshift({ ...item, id: crypto.randomUUID() });
    localSet("activity", a.slice(0, 100));
  }
}
export async function listActivity(owner = uid()) {
  if (!owner) return localGet("activity", []);
  if (!uid() || !db) return localGet("activity", []);
  try {
    const s = await getDocs(
      query(
        collection(db, "users", owner, "activity"),
        orderBy("createdAt", "desc"),
        limit(100),
      ),
    );
    return s.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
}
export async function listFriendRequests() {
  if (!uid() || !db) return localGet("friendRequests", []);
  const [a, b] = await Promise.all([
    getDocs(
      query(
        collection(db, "friendRequests"),
        where("toUid", "==", uid()),
        where("status", "==", "pending"),
        orderBy("createdAt", "desc"),
      ),
    ),
    getDocs(
      query(
        collection(db, "friendRequests"),
        where("fromUid", "==", uid()),
        orderBy("createdAt", "desc"),
      ),
    ),
  ]);
  return [...a.docs, ...b.docs].map((d) => ({ id: d.id, ...d.data() }));
}
export async function createFriendRequest(toUid, fromProfile) {
  if (!uid() || !db) throw new Error("Sign in to add friends.");
  const existing = await getDocs(
    query(
      collection(db, "friendRequests"),
      where("fromUid", "==", uid()),
      where("toUid", "==", toUid),
      where("status", "==", "pending"),
      limit(1),
    ),
  );
  if (!existing.empty) throw new Error("Friend request already pending.");
  const ref = await addDoc(collection(db, "friendRequests"), {
    fromUid: uid(),
    toUid: toUid,
    status: "pending",
    fromName: fromProfile?.displayName || "Gamer",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
export async function respondFriendRequest(id, request, accept) {
  if (!uid() || !db) throw new Error("Sign in required.");
  await updateDoc(doc(db, "friendRequests", id), {
    status: accept ? "accepted" : "declined",
    respondedAt: serverTimestamp(),
  });
  if (accept) {
    await setDoc(
      doc(db, "users", uid(), "friends", request.fromUid),
      {
        uid: request.fromUid,
        name: request.fromName || "Friend",
        addedAt: serverTimestamp(),
      },
      { merge: true },
    );
    await setDoc(
      doc(db, "users", request.fromUid, "friends", uid()),
      {
        uid: uid(),
        name:
          auth.currentUser.displayName ||
          auth.currentUser.email?.split("@")[0] ||
          "Friend",
        addedAt: serverTimestamp(),
      },
      { merge: true },
    );
    await setDoc(
      doc(db, "users", uid()),
      { friendCount: increment(1) },
      { merge: true },
    );
    await setDoc(
      doc(db, "users", request.fromUid),
      { friendCount: increment(1) },
      { merge: true },
    );
  }
}
export async function listFriends() {
  if (!uid() || !db) return localGet("friends", []);
  try {
    const s = await getDocs(collection(db, "users", uid(), "friends"));
    return s.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
}
export async function saveAchievementSummary(gameId, achievements) {
  const payload = {
    achievementCount: achievements.length,
    achievementUnlocked: achievements.filter((a) => a.unlocked).length,
    achievements,
  };
  if (uid() && db)
    await updateDoc(doc(db, "users", uid(), "games", String(gameId)), {
      ...payload,
      achievementUpdatedAt: serverTimestamp(),
    });
  else {
    const arr = localGet("games", []);
    const g = arr.find((x) => x.id === gameId);
    if (g) Object.assign(g, payload);
    localSet("games", arr);
  }
}
export async function listNotifications() {
  if (!uid() || !db) return localGet("notifications", []);
  try {
    const s = await getDocs(
      query(
        collection(db, "users", uid(), "notifications"),
        orderBy("createdAt", "desc"),
        limit(100),
      ),
    );
    return s.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
}
export async function addNotification(text, type = "info") {
  if (uid() && db)
    return addDoc(collection(db, "users", uid(), "notifications"), {
      text,
      type,
      read: false,
      createdAt: serverTimestamp(),
    });
  const a = localGet("notifications", []);
  a.unshift({
    id: crypto.randomUUID(),
    text,
    type,
    read: false,
    createdAt: new Date().toISOString(),
  });
  localSet("notifications", a);
}
export async function markNotification(id) {
  if (uid() && db)
    await updateDoc(doc(db, "users", uid(), "notifications", id), {
      read: true,
    });
  else {
    const a = localGet("notifications", []);
    const n = a.find((x) => x.id === id);
    if (n) n.read = true;
    localSet("notifications", a);
  }
}

export async function listFriendActivity(friendIds = []) {
  if (!uid() || !db) return [];
  const out = [];
  for (const fid of friendIds) {
    try {
      const s = await getDocs(
        query(
          collection(db, "users", fid, "activity"),
          orderBy("createdAt", "desc"),
          limit(20),
        ),
      );
      s.docs.forEach((d) => out.push({ id: d.id, userId: fid, ...d.data() }));
    } catch (e) {
      console.warn("friend activity", e.message);
    }
  }
  return out
    .sort((a, b) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
    )
    .slice(0, 50);
}
