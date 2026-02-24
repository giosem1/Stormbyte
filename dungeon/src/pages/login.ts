import { setSession } from "../utils/session";
const loginBtn = document.getElementById("login-btn") as HTMLButtonElement;
const usernameInput = document.getElementById("username") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;
const registerLink = document.getElementById("register-link") as HTMLSpanElement;

loginBtn.addEventListener("click", async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    alert("Inserisci username e password!");
    return;
  }

   try {
    const userData = await loginUser(username, password );
    localStorage.setItem("user", JSON.stringify(userData));
    window.location.href = "homepage.html";

  } catch (err: any) {
    alert(err.message || "Errore login");
  }
});

export async function loginUser(username: string, password: string) {
  const res = await fetch("http://localhost:7071/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  setSession({ user: data.user, token: data.token });
}

registerLink.addEventListener("click", () => {
  window.location.href = "register.html";
});


import Phaser from "phaser";
import { Torch } from "../scenes/torch";

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  transparent: true,
  scene: Torch,
  backgroundColor: "rgba(0,0,0,0)"
};

new Phaser.Game(config);
