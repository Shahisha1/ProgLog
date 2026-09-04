export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (v) =>
  String(v ?? "").replace(
    /[&<>'"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        c
      ],
  );
export const relPath = () =>
  location.pathname.includes("/pages/") ? "../" : "./";
export const pageName = () =>
  location.pathname.split("/").pop() || "index.html";
export const nowISO = () => new Date().toISOString();
export function showToast(message, type = "success") {
  const box = $("#flash");
  if (!box) return;
  box.className = `notice ${type}`;
  box.textContent = message;
  box.classList.remove("hidden");
  clearTimeout(window.__toast);
  window.__toast = setTimeout(() => box.classList.add("hidden"), 4200);
}
export function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}
export function fmtDateTime(v) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
export function fmtHours(h) {
  const n = Number(h) || 0;
  if (n < 1) return `${Math.round(n * 60)}m`;
  return `${Math.floor(n)}h ${Math.round((n % 1) * 60)}m`;
}
export function slug(v) {
  return String(v || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
