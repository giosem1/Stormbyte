import { PREVIEW_CONFIG, mountPreview, unmountPreview } from "../pages/previewanimation";

type PlayerClass = "Knight" | "Mage" | "Archer";

// interface Friend {
//   uid: string;
//   username: string;
//   profileImage: string;
// }

interface User {
  uid: string;
  username: string;
  password: string;
  class: string;
  profileImage: string;
}

const PREVIEW_TO_CLASS: Record<string, PlayerClass> = {
  knight: "Knight",
  mage: "Mage",
  archer: "Archer"
};
const registerBtn = document.getElementById("register-btn") as HTMLButtonElement;
const usernameInput = document.getElementById("new-username") as HTMLInputElement;
const usernameErrors = document.getElementById("username-errors") as HTMLUListElement;
const passwordInput = document.getElementById("new-password") as HTMLInputElement;
const passwordErrors = document.getElementById("password-errors") as HTMLUListElement;
const togglePasswordBtn = document.getElementById("toggle-password") as HTMLButtonElement;
const togglePasswordIcon = document.getElementById("toggle-password-icon") as HTMLImageElement;

let selectedClass: PlayerClass | null = null;
let selectedPreviewId: string | null = null;
let passwordVisible = false;


function validateUsername(
  username: string,
  inputEl: HTMLInputElement,
  errorListEl: HTMLUListElement,
  users: User[]
): boolean {
  const errors: string[] = [];

  if (!username) errors.push("• username obbligatorio");
  if (username.length < 3) errors.push("• almeno 3 caratteri");
  if (!/^[a-zA-Z0-9_]+$/.test(username))
    errors.push("• solo lettere, numeri e _");
  if (users.some(u => u.username === username))
    errors.push("• username già esistente");

  errorListEl.innerHTML = "";

  if (errors.length > 0) {
    inputEl.classList.add("border", "border-red-500");
    inputEl.classList.remove("border-green-500");

    errors.forEach(err => {
      const li = document.createElement("li");
      li.textContent = err;
      errorListEl.appendChild(li);
    });

    return false;
  }

  inputEl.classList.remove("border-red-500");
  inputEl.classList.add("border", "border-green-500");
  return true;
}

function validatePassword(
  password: string,
  inputEl: HTMLInputElement,
  errorListEl: HTMLUListElement
): boolean {
  const errors: string[] = [];

  if (password.length < 8) errors.push("• almeno 8 caratteri");
  if (!/[A-Z]/.test(password)) errors.push("• una lettera maiuscola");
  if (!/[a-z]/.test(password)) errors.push("• una lettera minuscola");
  if (!/[0-9]/.test(password)) errors.push("• un numero");
  if (!/[!@#$%^&*]/.test(password))
    errors.push("• un carattere speciale");

  errorListEl.innerHTML = "";

  if (errors.length > 0) {
    inputEl.classList.add("border", "border-red-500");
    inputEl.classList.remove("border-green-500");

    errors.forEach(err => {
      const li = document.createElement("li");
      li.textContent = err;
      errorListEl.appendChild(li);
    });

    return false;
  }

  inputEl.classList.remove("border-red-500");
  inputEl.classList.add("border", "border-green-500");
  return true;
}

togglePasswordBtn.addEventListener("click", () => {
  passwordVisible = !passwordVisible;

  passwordInput.type = passwordVisible ? "text" : "password";
  togglePasswordIcon.src = passwordVisible
    ? "/assets/icons/toggleClosed.png"
    : "/assets/icons/toggleOpen.png";
});

usernameInput.addEventListener("input", () => {
  validateUsername(
    usernameInput.value.trim(),
    usernameInput,
    usernameErrors,
    loadUsers()
  );
});

passwordInput.addEventListener("input", () => {
  validatePassword(
    passwordInput.value,
    passwordInput,
    passwordErrors
  );
});

registerBtn.addEventListener("click", async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  const users = loadUsers();

  const isUsernameValid = validateUsername(
    username,
    usernameInput,
    usernameErrors,
    users
  );

  const isPasswordValid = validatePassword(
    password,
    passwordInput,
    passwordErrors
  );

  let isClassValid = true;

  if (!selectedClass) {
    isClassValid = false;
    document
      .querySelectorAll("[id^='Selected']")
      .forEach(el => el.classList.add("border-red-500"));
  }

  if (!isUsernameValid || !isPasswordValid || !isClassValid) return;
  if (selectedClass === null || selectedPreviewId === null) return;
  

  const newUser: User = {
    uid: generateUID(),
    username,
    password,
    profileImage: `/assets/heroes/${selectedPreviewId}.png`,
    class: selectedClass.toString(),
  };

  registerUser(newUser)
  window.location.href = "login.html";
});

export async function registerUser(data: User) {
  const response = await fetch("http://localhost:7071/api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Errore di registrazione");
  }

  return result;
}

const bindings = [
  ["SelectedCavaliere", PREVIEW_CONFIG.knight],
  ["SelectedMago", PREVIEW_CONFIG.mage],
  ["SelectedArciere", PREVIEW_CONFIG.archer]
] as const;

bindings.forEach(([id, cfg]) => {
  const card = document.getElementById(id);
  if (!card) return;

  card.addEventListener("click", () => {
    selectedPreviewId = cfg.id;
    selectedClass = PREVIEW_TO_CLASS[cfg.id];

    document
      .querySelectorAll("[id^='Selected']")
      .forEach(el => {
        el.classList.remove("border-yellow-400", "border-red-500");
      });

    card.classList.add("border-yellow-400");
  });

  card.addEventListener("mouseenter", () => mountPreview(card, cfg));
  card.addEventListener("mouseleave", () => unmountPreview(card, cfg));
});

function generateUID(): string {
  const prefix = "SRBU";
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${randomDigits}`;
}

function loadUsers(): User[] {
  return JSON.parse(localStorage.getItem("users") || "[]");
}
