import Phaser from "phaser";
import { Torch } from "./scenes/torch";
import { setSession } from "../utils/session";
const loginBtn = document.getElementById("login-btn") as HTMLButtonElement;
const usernameInput = document.getElementById("username") as HTMLInputElement;
const usernameErrors = document.getElementById("username-errors") as HTMLUListElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;
const passwordErrors = document.getElementById("password-errors") as HTMLUListElement;
const registerLink = document.getElementById("register-link") as HTMLSpanElement;


const togglePasswordBtn = document.getElementById("toggle-password") as HTMLButtonElement;
const togglePasswordIcon = document.getElementById("toggle-password-icon") as HTMLImageElement;

let passwordVisible = false;
function showError(inputEl: HTMLInputElement, errorListEl: HTMLUListElement, message: string) {
  inputEl.classList.add("border", "border-red-500");
  errorListEl.innerHTML = `<li>• ${message}</li>`;
}

function clearErrors(){
  usernameInput.classList.remove("border-red-500");
  passwordInput.classList.remove("border-red-500");
  if(usernameErrors) usernameErrors.innerHTML = "";
  if(passwordErrors) passwordErrors.innerHTML = "";
}

if(togglePasswordBtn && togglePasswordIcon) {
  togglePasswordBtn.addEventListener("click", () => {
    passwordVisible = !passwordVisible;
    passwordInput.type = passwordVisible ? "text" : "password";
    togglePasswordIcon.src = passwordVisible ? "/assets/icons/toggleOpen.png" : "/assets/icons/toggleClosed.png";
  })
}
loginBtn.addEventListener("click", async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  clearErrors();
  let hasError = false;


  if (!username) {
    showError(usernameInput, usernameErrors, "Insert username");
    hasError = true;
  }
  if (!password) {
    showError(passwordInput, passwordErrors, "Insert password");
    hasError = true;
  }
  if (hasError) return;
   try {
    await loginUser(username, password );
    window.location.href = "homepage.html";

  } catch (err: any) {
    showError(passwordInput, passwordErrors, err.message || "Username o password errati");
  }
});

export async function loginUser(username: string, password: string) {
  const res = await fetch("http://localhost:7071/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Invalid credential");
  }
  setSession({ user: data.user, token: data.token });
  return data.user;
}

registerLink.addEventListener("click", () => {
  window.location.href = "register.html";
});



const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  transparent: true,
  scene: Torch,
  backgroundColor: "rgba(0,0,0,0)"
};

new Phaser.Game(config);
