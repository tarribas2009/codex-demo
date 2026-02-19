const rollButton = document.getElementById("roll-button");
const resultEl = document.getElementById("result");
const scene = document.querySelector(".scene");
const leftDie = document.getElementById("die-left");
const rightDie = document.getElementById("die-right");
const confettiCanvas = document.getElementById("confetti-canvas");
const ctx = confettiCanvas.getContext("2d");

const orientations = {
  1: { x: 0, y: 0 },
  2: { x: -90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  5: { x: 90, y: 0 },
  6: { x: 0, y: 180 },
};

const randomNumber = () => Math.floor(Math.random() * 6) + 1;
const randomRange = (min, max) => Math.random() * (max - min) + min;

let confettiParticles = [];
let animationId = null;

const resizeCanvas = () => {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
};

const setDieFace = (dieEl, value) => {
  const { x, y } = orientations[value];
  dieEl.style.transform = `rotateX(${x}deg) rotateY(${y}deg)`;
};

const launchConfetti = () => {
  confettiParticles = Array.from({ length: 150 }, () => ({
    x: confettiCanvas.width / 2,
    y: confettiCanvas.height * 0.3,
    size: randomRange(4, 8),
    vx: randomRange(-4.5, 4.5),
    vy: randomRange(-10, -3),
    gravity: randomRange(0.15, 0.24),
    rotation: randomRange(0, Math.PI * 2),
    vr: randomRange(-0.25, 0.25),
    color: `hsl(${Math.floor(randomRange(0, 360))}, 90%, 55%)`,
    life: randomRange(80, 120),
  }));

  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  const animate = () => {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    confettiParticles = confettiParticles.filter((p) => p.life > 0);

    confettiParticles.forEach((p) => {
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vr;
      p.life -= 1;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
      ctx.restore();
    });

    if (confettiParticles.length > 0) {
      animationId = requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      animationId = null;
    }
  };

  animate();
};

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
setDieFace(leftDie, 1);
setDieFace(rightDie, 1);

rollButton.addEventListener("click", () => {
  rollButton.disabled = true;
  resultEl.textContent = "Resultado: lanzando...";
  scene.classList.add("rolling");

  const spinInterval = setInterval(() => {
    const randomX1 = Math.floor(randomRange(0, 720));
    const randomY1 = Math.floor(randomRange(0, 720));
    const randomX2 = Math.floor(randomRange(0, 720));
    const randomY2 = Math.floor(randomRange(0, 720));

    leftDie.style.transform = `rotateX(${randomX1}deg) rotateY(${randomY1}deg)`;
    rightDie.style.transform = `rotateX(${randomX2}deg) rotateY(${randomY2}deg)`;
  }, 120);

  setTimeout(() => {
    clearInterval(spinInterval);

    const result = randomNumber();
    const rightValue = randomNumber();

    setDieFace(leftDie, result);
    setDieFace(rightDie, rightValue);

    scene.classList.remove("rolling");
    resultEl.textContent = `Resultado: ${result}`;

    if (result === 6) {
      launchConfetti();
    }

    rollButton.disabled = false;
  }, 1800);
});
