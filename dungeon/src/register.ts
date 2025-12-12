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