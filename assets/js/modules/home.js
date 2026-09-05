const FEATURED = [
  { icon: "library", title: "One calm library", text: "Keep playing, backlog, completed and wishlist in one focused space." },
  { icon: "notebook-pen", title: "Reviews that stay useful", text: "Give a game a rating, leave a note and come back to what you thought." },
  { icon: "route", title: "A history worth revisiting", text: "Sessions and milestones turn your library into a personal timeline." },
  { icon: "trophy", title: "Progress without noise", text: "Achievements are there when you want them, not competing with the rest of your library." },
];

export async function initLanding() {
  const main = document.querySelector(".landing-cta");
  if (!main || document.querySelector(".landing-focus")) return;
  const section = document.createElement("section");
  section.className = "landing-section landing-focus";
  section.innerHTML = `<div class="eyebrow">Built for real play</div><div class="landing-focus-head"><div><h2>A little structure. A lot less noise.</h2><p>progLog keeps the things you actually use close and lets the rest stay out of the way.</p></div><span class="landing-focus-badge">Simple by default</span></div><div class="landing-focus-grid">${FEATURED.map((f)=>`<article class="landing-focus-card"><span class="landing-focus-icon"><i data-lucide="${f.icon}"></i></span><div><h3>${f.title}</h3><p>${f.text}</p></div></article>`).join("")}</div>`;
  main.parentNode.insertBefore(section, main);
  window.lucide?.createIcons();
}
export function stopLanding() {}
