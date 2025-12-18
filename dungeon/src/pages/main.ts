import Phaser from "phaser";
import { Torch } from "../scenes/torch";

const config = {
   type: Phaser.AUTO,
   width: window.innerWidth,
   height: window.innerHeight,
   transparent: true,
   scene: Torch,
 };

 new Phaser.Game(config);

const createD = document.getElementById("create") as HTMLParagraphElement;
const changeC = document.getElementById("change") as HTMLParagraphElement;
const searchD = document.getElementById("search") as HTMLParagraphElement;
// const chanllengeD = document.getElementById("chanllenge") as HTMLParagraphElement;

createD.addEventListener("click", ()=>{
  window.location.href = "createDungeon.html";
})

changeC.addEventListener("click", ()=>{
  window.location.href = "changeClass.html";
})

searchD.addEventListener("click", () => {

  if (searchD.querySelector(".search-wrapper")) {
    return;
  }

  searchD.style.display = "inline-flex";
  searchD.style.alignItems = "center";

  const wrapper = document.createElement("div");
  wrapper.className = "search-wrapper small";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Code";

  const icon = document.createElement("img");
  icon.className = "icon";
  icon.src = "../../public/search.png";
  icon.alt = "Cerca";
  icon.draggable = false;

  const doSearch = () => {
    const value = input.value.trim();
    if (!value) return;
    console.log("Ricerca dungeon:", value);
  };

  icon.addEventListener("click", doSearch);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      doSearch();
    }
  });
  input.addEventListener("input", () => {
    input.value = input.value.replace(/\D/g, '');
  });

  wrapper.appendChild(input);
  wrapper.appendChild(icon);

  // inserisce l’input DENTRO il paragrafo
  searchD.appendChild(wrapper);

  input.focus();
});


