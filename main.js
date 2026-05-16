/* ═══════════════════════════════════════════════════
   DEEPIKA SHERAWAT — 3D Portfolio
   main.js — Three.js + Animations + Interactivity
═══════════════════════════════════════════════════ */

'use strict';

/* ─── Three.js Particle Network ─── */
(function initThreeJS() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  // Scene setup
  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  camera.position.set(0, 0, 80);

  /* ── Particle Parameters ── */
  const PARTICLE_COUNT    = window.innerWidth < 768 ? 80 : 160;
  const CONNECTION_DIST   = 22;
  const DEPTH_RANGE       = 60;
  const SPREAD_X          = 90;
  const SPREAD_Y          = 55;
  const BASE_SPEED        = 0.008;

  /* ── Particle data arrays ── */
  const positions   = new Float32Array(PARTICLE_COUNT * 3);
  const velocities  = [];
  const sizes       = new Float32Array(PARTICLE_COUNT);
  const colors      = new Float32Array(PARTICLE_COUNT * 3);

  // Purple → Cyan color palette
  const colorPalette = [
    { r: 0.486, g: 0.227, b: 0.929 }, // purple #7c3aed
    { r: 0.659, g: 0.333, b: 0.969 }, // purple-light #a855f7
    { r: 0.024, g: 0.714, b: 0.831 }, // cyan #06b6d4
    { r: 0.133, g: 0.827, b: 0.933 }, // cyan-light #22d3ee
    { r: 0.8,   g: 0.4,   b: 1.0   }, // lavender
  ];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;

    // Position
    positions[i3]     = (Math.random() - 0.5) * SPREAD_X * 2;
    positions[i3 + 1] = (Math.random() - 0.5) * SPREAD_Y * 2;
    positions[i3 + 2] = (Math.random() - 0.5) * DEPTH_RANGE;

    // Velocity
    velocities.push({
      x: (Math.random() - 0.5) * BASE_SPEED,
      y: (Math.random() - 0.5) * BASE_SPEED,
      z: (Math.random() - 0.5) * BASE_SPEED * 0.3,
    });

    // Size
    sizes[i] = Math.random() * 1.8 + 0.6;

    // Color
    const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    colors[i3]     = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;
  }

  /* ── Particle Geometry & Material ── */
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
  particleGeo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

  const particleMat = new THREE.PointsMaterial({
    size:          1.4,
    sizeAttenuation: true,
    vertexColors:  true,
    transparent:   true,
    opacity:       0.85,
    blending:      THREE.AdditiveBlending,
    depthWrite:    false,
  });

  const particleSystem = new THREE.Points(particleGeo, particleMat);
  scene.add(particleSystem);

  /* ── Connection Lines ── */
  const lineMat = new THREE.LineBasicMaterial({
    color:       0x7c3aed,
    transparent: true,
    opacity:     0.15,
    blending:    THREE.AdditiveBlending,
    depthWrite:  false,
  });

  // We rebuild line geometry each frame for dynamic connections
  let lineSegments = null;

  function buildConnections() {
    const linePositions = [];
    const pos = particleGeo.attributes.position.array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ax = pos[i * 3], ay = pos[i * 3 + 1], az = pos[i * 3 + 2];

      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        const bx = pos[j * 3], by = pos[j * 3 + 1], bz = pos[j * 3 + 2];
        const dx = ax - bx, dy = ay - by, dz = az - bz;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

        if (dist < CONNECTION_DIST) {
          linePositions.push(ax, ay, az, bx, by, bz);
        }
      }
    }
    return linePositions;
  }

  /* ── Mouse parallax ── */
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

  document.addEventListener('mousemove', (e) => {
    mouse.targetX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* ── Touch support ── */
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      mouse.targetX = (e.touches[0].clientX / window.innerWidth  - 0.5) * 2;
      mouse.targetY = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
    }
  }, { passive: true });

  /* ── Resize handler ── */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  /* ── Animation Loop ── */
  let frameId;
  let frameCount = 0;

  function animate() {
    frameId = requestAnimationFrame(animate);
    frameCount++;

    // Smooth mouse lerp
    mouse.x += (mouse.targetX - mouse.x) * 0.04;
    mouse.y += (mouse.targetY - mouse.y) * 0.04;

    const pos = particleGeo.attributes.position.array;

    // Update particle positions
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      pos[i3]     += velocities[i].x;
      pos[i3 + 1] += velocities[i].y;
      pos[i3 + 2] += velocities[i].z;

      // Wrap boundaries
      if (pos[i3]     >  SPREAD_X)  pos[i3]     = -SPREAD_X;
      if (pos[i3]     < -SPREAD_X)  pos[i3]     =  SPREAD_X;
      if (pos[i3 + 1] >  SPREAD_Y)  pos[i3 + 1] = -SPREAD_Y;
      if (pos[i3 + 1] < -SPREAD_Y)  pos[i3 + 1] =  SPREAD_Y;
      if (pos[i3 + 2] >  DEPTH_RANGE/2)  pos[i3 + 2] = -DEPTH_RANGE/2;
      if (pos[i3 + 2] < -DEPTH_RANGE/2)  pos[i3 + 2] =  DEPTH_RANGE/2;
    }

    particleGeo.attributes.position.needsUpdate = true;

    // Rebuild connections every 2 frames for performance
    if (frameCount % 2 === 0) {
      if (lineSegments) {
        scene.remove(lineSegments);
        lineSegments.geometry.dispose();
      }

      const linePos = buildConnections();
      if (linePos.length > 0) {
        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
        lineSegments = new THREE.LineSegments(lineGeo, lineMat);
        scene.add(lineSegments);
      }
    }

    // Parallax camera rotation
    particleSystem.rotation.x = mouse.y * 0.06;
    particleSystem.rotation.y = mouse.x * 0.08;
    if (lineSegments) {
      lineSegments.rotation.x = mouse.y * 0.06;
      lineSegments.rotation.y = mouse.x * 0.08;
    }

    // Slow auto-rotation
    particleSystem.rotation.z += 0.0002;

    renderer.render(scene, camera);
  }

  // Only animate when hero is visible
  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (!frameId) animate();
      } else {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
    });
  }, { threshold: 0.1 });

  heroObserver.observe(document.getElementById('hero'));
  animate(); // start immediately
})();


