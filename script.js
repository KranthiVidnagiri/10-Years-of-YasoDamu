const panels = Array.from(document.querySelectorAll(".panel"));
const cards = Array.from(document.querySelectorAll(".memory-card"));
const dots = Array.from(document.querySelectorAll(".dot"));
const musicToggle = document.getElementById("musicToggle");
const particleCanvas = document.getElementById("particleLayer");
const storyStage = document.getElementById("storyStage");

const SLIDE_DURATION = 4000;

let activeIndex = 0;
let slideshowTimer = null;
let finalTimer = null;
let autoStarted = false;
let pointerX = 0;
let pointerY = 0;

/* ---------------- PANEL CONTROL ---------------- */

function showPanel(name) {
  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === name);
  });
}

/* ---------------- DOTS ---------------- */

function updateDots(index) {
  dots.forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === index);
  });
}

/* ---------------- CARD ANIMATION ---------------- */

function activateCard(index) {
  cards.forEach((card, cardIndex) => {
    card.classList.remove("active", "prev");

    if (cardIndex === index) {
      const tilt = (index % 2 === 0 ? -1 : 1) * (3 + index);
      card.style.setProperty("--card-tilt", `${tilt}deg`);
      card.classList.add("active");

      const image = card.querySelector("img");
      image.style.animation = "none";
      void image.offsetWidth;
      image.style.animation = "";
    } else if (cardIndex === index - 1) {
      card.classList.add("prev");
    }
  });

  updateDots(index);
}

/* ---------------- RESET ---------------- */

function resetToIntro() {
  const audio = document.getElementById("bgMusic");

  clearInterval(slideshowTimer);
  clearTimeout(finalTimer);

  activeIndex = 0;
  autoStarted = false;

  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }

  showPanel("intro");

  cards.forEach(card => card.classList.remove("active", "prev"));
  if (cards[0]) cards[0].classList.add("active");

  updateDots(0);

  musicToggle.setAttribute("aria-pressed", "false");
  musicToggle.textContent = "Play Music";
}

/* ---------------- SLIDESHOW ---------------- */

function startSlideshow() {
  showPanel("slideshow");
  activateCard(activeIndex);

  clearInterval(slideshowTimer);

  slideshowTimer = setInterval(() => {
    activeIndex++;

    if (activeIndex >= cards.length) {
      clearInterval(slideshowTimer);

      showPanel("finale");

      // wait 3 seconds then reset
      clearTimeout(finalTimer);
      finalTimer = setTimeout(() => {
        resetToIntro();
      }, 3000);

      return;
    }

    activateCard(activeIndex);

  }, SLIDE_DURATION);
}

/* ---------------- MANUAL DOT NAVIGATION ---------------- */

function setupManualNavigation() {
  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      activeIndex = Number(dot.dataset.go);

      showPanel("slideshow");
      activateCard(activeIndex);

      clearInterval(slideshowTimer);

      slideshowTimer = setInterval(() => {
        activeIndex++;

        if (activeIndex >= cards.length) {
          clearInterval(slideshowTimer);

          showPanel("finale");

          clearTimeout(finalTimer);
          finalTimer = setTimeout(() => {
            resetToIntro();
          }, 3000);

          return;
        }

        activateCard(activeIndex);

      }, SLIDE_DURATION);
    });
  });
}

/* ---------------- PARALLAX ---------------- */

function setupParallax() {
  const updateParallax = () => {
    const rotateY = ((pointerX / window.innerWidth) - 0.5) * 8;
    const rotateX = (((pointerY / window.innerHeight) - 0.5) * -6);
    storyStage.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  window.addEventListener("pointermove", (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    updateParallax();
  });

  window.addEventListener("deviceorientation", (event) => {
    if (event.gamma === null || event.beta === null) return;

    pointerX = ((event.gamma + 45) / 90) * window.innerWidth;
    pointerY = ((event.beta + 90) / 180) * window.innerHeight;

    updateParallax();
  });
}

/* ---------------- MUSIC (SYNC FIXED) ---------------- */

function setupMusic() {
  const audio = document.getElementById("bgMusic");

  if (!audio) {
    console.error("Audio element not found");
    return;
  }

  audio.preload = "auto";

  // 🔥 unlock audio instantly (removes delay)
  document.body.addEventListener("click", () => {
    audio.muted = true;
    audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
    }).catch(() => {});
  }, { once: true });

  musicToggle.addEventListener("click", () => {
    const isPlaying = musicToggle.getAttribute("aria-pressed") === "true";

    if (!isPlaying) {
      audio.currentTime = 0;

      // 🔥 wait for real playback → perfect sync
      audio.play().then(() => {

        if (!autoStarted) {
          autoStarted = true;
          startSlideshow();
        }

      }).catch(err => {
        console.error("Play failed:", err);
      });

    } else {
      resetToIntro();
    }

    musicToggle.setAttribute("aria-pressed", String(!isPlaying));
    musicToggle.textContent = isPlaying ? "Play Music" : "Pause Music";
  });

  audio.addEventListener("ended", () => {
    resetToIntro();
  });
}

/* ---------------- PARTICLES ---------------- */

function setupParticles() {
  const ctx = particleCanvas.getContext("2d");
  const particles = [];
  const totalParticles = 48;

  function resize() {
    particleCanvas.width = window.innerWidth * window.devicePixelRatio;
    particleCanvas.height = window.innerHeight * window.devicePixelRatio;

    particleCanvas.style.width = `${window.innerWidth}px`;
    particleCanvas.style.height = `${window.innerHeight}px`;

    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }

  function createParticle(index) {
    const heart = index % 8 === 0;

    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: heart ? 10 + Math.random() * 6 : 2 + Math.random() * 4,
      speedY: 0.15 + Math.random() * 0.45,
      speedX: (Math.random() - 0.5) * 0.4,
      alpha: 0.18 + Math.random() * 0.45,
      heart,
      phase: Math.random() * Math.PI * 2
    };
  }

  function drawHeart(x, y, size, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 12, size / 12);

    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.bezierCurveTo(0, -1, -8, -2, -8, 4);
    ctx.bezierCurveTo(-8, 9, 0, 12, 0, 17);
    ctx.bezierCurveTo(0, 12, 8, 9, 8, 4);
    ctx.bezierCurveTo(8, -2, 0, -1, 0, 4);

    ctx.fillStyle = `rgba(255, 181, 193, ${alpha})`;
    ctx.shadowBlur = 16;
    ctx.shadowColor = "rgba(255, 200, 210, 0.55)";
    ctx.fill();

    ctx.restore();
  }

  for (let i = 0; i < totalParticles; i++) {
    particles.push(createParticle(i));
  }

  function render() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    particles.forEach((particle, index) => {
      particle.y -= particle.speedY;
      particle.x += particle.speedX + Math.sin(performance.now() / 1600 + particle.phase) * 0.12;

      if (particle.y < -30) {
        particles[index] = createParticle(index);
        particles[index].y = window.innerHeight + Math.random() * 60;
      }

      if (particle.heart) {
        drawHeart(particle.x, particle.y, particle.size, particle.alpha);
      } else {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 232, 189, ${particle.alpha})`;
        ctx.shadowBlur = 14;
        ctx.shadowColor = "rgba(255, 210, 150, 0.45)";
        ctx.fill();
      }
    });

    requestAnimationFrame(render);
  }

  resize();
  render();
  window.addEventListener("resize", resize);
}

/* ---------------- INIT ---------------- */

window.addEventListener("load", () => {
  setupParticles();
  setupParallax();
  setupMusic();
  setupManualNavigation();
});
