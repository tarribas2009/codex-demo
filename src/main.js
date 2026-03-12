const ROLL_DB_NAME = "mini-apps-db";
const ROLL_STORE_NAME = "dice-rolls";
const ROLL_LIMIT = 100;

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
const diceStage = document.querySelector(".dice-stage");
const historyChartElement = document.querySelector("#history-chart");
const densityChartElement = document.querySelector("#density-chart");
const dbStatusElement = document.querySelector("#db-status");
const rollCountElement = document.querySelector("#roll-count");
const latestSumElement = document.querySelector("#latest-sum");
const averageSumElement = document.querySelector("#average-sum");
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

const SUM_VALUES = Object.freeze([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

let confettiParticles = [];
let confettiAnimationId = null;
let databasePromise = null;
let rollHistory = [];

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
    renderDiceAnalytics();
  }
}

function getInitialView() {
  const hash = window.location.hash.replace("#", "");
  return hash === "dados" ? "dados" : "hola";
}

function resizeConfettiCanvas() {
  confettiCanvas.width = diceStage.clientWidth;
  confettiCanvas.height = diceStage.clientHeight;
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createEmptyChart(message) {
  return `<div class="chart-empty">${escapeHtml(message)}</div>`;
}

function createHistoryChart(rolls) {
  if (!rolls.length) {
    return createEmptyChart(
      "Todavia no hay tiradas guardadas. Lanza los dados para empezar a dibujar el historial."
    );
  }

  const width = 380;
  const height = 230;
  const margin = { top: 18, right: 20, bottom: 34, left: 38 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const maxIndex = Math.max(rolls.length - 1, 1);
  const valueToY = (value) =>
    margin.top + ((12 - value) / (12 - 2)) * plotHeight;

  const points = rolls.map((roll, index) => ({
    x: margin.left + (index / maxIndex) * plotWidth,
    y: valueToY(roll.sum),
    value: roll.sum,
  }));

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${margin.left + plotWidth} ${
    margin.top + plotHeight
  } L ${margin.left} ${margin.top + plotHeight} Z`;

  const gridValues = [2, 4, 6, 8, 10, 12];
  const grid = gridValues
    .map((value) => {
      const y = valueToY(value);
      return `
        <line class="chart-grid-line" x1="${margin.left}" y1="${y}" x2="${
          margin.left + plotWidth
        }" y2="${y}"></line>
        <text class="chart-label" x="${margin.left - 10}" y="${
          y + 4
        }" text-anchor="end">${value}</text>
      `;
    })
    .join("");

  const dots = points
    .map(
      (point) =>
        `<circle class="chart-point" cx="${point.x}" cy="${point.y}" r="3.3"></circle>`
    )
    .join("");
  const latestValue = rolls[rolls.length - 1].sum;

  return `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Grafica historica de las sumas">
      ${grid}
      <line class="chart-axis-line" x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${
        margin.left + plotWidth
      }" y2="${margin.top + plotHeight}"></line>
      <path class="chart-area" d="${areaPath}"></path>
      <path class="chart-line" d="${linePath}"></path>
      ${dots}
      <text class="chart-label" x="${margin.left}" y="${height - 8}">Primera</text>
      <text class="chart-label" x="${margin.left + plotWidth}" y="${height - 8}" text-anchor="end">Ultima</text>
      <text class="chart-label" x="${margin.left + plotWidth}" y="${margin.top + 10}" text-anchor="end">Ultima suma: ${latestValue}</text>
    </svg>
  `;
}

function createDensityChart(rolls) {
  if (!rolls.length) {
    return createEmptyChart(
      "La densidad aparecera cuando haya datos suficientes en la base de datos local."
    );
  }

  const width = 380;
  const height = 230;
  const margin = { top: 18, right: 20, bottom: 36, left: 40 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const counts = Object.fromEntries(SUM_VALUES.map((value) => [value, 0]));

  rolls.forEach((roll) => {
    counts[roll.sum] += 1;
  });

  const probabilities = SUM_VALUES.map((value) => ({
    value,
    probability: counts[value] / rolls.length,
  }));
  const maxProbability = Math.max(...probabilities.map((item) => item.probability), 0.01);
  const slotWidth = plotWidth / probabilities.length;
  const barWidth = slotWidth * 0.72;

  const bars = probabilities
    .map((item, index) => {
      const heightRatio = item.probability / maxProbability;
      const barHeight = plotHeight * heightRatio;
      const x = margin.left + index * slotWidth + (slotWidth - barWidth) / 2;
      const y = margin.top + plotHeight - barHeight;

      return `
        <rect class="chart-bar" x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="8"></rect>
        <text class="chart-label" x="${x + barWidth / 2}" y="${height - 10}" text-anchor="middle">${item.value}</text>
        <text class="chart-label" x="${x + barWidth / 2}" y="${Math.max(
        y - 8,
        margin.top + 12
      )}" text-anchor="middle">${(item.probability * 100).toFixed(0)}%</text>
      `;
    })
    .join("");

  return `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Distribucion de probabilidad de las sumas">
      <line class="chart-axis-line" x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${
        margin.left + plotWidth
      }" y2="${margin.top + plotHeight}"></line>
      <rect class="chart-bar-soft" x="${margin.left}" y="${margin.top}" width="${plotWidth}" height="${plotHeight}"></rect>
      ${bars}
    </svg>
  `;
}

function renderDiceAnalytics() {
  const totalRolls = rollHistory.length;
  const latestRoll = rollHistory[totalRolls - 1] || null;
  const average =
    totalRolls > 0
      ? (
          rollHistory.reduce((sum, roll) => sum + roll.sum, 0) / totalRolls
        ).toFixed(2)
      : "-";

  rollCountElement.textContent = String(totalRolls);
  latestSumElement.textContent = latestRoll ? String(latestRoll.sum) : "-";
  averageSumElement.textContent = average;
  historyChartElement.innerHTML = createHistoryChart(rollHistory);
  densityChartElement.innerHTML = createDensityChart(rollHistory);
}

function openRollDatabase() {
  if (!("indexedDB" in window)) {
    return Promise.reject(new Error("IndexedDB no esta disponible en este navegador."));
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(ROLL_DB_NAME, 1);

      request.addEventListener("upgradeneeded", () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(ROLL_STORE_NAME)) {
          const store = database.createObjectStore(ROLL_STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("createdAt", "createdAt");
        }
      });

      request.addEventListener("success", () => {
        resolve(request.result);
      });

      request.addEventListener("error", () => {
        reject(request.error || new Error("No se pudo abrir IndexedDB."));
      });
    });
  }

  return databasePromise;
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });
}

async function loadRollHistory() {
  const database = await openRollDatabase();
  const transaction = database.transaction(ROLL_STORE_NAME, "readonly");
  const store = transaction.objectStore(ROLL_STORE_NAME);
  const rolls = await requestToPromise(store.getAll());

  rolls.sort((firstRoll, secondRoll) => firstRoll.createdAt - secondRoll.createdAt);
  return rolls.slice(-ROLL_LIMIT);
}

async function trimRollHistory() {
  const database = await openRollDatabase();
  const transaction = database.transaction(ROLL_STORE_NAME, "readonly");
  const store = transaction.objectStore(ROLL_STORE_NAME);
  const allRolls = await requestToPromise(store.getAll());

  allRolls.sort((firstRoll, secondRoll) => firstRoll.createdAt - secondRoll.createdAt);

  if (allRolls.length <= ROLL_LIMIT) {
    return;
  }

  const outdatedIds = allRolls
    .slice(0, allRolls.length - ROLL_LIMIT)
    .map((roll) => roll.id);
  const deleteTransaction = database.transaction(ROLL_STORE_NAME, "readwrite");
  const deleteStore = deleteTransaction.objectStore(ROLL_STORE_NAME);

  outdatedIds.forEach((id) => {
    deleteStore.delete(id);
  });

  await new Promise((resolve, reject) => {
    deleteTransaction.addEventListener("complete", resolve);
    deleteTransaction.addEventListener("error", () => {
      reject(deleteTransaction.error || new Error("No se pudo limpiar el historial."));
    });
  });
}

async function saveRoll(leftValue, rightValue) {
  const database = await openRollDatabase();
  const transaction = database.transaction(ROLL_STORE_NAME, "readwrite");
  const store = transaction.objectStore(ROLL_STORE_NAME);

  store.add({
    leftValue,
    rightValue,
    sum: leftValue + rightValue,
    createdAt: Date.now(),
  });

  await new Promise((resolve, reject) => {
    transaction.addEventListener("complete", resolve);
    transaction.addEventListener("error", () => {
      reject(transaction.error || new Error("No se pudo guardar la tirada."));
    });
  });

  await trimRollHistory();
  rollHistory = await loadRollHistory();
}

async function initializeDiceDatabase() {
  try {
    dbStatusElement.textContent = "Base de datos local conectada. Guardando ultimas 100 tiradas.";
    rollHistory = await loadRollHistory();
    renderDiceAnalytics();
  } catch (error) {
    dbStatusElement.textContent =
      "No se pudo abrir IndexedDB en este navegador. Las graficas historicas no estan disponibles.";
    historyChartElement.innerHTML = createEmptyChart(
      "IndexedDB no esta disponible, asi que no se puede persistir el historial."
    );
    densityChartElement.innerHTML = createEmptyChart(
      "Activa IndexedDB o prueba en otro navegador para ver la densidad de probabilidad."
    );
  }
}

function handleHelloClick() {
  helloMessage.textContent = "Hola";
}

async function completeDiceRoll(leftValue, rightValue) {
  setDieFace(leftDie, leftValue);
  setDieFace(rightDie, rightValue);
  scene.classList.remove("rolling");
  resultElement.textContent = `Resultado: ${leftValue} + ${rightValue} = ${
    leftValue + rightValue
  }`;

  if (leftValue === 6) {
    launchConfetti();
  } else {
    stopConfetti();
  }

  try {
    await saveRoll(leftValue, rightValue);
    dbStatusElement.textContent =
      "Base de datos local conectada. Guardando ultimas 100 tiradas.";
    renderDiceAnalytics();
  } catch (error) {
    dbStatusElement.textContent =
      "La tirada se mostro, pero no se pudo guardar en IndexedDB.";
  } finally {
    rollButton.disabled = false;
  }
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
    completeDiceRoll(leftValue, rightValue);
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

window.addEventListener("resize", () => {
  resizeConfettiCanvas();
  renderDiceAnalytics();
});

setDieFace(leftDie, 1);
setDieFace(rightDie, 1);
resizeConfettiCanvas();
setActiveView(getInitialView());
renderDiceAnalytics();
initializeDiceDatabase();