/* ─── Navbar Scroll Behavior ─── */
(function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  // Scroll state
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });

  // Hamburger toggle
  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close on nav link click
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', false);
      document.body.style.overflow = '';
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target) && navLinks.classList.contains('open')) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', false);
      document.body.style.overflow = '';
    }
  });

  // Active link highlight on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinkEls = document.querySelectorAll('.nav-link');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinkEls.forEach(link => link.classList.remove('active'));
        const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });

  sections.forEach(s => sectionObserver.observe(s));
})();


/* ─── Typewriter Effect ─── */
(function initTypewriter() {
  const el = document.getElementById('typewriter');
  if (!el) return;

  const phrases = [
    'Building AI Systems',
    'LLM Engineer',
    'Multi-Agent AI Expert',
    'Data Scientist',
    'Generative AI Developer',
    'React.js Web Developer',
    'Full-Stack AI Solutions',
  ];

  let phraseIdx  = 0;
  let charIdx    = 0;
  let deleting   = false;
  let pauseTimer = null;

  const TYPE_SPEED   = 70;
  const DELETE_SPEED = 35;
  const PAUSE_AFTER  = 2000;
  const PAUSE_BEFORE = 400;

  function tick() {
    const current = phrases[phraseIdx];

    if (!deleting) {
      el.textContent = current.slice(0, charIdx + 1);
      charIdx++;
      if (charIdx === current.length) {
        deleting = true;
        pauseTimer = setTimeout(tick, PAUSE_AFTER);
        return;
      }
    } else {
      el.textContent = current.slice(0, charIdx - 1);
      charIdx--;
      if (charIdx === 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        pauseTimer = setTimeout(tick, PAUSE_BEFORE);
        return;
      }
    }

    const speed = deleting ? DELETE_SPEED : TYPE_SPEED + Math.random() * 30;
    pauseTimer = setTimeout(tick, speed);
  }

  tick();
})();


/* ─── Scroll Reveal (Intersection Observer) ─── */
(function initReveal() {
  const revealEls = document.querySelectorAll('.reveal');

  if (!revealEls.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Unobserve after reveal for performance
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold:  0.12,
    rootMargin: '0px 0px -60px 0px',
  });

  revealEls.forEach(el => observer.observe(el));
})();


/* ─── Skill Bars Animation ─── */
(function initSkillBars() {
  const bars = document.querySelectorAll('.skill-bar-fill');
  if (!bars.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const width = bar.getAttribute('data-width');
        // Small delay so transition is visible
        requestAnimationFrame(() => {
          setTimeout(() => {
            bar.style.width = width + '%';
            bar.classList.add('animated');
          }, 200);
        });
        observer.unobserve(bar);
      }
    });
  }, { threshold: 0.2 });

  bars.forEach(bar => observer.observe(bar));
})();


