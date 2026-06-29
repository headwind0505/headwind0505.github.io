const navLinks = Array.from(document.querySelectorAll(".menu a"));
const pageLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
const pages = Array.from(document.querySelectorAll(".section-panel"));
const photoImages = Array.from(document.querySelectorAll(".photo-set img"));
const photographyMusic = document.getElementById("photography-music");
const musicToggle = document.querySelector(".music-toggle");
const volumeSlider = document.querySelector(".volume-slider");
const heroCopy = document.querySelector(".hero-copy");
const rotatingGreeting = document.querySelector(".rotating-greeting");
const rotatingName = document.querySelector(".rotating-name");
const messageFormFrame = document.querySelector("[data-form-frame]");
const messageFormPlaceholder = document.querySelector("[data-form-placeholder]");
const messageList = document.querySelector("[data-message-list]");
const messageStatus = document.querySelector("[data-message-status]");
const messageRefresh = document.querySelector(".message-refresh");

// Paste your Google Form embed URL and published Google Sheet CSV URL here.
const MESSAGE_FORM_EMBED_URL = "https://docs.google.com/forms/d/e/1FAIpQLSc9D_YeiuF3sjbS278yd5lSC4GLKCJOrjrMZRsXzH69KEuk6w/viewform?embedded=true";
const MESSAGE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSFPHkk-bMXdYHSgc084MSvomMIXWKwVKs6u7UefxaSWikIkFTuNwG0eLobKT_jXO4Ln8WMNN1YRELq/pub?gid=1046313822&single=true&output=csv";

const heroLanguages = [
  { greeting: "你好，我是", name: "冯 时", size: "chinese" },
  { greeting: "こんにちは、", name: "フウ ジです", size: "japanese" },
  { greeting: "Bonjour, je suis", name: "Feng Shi", size: "large" },
];
let heroLanguageIndex = 0;

function applyHeroLanguage(language) {
  if (!rotatingGreeting || !rotatingName) {
    return;
  }

  rotatingGreeting.textContent = language.greeting;
  rotatingName.textContent = language.name;

  if (heroCopy) {
    heroCopy.classList.toggle(
      "is-cjk-title",
      language.size === "chinese" || language.size === "japanese"
    );
    heroCopy.classList.toggle("is-chinese-title", language.size === "chinese");
    heroCopy.classList.toggle("is-japanese-title", language.size === "japanese");
  }
}

function setActiveSection(id) {
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.target === id);
  });
}

function showPage(id, updateHistory = true) {
  const targetId = id || "home";
  const targetPage = document.getElementById(targetId);

  if (!targetPage) {
    return;
  }

  pages.forEach((page) => {
    page.classList.toggle("page-active", page.id === targetId);
  });

  setActiveSection(targetId);

  if (updateHistory) {
    history.replaceState(null, "", `#${targetId}`);
  }

  if (targetId === "photography") {
    playPhotographyMusic();
  }
}

function setMusicButtonState(isPlaying) {
  if (!musicToggle) {
    return;
  }

  musicToggle.textContent = isPlaying ? "Pause music" : "Play music";
  musicToggle.setAttribute("aria-pressed", String(isPlaying));
}

function playPhotographyMusic() {
  if (!photographyMusic) {
    return;
  }

  photographyMusic
    .play()
    .then(() => {
      setMusicButtonState(true);
    })
    .catch(() => {
      setMusicButtonState(false);
    });
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((value) => value.trim()));
}

function normalizeHeader(value) {
  return value.trim().toLowerCase();
}

function pickField(record, candidates) {
  const keys = Object.keys(record);
  const match = keys.find((key) =>
    candidates.some((candidate) => normalizeHeader(key).includes(candidate))
  );

  return match ? record[match].trim() : "";
}

function formatMessageDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || "Time not shown";
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderMessages(records) {
  if (!messageList || !messageStatus) {
    return;
  }

  messageList.innerHTML = "";

  if (!records.length) {
    messageStatus.textContent = "No messages yet.";
    return;
  }

  messageStatus.textContent = `${records.length} message${records.length === 1 ? "" : "s"}, oldest first.`;

  records.forEach((record) => {
    const time = pickField(record, ["timestamp", "time", "date"]);
    const name = pickField(record, ["name"]);
    const place = pickField(record, [
      "place",
      "city",
      "country",
      "location",
      "affiliation",
    ]);
    const message = pickField(record, ["message", "comment", "note"]);
    const item = document.createElement("article");
    const meta = document.createElement("div");
    const text = document.createElement("p");

    item.className = "message-item";
    meta.className = "message-meta";
    text.className = "message-text";
    meta.textContent = [formatMessageDate(time), name || "Anonymous", place]
      .filter(Boolean)
      .join(" / ");
    text.textContent = message || "(No message text)";

    item.append(meta, text);
    messageList.append(item);
  });
}

