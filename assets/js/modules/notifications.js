import { listNotifications, markNotification } from "./store.js";
import { $, esc, fmtDateTime, showToast } from "./core.js";
export async function initNotifications() {
  const box = $("#notifications"),
    items = await listNotifications();
  box.innerHTML = items.length
    ? items
        .map(
          (n) =>
            `<div class="friend"><div><strong>${esc(n.text)}</strong><small class="muted">${fmtDateTime(n.createdAt)}</small></div>${n.read ? "" : '<button class="btn mark-read" data-id="' + esc(n.id) + '" type="button">Mark read</button>'}</div>`,
        )
        .join("")
    : '<div class="empty">No notifications.</div>';
  box.addEventListener("click", async (e) => {
    const b = e.target.closest(".mark-read");
    if (!b) return;
    await markNotification(b.dataset.id);
    showToast("Notification marked as read.");
    initNotifications();
  });
}
