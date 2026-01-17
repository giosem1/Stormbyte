import { PREVIEW_CONFIG, mountPreview, unmountPreview } from "../pages/previewanimation";

const registerBtn = document.getElementById("register-btn") as HTMLButtonElement;
const newUsername = document.getElementById("new-username") as HTMLInputElement;
const newPassword = document.getElementById("new-password") as HTMLInputElement;

registerBtn.addEventListener("click", () => {
  const username = newUsername.value.trim();
  const password = newPassword.value.trim();

  if (!username || !password) {
    alert("Inserisci username e password!");
    return;
  }

  console.log(`Utente registrato: ${username}`);

  window.location.href = "login.html";
});

const bindings = [
    ["SelectedCavaliere", PREVIEW_CONFIG.knight],
    ["SelectedMago", PREVIEW_CONFIG.mage],
    ["SelectedArciere", PREVIEW_CONFIG.archer],
    // ["SelectedLadro", PREVIEW_CONFIG.thief]
  ] as const;

  bindings.forEach(([id, cfg]) => {
    const card = document.getElementById(id);
    if (!card) return;

    card.addEventListener("mouseenter", () => mountPreview(card, cfg));
    card.addEventListener("mouseleave", () => unmountPreview(card, cfg));
  });

  document.getElementById("cancelClass")?.addEventListener("click", () => {
    bindings.forEach(([id, cfg]) => {
      const card = document.getElementById(id);
      if (card) unmountPreview(card, cfg);
    });
  });