/* ─── Smooth Scroll for internal links ─── */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#' || !href) return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      const navH = document.getElementById('navbar').offsetHeight;
      const top  = target.getBoundingClientRect().top + window.scrollY - navH - 16;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();


/* ─── Scroll Indicator click ─── */
(function initScrollIndicator() {
  const indicator = document.querySelector('.scroll-indicator');
  if (!indicator) return;
  indicator.addEventListener('click', () => {
    const about = document.getElementById('about');
    if (about) about.scrollIntoView({ behavior: 'smooth' });
  });
})();


/* ─── Download Resume button ─── */
(function initDownloadBtn() {
  const btn = document.getElementById('downloadBtn');
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    // Placeholder — replace with actual resume file path
    alert('Resume download will be available soon!\n\nContact: dsherawat54@gmail.com');
  });
})();


/* ─── Tool tags stagger animation ─── */
(function initToolTags() {
  const tags = document.querySelectorAll('.tool-tag');
  if (!tags.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        tags.forEach((tag, i) => {
          tag.style.opacity    = '0';
          tag.style.transform  = 'translateY(12px)';
          tag.style.transition = `opacity 0.4s ease ${i * 30}ms, transform 0.4s ease ${i * 30}ms`;
          setTimeout(() => {
            tag.style.opacity   = '1';
            tag.style.transform = 'translateY(0)';
          }, i * 30 + 100);
        });
        observer.disconnect();
      }
    });
  }, { threshold: 0.2 });

  const toolsSection = document.querySelector('.tools-cloud');
  if (toolsSection) observer.observe(toolsSection);
})();


/* ─── Project cards 3D tilt effect ─── */
(function initCardTilt() {
  const cards = document.querySelectorAll('.project-card, .edu-card, .ccontact-card');

  // Only on non-touch devices
  if ('ontouchstart' in window) return;

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect   = card.getBoundingClientRect();
      const centerX = rect.left + rect.width  / 2;
      const centerY = rect.top  + rect.height / 2;
      const dx = (e.clientX - centerX) / (rect.width  / 2);
      const dy = (e.clientY - centerY) / (rect.height / 2);

      const tiltX =  dy * 6; // degrees
      const tiltY = -dx * 6;

      card.style.transform    = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;
      card.style.transition   = 'transform 0.1s ease';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform  = '';
      card.style.transition = 'transform 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease, background 0.4s ease';
    });
  });
})();


/* ─── Navbar active link style injection ─── */
(function injectActiveStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .nav-link.active {
      color: var(--text-primary);
      background: rgba(124,58,237,0.1);
    }
    .nav-link.active::after {
      transform: translateX(-50%) scaleX(1);
    }
  `;
  document.head.appendChild(style);
})();


/* ─── Particle count text counter animation ─── */
(function initCounterAnimation() {
  function animateCounter(el, target, suffix, duration) {
    let start = 0;
    const step = target / (duration / 16);
    const update = () => {
      start = Math.min(start + step, target);
      el.textContent = Math.floor(start) + suffix;
      if (start < target) requestAnimationFrame(update);
    };
    update();
  }

  const statNums = document.querySelectorAll('.stat-card-num');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const text = el.textContent.trim();
        const match = text.match(/(\d+)(\+?)/);
        if (match) {
          const num    = parseInt(match[1]);
          const suffix = match[2] || '';
          animateCounter(el, num, suffix, 1200);
          // Re-apply gradient after animation resets textContent
          el.style.background = 'linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)';
          el.style.webkitBackgroundClip = 'text';
          el.style.webkitTextFillColor  = 'transparent';
          el.style.backgroundClip = 'text';
        }
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statNums.forEach(el => observer.observe(el));
})();


/* ─── Timeline dot pulse on scroll ─── */
(function initTimelineDots() {
  const dots = document.querySelectorAll('.timeline-dot');

  const style = document.createElement('style');
  style.textContent = `
    @keyframes dotPulse {
      0%, 100% { box-shadow: 0 0 16px rgba(124,58,237,0.5); }
      50% { box-shadow: 0 0 28px rgba(124,58,237,0.9), 0 0 48px rgba(124,58,237,0.3); }
    }
    .timeline-dot.in-view { animation: dotPulse 2s ease infinite; }
  `;
  document.head.appendChild(style);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      entry.target.classList.toggle('in-view', entry.isIntersecting);
    });
  }, { threshold: 0.5 });

  dots.forEach(dot => observer.observe(dot));
})();


/* ─── Hero section parallax on scroll ─── */
(function initHeroParallax() {
  const heroContent = document.querySelector('.hero-content');
  if (!heroContent) return;

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const rate     = scrolled * 0.3;
    if (scrolled < window.innerHeight) {
      heroContent.style.transform = `translateY(${rate}px)`;
      heroContent.style.opacity   = 1 - scrolled / (window.innerHeight * 0.8);
    }
  }, { passive: true });
})();


/* ─── Glow trail on cursor (desktop only) ─── */
(function initCursorGlow() {
  if ('ontouchstart' in window || window.innerWidth < 768) return;

  const glow = document.createElement('div');
  glow.id = 'cursorGlow';
  const style = document.createElement('style');
  style.textContent = `
    #cursorGlow {
      position: fixed;
      pointer-events: none;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%);
      transform: translate(-50%, -50%);
      z-index: 9998;
      transition: opacity 0.3s ease;
      will-change: transform;
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(glow);

  let gx = 0, gy = 0, tx = 0, ty = 0;
  let rafId;

  document.addEventListener('mousemove', (e) => {
    tx = e.clientX;
    ty = e.clientY;
  });

  function updateGlow() {
    gx += (tx - gx) * 0.1;
    gy += (ty - gy) * 0.1;
    glow.style.left = gx + 'px';
    glow.style.top  = gy + 'px';
    rafId = requestAnimationFrame(updateGlow);
  }
  updateGlow();
})();


