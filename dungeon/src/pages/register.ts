const registerBtn = document.getElementById("register-btn") as HTMLButtonElement;
const newUsername = document.getElementById("new-username") as HTMLInputElement;
const newPassword = document.getElementById("new-password") as HTMLInputElement;
const cavaliereDiv = document.getElementById("SelectedCavaliere") as HTMLDivElement;

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

cavaliereDiv.addEventListener("click", () => {
  alert("Cavaliere selezionato!");
});
import Phaser from "phaser";
import { KnightAttack } from "../scenes/knightattack";

const config = {
  type: Phaser.AUTO,
  width:800,
  height:600,
  scene: [KnightAttack],
  backgroundColor: "rgba(255, 255, 255, 0)"
};

new Phaser.Game(config);