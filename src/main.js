const viewButtons = document.querySelectorAll("[data-view-target]");
const views = document.querySelectorAll("[data-view]");
const helloButton = document.querySelector("#hello-button");
const helloMessage = document.querySelector("#message");
const rollButton = document.querySelector("#roll-button");
const resultElement = document.querySelector("#result");
const scene = document.querySelector(".scene");
const leftDie = document.querySelector("#die-left");
const rightDie = document.querySelector("#die-right");
const confettiCanvas = document.querySelector("#confetti-canvas");
const dicePanel = document.querySelector(".dice-panel");
const context = confettiCanvas.getContext("2d");

const APP_TITLES = Object.freeze({
  hola: "Mini Apps | Hola",
  dados: "Mini Apps | Dados",
});

const DIE_ORIENTATIONS = Object.freeze({
  1: { x: 0, y: 0 },
  2: { x: -90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  5: { x: 90, y: 0 },
  6: { x: 0, y: 180 },
});

let confettiParticles = [];
let confettiAnimationId = null;

function setActiveView(viewName) {
  views.forEach((view) => {
    const isActive = view.dataset.view === viewName;
    view.classList.toggle("is-active", isActive);
    view.hidden = !isActive;
  });

  viewButtons.forEach((button) => {
    const isActive = button.dataset.viewTarget === viewName;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");
  });

  document.title = APP_TITLES[viewName] || "Mini Apps";

  if (window.location.hash !== `#${viewName}`) {
    window.location.hash = viewName;
  }

  if (viewName === "dados") {
    resizeConfettiCanvas();
  }
}

function getInitialView() {
  const hash = window.location.hash.replace("#", "");
  return hash === "dados" ? "dados" : "hola";
}

function resizeConfettiCanvas() {
  confettiCanvas.width = dicePanel.clientWidth;
  confettiCanvas.height = dicePanel.clientHeight;
}

function setDieFace(dieElement, value) {
  const orientation = DIE_ORIENTATIONS[value];
  dieElement.style.transform = `rotateX(${orientation.x}deg) rotateY(${orientation.y}deg)`;
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function stopConfetti() {
  if (confettiAnimationId) {
    cancelAnimationFrame(confettiAnimationId);
    confettiAnimationId = null;
  }

  confettiParticles = [];
  context.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}

function launchConfetti() {
  resizeConfettiCanvas();
  confettiParticles = Array.from({ length: 150 }, () => ({
    x: confettiCanvas.width / 2,
    y: confettiCanvas.height * 0.3,
    size: randomRange(4, 8),
    vx: randomRange(-4.5, 4.5),
    vy: randomRange(-10, -3),
    gravity: randomRange(0.15, 0.24),
    rotation: randomRange(0, Math.PI * 2),
    vr: randomRange(-0.25, 0.25),
    color: `hsl(${randomNumber(0, 360)}, 90%, 55%)`,
    life: randomRange(80, 120),
  }));

  if (confettiAnimationId) {
    cancelAnimationFrame(confettiAnimationId);
  }

  const animate = () => {
    context.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    confettiParticles = confettiParticles.filter((particle) => particle.life > 0);

    confettiParticles.forEach((particle) => {
      particle.vy += particle.gravity;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.rotation += particle.vr;
      particle.life -= 1;

      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.fillStyle = particle.color;
      context.fillRect(
        -particle.size / 2,
        -particle.size / 2,
        particle.size,
        particle.size * 0.7
      );
      context.restore();
    });

    if (confettiParticles.length > 0) {
      confettiAnimationId = window.requestAnimationFrame(animate);
      return;
    }

    confettiAnimationId = null;
    context.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  };

  animate();
}

function handleHelloClick() {
  helloMessage.textContent = "Hola";
}

function handleDiceRoll() {
  rollButton.disabled = true;
  resultElement.textContent = "Resultado: lanzando...";
  scene.classList.add("rolling");

  const spinInterval = window.setInterval(() => {
    leftDie.style.transform = `rotateX(${randomNumber(0, 720)}deg) rotateY(${randomNumber(0, 720)}deg)`;
    rightDie.style.transform = `rotateX(${randomNumber(0, 720)}deg) rotateY(${randomNumber(0, 720)}deg)`;
  }, 120);

  window.setTimeout(() => {
    window.clearInterval(spinInterval);

    const leftValue = randomNumber(1, 6);
    const rightValue = randomNumber(1, 6);

    setDieFace(leftDie, leftValue);
    setDieFace(rightDie, rightValue);

    scene.classList.remove("rolling");
    resultElement.textContent = `Resultado: ${leftValue}`;

    if (leftValue === 6) {
      launchConfetti();
    } else {
      stopConfetti();
    }

    rollButton.disabled = false;
  }, 1800);
}

helloButton.addEventListener("click", handleHelloClick);
rollButton.addEventListener("click", handleDiceRoll);

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveView(button.dataset.viewTarget);
  });
});

window.addEventListener("hashchange", () => {
  setActiveView(getInitialView());
});

window.addEventListener("resize", resizeConfettiCanvas);

setDieFace(leftDie, 1);
setDieFace(rightDie, 1);
resizeConfettiCanvas();
setActiveView(getInitialView());
