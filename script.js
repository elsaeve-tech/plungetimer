let plungeSeconds = 0;
let currentSeconds = 0;
let timerInterval = null;
let breathingInterval = null;

let protocolInterval = null;
let protocolSeconds = 0;
let protocolStageIndex = 0;

const protocolStages = [
  { label: "Sauna", seconds: 600 },
  { label: "Cold Plunge", seconds: 120 },
  { label: "Rest", seconds: 300 },
  { label: "Sauna", seconds: 600 },
  { label: "Cold Plunge", seconds: 120 },
  { label: "Rest", seconds: 300 },
  { label: "Sauna", seconds: 600 },
  { label: "Cold Plunge", seconds: 120 },
  { label: "Rest", seconds: 300 }
];

function calculatePlunge() {
  const temp = Number(document.getElementById("temp").value);
  const level = document.getElementById("level").value;
  const result = document.getElementById("result");
  const note = document.getElementById("note");
  const timerDisplay = document.getElementById("timerDisplay");
const warning = document.getElementById("coldWarning");
warning.textContent = "";

  if (!temp) {
    result.textContent = "--:--";
    note.textContent = "Please enter a water temperature.";
    plungeSeconds = 0;
    currentSeconds = 0;
    timerDisplay.textContent = "00:00";
    updateShareCard();
    return;
  }

  if (temp < 35 || temp > 65) {
    result.textContent = "--:--";
    note.textContent = "Use a temperature between 35°F and 65°F for this tool.";
    plungeSeconds = 0;
    currentSeconds = 0;
    timerDisplay.textContent = "00:00";
    updateShareCard();
    return;
  }
if (temp <= 38) {
  warning.textContent =
    "Very cold water. Limit exposure and exit immediately if you feel numb, dizzy, or short of breath.";
}

  plungeSeconds = getSuggestedSeconds(temp, level);
  currentSeconds = plungeSeconds;

  result.textContent = formatTime(plungeSeconds);
  timerDisplay.textContent = formatTime(currentSeconds);
  note.textContent = getSupportText(temp, level);

  clearInterval(timerInterval);
  timerInterval = null;
  stopBreathingAnimation();
  updateShareCard();
}

function getSuggestedSeconds(temp, level) {
  if (level === "beginner") {
    if (temp <= 40) return 30;
    if (temp <= 45) return 45;
    if (temp <= 50) return 60;
    if (temp <= 55) return 90;
    return 120;
  }

  if (level === "intermediate") {
    if (temp <= 40) return 60;
    if (temp <= 45) return 90;
    if (temp <= 50) return 120;
    if (temp <= 55) return 150;
    return 180;
  }

  if (temp <= 40) return 90;
  if (temp <= 45) return 120;
  if (temp <= 50) return 180;
  if (temp <= 55) return 240;
  return 300;
}

function getSupportText(temp, level) {
  if (level === "beginner") {
    return "Beginner mode keeps the timer short and conservative. Focus on calm breathing and get out if you feel dizzy, numb, or unwell.";
  }

  if (level === "intermediate") {
    return "Intermediate mode gives a longer exposure, but colder water still means shorter time. Stay controlled and exit if your body feels stressed.";
  }

  if (temp <= 45) {
    return "Advanced mode can tolerate colder water, but this tool still keeps very cold plunges brief.";
  }

  return "Advanced mode allows a longer timer, but this tool caps the session at 5:00 for a conservative wellness approach.";
}

