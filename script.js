const poemFiles = Array.from({ length: 11 }, (_, index) => `${index + 1}.txt`);

const cover = document.querySelector("#cover");
const reader = document.querySelector("#reader");
const beginButton = document.querySelector("#begin-reading");
const soundToggles = [...document.querySelectorAll(".sound-toggle")];
const backgroundMusic = document.querySelector("#background-music");
const coverLink = document.querySelector("#cover-link");
const poemTitle = document.querySelector("#poem-title");
const poemBody = document.querySelector("#poem-body");
const poemScroll = document.querySelector("#poem-scroll");
const previousButton = document.querySelector("#previous-poem");
const nextButton = document.querySelector("#next-poem");
const closingNote = document.querySelector("#closing-note");
const readAgainButton = document.querySelector("#read-again");
const loadError = document.querySelector("#load-error");

let poems = [];
let currentIndex = 0;
let isReading = false;
let pendingStart = false;
let soundRequested = false;

function updateSoundControl(isOn) {
  soundToggles.forEach((toggle) => {
    const label = isOn ? "Turn background music off" : "Turn background music on";
    toggle.setAttribute("aria-pressed", String(isOn));
    toggle.setAttribute("aria-label", label);
    toggle.title = label;
  });
}

async function startAmbientSound() {
  soundRequested = true;
  backgroundMusic.volume = 0.1;
  updateSoundControl(true);
  try {
    await backgroundMusic.play();
    if (!soundRequested) stopAmbientSound();
  } catch (error) {
    console.error(error);
    if (!soundRequested) return;
    soundRequested = false;
    soundToggles.forEach((toggle) => {
      toggle.disabled = true;
      toggle.setAttribute("aria-pressed", "false");
      toggle.setAttribute("aria-label", "Background music unavailable");
      toggle.title = "Background music unavailable";
    });
  }
}

function stopAmbientSound() {
  soundRequested = false;
  backgroundMusic.pause();
  if (backgroundMusic.readyState > 0) backgroundMusic.currentTime = 0;
  updateSoundControl(false);
}

async function loadPoems() {
  try {
    poems = await Promise.all(poemFiles.map(async (file) => {
      const response = await fetch(file);
      if (!response.ok) throw new Error(`Could not load ${file}`);

      const contents = (await response.text()).replace(/\r\n?/g, "\n");
      const firstBreak = contents.indexOf("\n");
      if (firstBreak === -1) throw new Error(`${file} has no poem body`);

      return {
        title: contents.slice(0, firstBreak),
        body: contents.slice(firstBreak + 1),
      };
    }));
    if (pendingStart) beginReading();
  } catch (error) {
    console.error(error);
    beginButton.disabled = true;
    loadError.hidden = false;
  }
}

function showPoem(index, moveFocus = false) {
  if (index < 0 || index >= poems.length) return;

  currentIndex = index;
  const poem = poems[currentIndex];
  poemTitle.textContent = poem.title;
  poemBody.textContent = poem.body;
  previousButton.disabled = currentIndex === 0;
  nextButton.disabled = currentIndex === poems.length - 1;
  closingNote.hidden = currentIndex !== poems.length - 1;
  poemScroll.scrollTop = 0;

  if (moveFocus) poemTitle.focus({ preventScroll: true });
}

function beginReading(index = 0) {
  if (!poems.length) {
    pendingStart = true;
    return;
  }
  pendingStart = false;
  cover.hidden = true;
  reader.hidden = false;
  isReading = true;
  showPoem(index, true);
}

beginButton.addEventListener("click", () => beginReading());
soundToggles.forEach((toggle) => toggle.addEventListener("click", () => {
  if (soundRequested) {
    stopAmbientSound();
    return;
  }
  startAmbientSound();
}));
backgroundMusic.addEventListener("error", () => {
  soundRequested = false;
  soundToggles.forEach((toggle) => {
    toggle.disabled = true;
    toggle.setAttribute("aria-pressed", "false");
    toggle.setAttribute("aria-label", "Background music unavailable");
    toggle.title = "Background music unavailable";
  });
});
previousButton.addEventListener("click", () => showPoem(currentIndex - 1));
nextButton.addEventListener("click", () => showPoem(currentIndex + 1));
readAgainButton.addEventListener("click", () => showPoem(0, true));

coverLink.addEventListener("click", (event) => {
  event.preventDefault();
  isReading = false;
  reader.hidden = true;
  cover.hidden = false;
  beginButton.focus();
});

document.addEventListener("keydown", (event) => {
  if (!isReading || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === "ArrowLeft" && currentIndex > 0) showPoem(currentIndex - 1);
  if (event.key === "ArrowRight" && currentIndex < poems.length - 1) showPoem(currentIndex + 1);
});

loadPoems();