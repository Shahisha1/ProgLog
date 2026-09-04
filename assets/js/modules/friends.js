import { auth, db } from "./firebase.js";
import {
  listFriends,
  listFriendRequests,
  createFriendRequest,
  respondFriendRequest,
  listFriendActivity,
} from "./store.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { $, esc, showToast } from "./core.js";
export async function initFriends() {
  const friendBox = $("#friendList"),
    reqBox = $("#requestList");
  async function render() {
    const fs = await listFriends(),
      rs = await listFriendRequests();
    const act = await listFriendActivity(fs.map((f) => f.uid || f.id));
    const activityBox = $("#friendActivity");
    if (activityBox)
      activityBox.innerHTML = act.length
        ? act
            .map(
              (a) =>
                `<div class="activity-item"><strong>${esc(a.text)}</strong><small>${esc(a.userId)}</small></div>`,
            )
            .join("")
        : '<div class="empty">No friend activity yet.</div>';
    friendBox.innerHTML = fs.length
      ? fs
          .map(
            (f) =>
              `<div class="friend"><div><strong>${esc(f.name || "Friend")}</strong><small class="muted">Friend</small></div><a class="btn btn-ghost spacer" href="profile.html?uid=${encodeURIComponent(f.uid || f.id)}">View</a></div>`,
          )
          .join("")
      : '<div class="empty">No friends yet.</div>';
    const incoming = rs.filter((r) => r.toUid === auth?.currentUser?.uid);
    reqBox.innerHTML = incoming.length
      ? incoming
          .map(
            (r) =>
              `<div class="friend"><div><strong>${esc(r.fromName || "Gamer")}</strong><small class="muted">Friend request</small></div><button class="btn btn-primary spacer req" data-id="${esc(r.id)}" data-action="accept" type="button">Accept</button><button class="btn btn-danger req" data-id="${esc(r.id)}" data-action="decline" type="button">Decline</button></div>`,
          )
          .join("")
      : '<div class="empty">No pending requests.</div>';
  }
  await render();
  $("#friendForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const target = $("#friendUid").value.trim();
    if (!target) return showToast("Enter a user UID.", "error");
    if (!auth?.currentUser) return showToast("Sign in first.", "error");
    try {
      await createFriendRequest(target, {
        displayName:
          auth.currentUser.displayName || auth.currentUser.email?.split("@")[0],
      });
      e.target.reset();
      showToast("Friend request sent.");
    } catch (err) {
      showToast(err.message, "error");
    }
  });
  reqBox?.addEventListener("click", async (e) => {
    const b = e.target.closest(".req");
    if (!b) return;
    const rs = await listFriendRequests(),
      r = rs.find((x) => x.id === b.dataset.id);
    if (!r) return;
    await respondFriendRequest(r.id, r, b.dataset.action === "accept");
    showToast(
      b.dataset.action === "accept"
        ? "Friend request accepted."
        : "Friend request declined.",
    );
    render();
  });
}
