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

window.addEventListener("popstate", () => {
  showPage(location.hash.replace("#", "") || "home", false);
});

showPage(location.hash.replace("#", "") || "home", false);
