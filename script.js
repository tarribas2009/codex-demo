const faces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

const rollButton = document.getElementById("roll-button");
const resultEl = document.getElementById("result");
const diceWrapper = document.querySelector(".dice-wrapper");
const leftDie = document.getElementById("die-left");
const rightDie = document.getElementById("die-right");

const randomFace = () => faces[Math.floor(Math.random() * faces.length)];
const randomNumber = () => Math.floor(Math.random() * 6) + 1;

rollButton.addEventListener("click", () => {
  rollButton.disabled = true;
  resultEl.textContent = "Resultado: lanzando...";
  diceWrapper.classList.add("rolling");

  const spinInterval = setInterval(() => {
    leftDie.textContent = randomFace();
    rightDie.textContent = randomFace();
  }, 120);

  setTimeout(() => {
    clearInterval(spinInterval);

    const value = randomNumber();
    leftDie.textContent = faces[value - 1];
    rightDie.textContent = faces[randomNumber() - 1];

    diceWrapper.classList.remove("rolling");
    resultEl.textContent = `Resultado: ${value}`;
    rollButton.disabled = false;
  }, 1800);
});