/* ─── Section background subtle grid decoration ─── */
(function injectSectionDecors() {
  const style = document.createElement('style');
  style.textContent = `
    /* Subtle grid lines on hero */
    .hero::after {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(124,58,237,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(124,58,237,0.03) 1px, transparent 1px);
      background-size: 60px 60px;
      pointer-events: none;
      z-index: 1;
    }

    /* Floating orb decorations */
    .skills-section::after,
    .experience-section::after {
      content: '';
      position: absolute;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%);
      bottom: -100px;
      left: -100px;
      pointer-events: none;
    }

    /* Avatar floating animation */
    .avatar-core {
      animation: float 6s ease-in-out infinite;
    }

    /* Section number watermark */
    .section::before {
      display: none; /* placeholder for individual overrides */
    }
  `;
  document.head.appendChild(style);
})();


/* ─── Preloader ─── */
(function initPreloader() {
  // Create and inject preloader
  const preloader = document.createElement('div');
  preloader.id = 'preloader';

  const style = document.createElement('style');
  style.textContent = `
    #preloader {
      position: fixed;
      inset: 0;
      background: #0a0a0f;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 24px;
      transition: opacity 0.6s ease, visibility 0.6s ease;
    }
    #preloader.hidden {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }
    .preloader-logo {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 3rem;
      font-weight: 800;
      background: linear-gradient(135deg, #a855f7, #06b6d4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: preloaderPulse 1s ease infinite;
    }
    .preloader-bar-track {
      width: 200px;
      height: 2px;
      background: rgba(255,255,255,0.06);
      border-radius: 2px;
      overflow: hidden;
    }
    .preloader-bar-fill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #7c3aed, #06b6d4);
      border-radius: 2px;
      animation: preloaderLoad 1.4s ease forwards;
    }
    @keyframes preloaderPulse {
      0%, 100% { filter: drop-shadow(0 0 20px rgba(124,58,237,0.5)); }
      50% { filter: drop-shadow(0 0 40px rgba(6,182,212,0.8)); }
    }
    @keyframes preloaderLoad {
      0% { width: 0%; }
      60% { width: 70%; }
      100% { width: 100%; }
    }
  `;
  document.head.appendChild(style);

  preloader.innerHTML = `
    <div class="preloader-logo">DS</div>
    <div class="preloader-bar-track">
      <div class="preloader-bar-fill"></div>
    </div>
  `;
  document.body.insertBefore(preloader, document.body.firstChild);

  // Hide after load
  function hidePreloader() {
    setTimeout(() => {
      preloader.classList.add('hidden');
      setTimeout(() => preloader.remove(), 700);
    }, 1400);
  }

  if (document.readyState === 'complete') {
    hidePreloader();
  } else {
    window.addEventListener('load', hidePreloader);
  }
})();


/* ─── Console easter egg ─── */
(function() {
  const styles = [
    'color: #a855f7; font-size: 18px; font-weight: bold;',
    'color: #06b6d4; font-size: 13px;',
    'color: #94a3b8; font-size: 12px;',
  ];
  console.log('%c👩‍💻 Deepika Sherawat Portfolio', styles[0]);
  console.log('%cAI Developer | Data Scientist', styles[1]);
  console.log('%cdsherawat54@gmail.com | Gurgaon, Haryana', styles[2]);
  console.log('%cBuilt with Three.js + Vanilla JS', styles[2]);
})();