async function loadMessages() {
  if (!messageList || !messageStatus) {
    return;
  }

  if (!MESSAGE_SHEET_CSV_URL) {
    messageStatus.textContent = "Connect a published Google Sheet CSV URL in script.js.";
    messageList.innerHTML = "";
    return;
  }

  messageStatus.textContent = "Loading messages...";

  try {
    const cacheBreaker = MESSAGE_SHEET_CSV_URL.includes("?") ? "&" : "?";
    const response = await fetch(
      `${MESSAGE_SHEET_CSV_URL}${cacheBreaker}cache=${Date.now()}`
    );

    if (!response.ok) {
      throw new Error(`Message sheet returned ${response.status}`);
    }

    const rows = parseCsv(await response.text());
    const headers = rows.shift() || [];
    const records = rows.map((row) =>
      Object.fromEntries(headers.map((header, index) => [header, row[index] || ""]))
    );

    records.sort((a, b) => {
      const aTime = new Date(pickField(a, ["timestamp", "time", "date"])).getTime();
      const bTime = new Date(pickField(b, ["timestamp", "time", "date"])).getTime();

      return (Number.isNaN(aTime) ? 0 : aTime) - (Number.isNaN(bTime) ? 0 : bTime);
    });

    renderMessages(records);
  } catch (error) {
    messageStatus.textContent =
      "Messages could not be loaded. Check the Google Sheet publish settings.";
  }
}

function setupMessageBoard() {
  if (messageFormFrame && messageFormPlaceholder && MESSAGE_FORM_EMBED_URL) {
    messageFormFrame.src = MESSAGE_FORM_EMBED_URL;
    messageFormFrame.hidden = false;
    messageFormPlaceholder.hidden = true;
  }

  if (messageRefresh) {
    messageRefresh.addEventListener("click", loadMessages);
  }

  loadMessages();
  setInterval(loadMessages, 60000);
}

pageLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href").replace("#", "");

    if (targetId) {
      event.preventDefault();
      showPage(targetId);
    }
  });
});

navLinks.forEach((link) => {
  link.addEventListener("mouseenter", () => {
    setActiveSection(link.dataset.target);
  });

  link.addEventListener("focus", () => {
    setActiveSection(link.dataset.target);
  });
});

if (photographyMusic && musicToggle) {
  if (volumeSlider) {
    photographyMusic.volume = Number(volumeSlider.value);

    volumeSlider.addEventListener("input", () => {
      photographyMusic.volume = Number(volumeSlider.value);
    });
  }

  musicToggle.addEventListener("click", () => {
    if (photographyMusic.paused) {
      playPhotographyMusic();
    } else {
      photographyMusic.pause();
      setMusicButtonState(false);
    }
  });

  photographyMusic.addEventListener("ended", () => {
    setMusicButtonState(false);
  });
}

photoImages.forEach((image) => {
  if (image.complete && image.naturalWidth === 0) {
    image.hidden = true;
  }

  image.addEventListener("error", () => {
    image.hidden = true;
  });
});

if (rotatingGreeting && rotatingName) {
  applyHeroLanguage(heroLanguages[heroLanguageIndex]);

  setInterval(() => {
    heroLanguageIndex = (heroLanguageIndex + 1) % heroLanguages.length;
    rotatingGreeting.classList.add("is-changing");
    rotatingName.classList.add("is-changing");

    setTimeout(() => {
      applyHeroLanguage(heroLanguages[heroLanguageIndex]);
      rotatingGreeting.classList.remove("is-changing");
      rotatingName.classList.remove("is-changing");
    }, 420);
  }, 5000);
}

setupMessageBoard();

window.addEventListener("popstate", () => {
  showPage(location.hash.replace("#", "") || "home", false);
});

showPage(location.hash.replace("#", "") || "home", false);
