const navLinks = Array.from(document.querySelectorAll(".menu a"));
const sections = navLinks
  .map((link) => document.getElementById(link.dataset.target))
  .filter(Boolean);
const photoImages = Array.from(document.querySelectorAll(".photo-set img"));
const photographyLinks = Array.from(
  document.querySelectorAll('.hero-actions a[href="#photography"]')
);
const photographyMusic = document.getElementById("photography-music");
const musicToggle = document.querySelector(".music-toggle");
const volumeSlider = document.querySelector(".volume-slider");
const heroCopy = document.querySelector(".hero-copy");
const rotatingGreeting = document.querySelector(".rotating-greeting");
const rotatingName = document.querySelector(".rotating-name");
const heroLanguages = [
  { greeting: "你好，我是", name: "冯 时", size: "chinese" },
  { greeting: "こんにちは、", name: "フウ　ジです", size: "japanese" },
  { greeting: "Bonjour, je suis", name: "Feng Shi", size: "large" },
];
let heroLanguageIndex = 0;

function applyHeroLanguage(language) {
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

  photographyMusic.play().then(() => {
    setMusicButtonState(true);
  }).catch(() => {
    setMusicButtonState(false);
  });
}

navLinks.forEach((link) => {
  link.addEventListener("mouseenter", () => {
    setActiveSection(link.dataset.target);
  });

  link.addEventListener("focus", () => {
    setActiveSection(link.dataset.target);
  });

  link.addEventListener("click", (event) => {
    event.preventDefault();
    const target = document.getElementById(link.dataset.target);

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${link.dataset.target}`);
      setActiveSection(link.dataset.target);

      if (link.dataset.target === "photography") {
        playPhotographyMusic();
      }
    }
  });
});

photographyLinks.forEach((link) => {
  link.addEventListener("click", () => {
    playPhotographyMusic();
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

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (visible) {
      setActiveSection(visible.target.id);
    }
  },
  {
    rootMargin: "-25% 0px -55% 0px",
    threshold: [0.08, 0.2, 0.4, 0.7],
  }
);

sections.forEach((section) => observer.observe(section));
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

setActiveSection(location.hash.replace("#", "") || "research");
