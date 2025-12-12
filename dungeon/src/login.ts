const loginBtn = document.getElementById("login-btn") as HTMLButtonElement;
const usernameInput = document.getElementById("username") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;
const registerLink = document.getElementById("register-link") as HTMLSpanElement;

loginBtn.addEventListener("click", () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    alert("Inserisci username e password!");
    return;
  }

  console.log(`Login effettuato da ${username}`);
  window.location.href = "index.html";
});

registerLink.addEventListener("click", () => {
  window.location.href = "register.html";
});

import Phaser from "phaser";
import { Torch } from "./scenes/torch";

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  transparent: true,
  scene: Torch,
  backgroundColor: "rgba(0,0,0,0)"
};

new Phaser.Game(config);