function startTimer() {
  if (currentSeconds <= 0) return;
  if (timerInterval) return;

  startBreathingAnimation();

  timerInterval = setInterval(function () {
    if (currentSeconds > 0) {
      currentSeconds--;
      document.getElementById("timerDisplay").textContent = formatTime(currentSeconds);
    } else {
      clearInterval(timerInterval);
      timerInterval = null;
      stopBreathingAnimation();
      document.getElementById("timerDisplay").textContent = "Done!";
      completePlungeSession();
      playBell();
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  stopBreathingAnimation();
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  stopBreathingAnimation();
  currentSeconds = plungeSeconds;
  document.getElementById("timerDisplay").textContent =
    plungeSeconds > 0 ? formatTime(plungeSeconds) : "00:00";
}

function startBreathingAnimation() {
  const circle = document.getElementById("breathCircle");
  const text = document.getElementById("breathingText");

  circle.classList.add("breathing-animate");
  text.textContent = "Inhale • hold • exhale";

  clearInterval(breathingInterval);

  let phase = 0;
  const phases = ["Inhale", "Hold", "Exhale", "Hold"];

  text.textContent = phases[phase];

  breathingInterval = setInterval(function () {
    phase = (phase + 1) % phases.length;
    text.textContent = phases[phase];
  }, 2000);
}

function stopBreathingAnimation() {
  const circle = document.getElementById("breathCircle");
  const text = document.getElementById("breathingText");

  circle.classList.remove("breathing-animate");
  text.textContent = "Slow inhale • slow exhale";

  clearInterval(breathingInterval);
  breathingInterval = null;
}

function completePlungeSession() {
  const today = new Date().toDateString();
  const lastCompleted = localStorage.getItem("plungeLastCompleted");
  let streak = Number(localStorage.getItem("plungeStreak")) || 0;

  if (lastCompleted === today) {
    updateStreakDisplay(streak);
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (lastCompleted === yesterday.toDateString()) {
    streak += 1;
  } else {
    streak = 1;
  }

  localStorage.setItem("plungeLastCompleted", today);
  localStorage.setItem("plungeStreak", String(streak));
  updateStreakDisplay(streak);
}

function loadStreak() {
  const streak = Number(localStorage.getItem("plungeStreak")) || 0;
  updateStreakDisplay(streak);
}

function updateStreakDisplay(streak) {
  document.getElementById("streakCount").textContent = streak;
  document.getElementById("streakPlural").textContent = streak === 1 ? "" : "s";
}

function startProtocol() {
  if (protocolInterval) return;

  if (protocolSeconds <= 0) {
    protocolStageIndex = 0;
    protocolSeconds = protocolStages[0].seconds;
    renderProtocol();
  }

  protocolInterval = setInterval(function () {
    if (protocolSeconds > 0) {
      protocolSeconds--;
      renderProtocol();
      if (protocolSeconds === 0) {
        playBell();
      }
    } else {
      protocolStageIndex++;

      if (protocolStageIndex >= protocolStages.length) {
        clearInterval(protocolInterval);
        protocolInterval = null;
        document.getElementById("protocolLabel").textContent = "Protocol complete";
        document.getElementById("protocolDisplay").textContent = "Done!";
        document.getElementById("protocolRound").textContent = "Great work.";
        return;
      }

      protocolSeconds = protocolStages[protocolStageIndex].seconds;
      renderProtocol();
    }
  }, 1000);
}

function resetProtocol() {
  clearInterval(protocolInterval);
  protocolInterval = null;
  protocolStageIndex = 0;
  protocolSeconds = 0;
  document.getElementById("protocolLabel").textContent = "Ready to begin";
  document.getElementById("protocolDisplay").textContent = "00:00";
  document.getElementById("protocolRound").textContent = "Round 1 of 3";
}

function renderProtocol() {
  const stage = protocolStages[protocolStageIndex];
  const round = Math.floor(protocolStageIndex / 3) + 1;

  document.getElementById("protocolLabel").textContent = stage.label;
  document.getElementById("protocolDisplay").textContent = formatTime(protocolSeconds);
  document.getElementById("protocolRound").textContent = `Round ${round} of 3`;
}

function updateShareCard() {
  const temp = document.getElementById("temp").value;
  const level = document.getElementById("level").value;
  const result = document.getElementById("result").textContent;

  document.getElementById("shareTemp").textContent = temp ? `${temp}°F` : "--°F";
  document.getElementById("shareTime").textContent = result && result !== "--:--" ? result : "--:--";
  document.getElementById("shareLevel").textContent =
    level ? capitalize(level) : "--";
}

function downloadShareCard() {
  updateShareCard();

  const card = document.getElementById("shareCard");

  html2canvas(card, {
    backgroundColor: null,
    scale: 2
  }).then(function(canvas) {
    const link = document.createElement("a");
    link.download = "plunge-timer-card.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}

function playBell() {
  const audio = new Audio("https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg");
  audio.play();
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

loadStreak();
updateShareCard();

const copyButton = document.getElementById("copyResultButton");

if (copyButton) {
  copyButton.addEventListener("click", () => {
    
    const resultText = document.getElementById("resultBox").innerText;

    const shareText =
`My cold plunge today:
${resultText}

Try the calculator:
https://coldplungetime.com`;

    navigator.clipboard.writeText(shareText);

    copyButton.innerText = "Copied!";
    
    setTimeout(() => {
      copyButton.innerText = "Copy plunge result";
    }, 2000);

  });
}
