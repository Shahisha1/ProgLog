import { getUserDoc, saveUserDoc } from "./store.js";
import { $, showToast } from "./core.js";
export async function initSettings() {
  const u = await getUserDoc();
  if (u) {
    $("#displayName").value = u.displayName || "";
    $("#visibility").value = u.visibility || "Public";
    $("#activityVisible").checked = u.activityVisible !== false;
  }
  $("#settingsForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    await saveUserDoc({
      displayName: $("#displayName").value.trim() || "Gamer",
      visibility: $("#visibility").value,
      activityVisible: $("#activityVisible").checked,
    });
    showToast("Settings saved.");
  });
}
