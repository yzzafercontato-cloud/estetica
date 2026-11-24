import * as THREE from 'three';

/* ==========================================================================
   ESTÉTICA MARISTA — CHOREOGRAPHED MOTION, 3D SCROLL & INTERACTIONS
   ========================================================================== */

gsap.registerPlugin(ScrollTrigger);

let lenis = null;

/**
 * 1. TELA DE CARREGAMENTO (PRELOADER) + REVEAL INICIAL DA HERO
 */
function initPreloader(onRevealHero) {
  const preloader = document.getElementById('preloader');
  const bar = document.getElementById('preloader-bar');
  const percentEl = document.getElementById('preloader-percent');
  const curtains = document.querySelectorAll('.preloader__curtain');
  const content = document.querySelector('.preloader__content');

  if (!preloader) {
    onRevealHero();
    return;
  }

  document.body.style.overflow = 'hidden';

  let progress = 0;
  let pageReady = false;

  const markReady = () => {
    pageReady = true;
  };

  if (document.readyState === 'complete') {
    setTimeout(markReady, 450);
  } else {
    window.addEventListener('load', () => setTimeout(markReady, 350), { once: true });
    setTimeout(markReady, 1800);
  }

  const counter = { val: 0 };
  const tick = () => {
    const target = pageReady ? 100 : 88;
    progress += (target - progress) * (pageReady ? 0.14 : 0.05);

    if (pageReady && progress > 99.2) {
      progress = 100;
    }

    counter.val = Math.round(progress);
    if (bar) bar.style.width = `${counter.val}%`;
    if (percentEl) percentEl.textContent = `${counter.val}%`;

    if (progress < 100) {
      requestAnimationFrame(tick);
    } else {
      const tl = gsap.timeline({
        onComplete: () => {
          preloader.classList.add('is-done');
          preloader.style.display = 'none';
          document.body.style.overflow = '';
          ScrollTrigger.refresh();
          onRevealHero();
        }
      });

      tl.to(content, {
        opacity: 0,
        scale: 0.94,
        duration: 0.45,
        ease: 'power2.in'
      })
        .to(
          curtains[0],
          {
            yPercent: -102,
            duration: 0.95,
            ease: 'power4.inOut'
          },
          '-=0.12'
        )
        .to(
          curtains[1],
          {
            yPercent: 102,
            duration: 0.95,
            ease: 'power4.inOut'
          },
          '<'
        );
    }
  };

  requestAnimationFrame(tick);
}

/**
 * 2. SPLIT DE TEXTOS EM PALAVRAS E CARACTERES (ANTI-FOUC)
 */
function prepareSplitTexts() {
  const headings = document.querySelectorAll('.split-display');
  headings.forEach((heading) => {
    const text = heading.textContent.trim().replace(/\s+/g, ' ');
    heading.textContent = '';

    const words = text.split(' ');
    words.forEach((word, wIndex) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'word';

      Array.from(word).forEach((char) => {
        const charSpan = document.createElement('span');
        charSpan.className = 'char';
        charSpan.textContent = char;
        wordSpan.appendChild(charSpan);
      });

      heading.appendChild(wordSpan);
      if (wIndex < words.length - 1) {
        heading.appendChild(document.createTextNode(' '));
      }
    });

    heading.classList.add('vr-prepared');
  });

  document.documentElement.classList.remove('vr-starting');
}

/**
 * 3. ANIMAÇÕES DE ENTRADA DA HERO
 */
function playHeroEntrance() {
  const heroChars = document.querySelectorAll('#hero .split-display .char');
  const heroStaggers = document.querySelectorAll('.hero-stagger');

  gsap.fromTo(
    heroChars,
    { y: 42, opacity: 0, rotateX: -35 },
    {
      y: 0,
      opacity: 1,
      rotateX: 0,
      stagger: 0.015,
      duration: 0.95,
      ease: 'power3.out'
    }
  );

  gsap.fromTo(
    heroStaggers,
    { y: 28, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      stagger: 0.14,
      duration: 0.9,
      delay: 0.18,
      ease: 'power3.out'
    }
  );
}

/**
 * 4. LENIS SMOOTH SCROLL + SINCRONIA COM GSAP SCROLLTRIGGER
 */
function initSmoothScroll() {
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  // Ancoragem suave para links internos
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const el = document.querySelector(targetId);
      if (!el) return;
      e.preventDefault();

      if (lenis) {
        lenis.scrollTo(el, { offset: -40 });
      } else {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/**
 * 5. BARRA DE SCROLL + INDICADOR LATERAL + HEADER MORPHING
 */
function initScrollUI() {
  const topFill = document.getElementById('scroll-progress-fill');
  const railFill = document.getElementById('scroll-rail-fill');
  const railPercent = document.getElementById('scroll-rail-percent');
  const header = document.getElementById('site-header');
  const dots = Array.from(document.querySelectorAll('.scroll-rail__dot'));
  const sections = dots
    .map((dot) => document.querySelector(dot.getAttribute('href')))
    .filter(Boolean);

  const updateScrollProgress = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight =
      document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const pct = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;

    if (topFill) topFill.style.width = `${pct.toFixed(2)}%`;
    if (railFill) railFill.style.height = `${pct.toFixed(2)}%`;
    if (railPercent) {
      railPercent.textContent = `${String(Math.round(pct)).padStart(2, '0')}%`;
    }

    if (header) {
      header.classList.toggle('is-scrolled', scrollTop > 85);
    }

    // Ativa o ponto da seção visível
    const mid = scrollTop + window.innerHeight * 0.42;
    let activeIndex = 0;
    sections.forEach((sec, idx) => {
      if (sec.offsetTop <= mid) {
        activeIndex = idx;
      }
    });

    dots.forEach((dot, idx) => {
      dot.classList.toggle('is-active', idx === activeIndex);
    });
  };

  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  updateScrollProgress();
}

/**
 * 6. 52 TIRAS 3D VENETIAN BLINDS NA TRANSIÇÃO DA HERO
 */
function initVenetianBlinds() {
  const container = document.getElementById('hero-blinds');
  if (!container) return;

  const stripCount = 52;
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < stripCount; i++) {
    const strip = document.createElement('div');
    strip.className = 'blind-strip-v';
    fragment.appendChild(strip);
  }
  container.appendChild(fragment);

  const strips = container.querySelectorAll('.blind-strip-v');

  gsap.fromTo(
    container,
    { opacity: 0 },
    {
      opacity: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: '15% top',
        scrub: true
      }
    }
  );

  gsap.fromTo(
    strips,
    { rotateY: -90 },
    {
      rotateY: 0,
      ease: 'none',
      stagger: {
        each: 0.012,
        from: 'start'
      },
      scrollTrigger: {
        trigger: '#hero',
        start: '2% top',
        end: 'bottom top',
        scrub: 0.85
      }
    }
  );
}

/**
 * 7. ARCO DINÂMICO (.radius-section) + REVELAÇÕES DE TEXTO & IMAGENS
 */
function initEditorialMotion() {
  const radiusSection = document.querySelector('.radius-section');
  if (radiusSection) {
    gsap.fromTo(
      radiusSection,
      { '--arch-radius': '960px' },
      {
        '--arch-radius': '110px',
        ease: 'none',
        scrollTrigger: {
          trigger: radiusSection,
          start: 'top bottom',
          end: 'top 25%',
          scrub: 0.9
        }
      }
    );
  }

  // Split chars para todas as seções abaixo da Hero
  document.querySelectorAll('.split-display').forEach((heading) => {
    if (heading.closest('#hero')) return;
    const chars = heading.querySelectorAll('.char');
    gsap.fromTo(
      chars,
      { y: 34, opacity: 0, rotateX: -30 },
      {
        y: 0,
        opacity: 1,
        rotateX: 0,
        stagger: 0.014,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: heading,
          start: 'top 84%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  });

  // Reveal suave de blocos de texto e cards
  document.querySelectorAll('.reveal-up').forEach((el) => {
    gsap.fromTo(
      el,
      { y: 36, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 86%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  });

  document.querySelectorAll('.reveal-scale').forEach((el) => {
    gsap.fromTo(
      el,
      { scale: 0.72, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.8,
        ease: 'back.out(1.6)',
        scrollTrigger: {
          trigger: el,
          start: 'top 86%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  });

  // Image scale reveal (.general-reveal-img img)
  document.querySelectorAll('.general-reveal-img img').forEach((img) => {
    gsap.fromTo(
      img,
      { scale: 1.2 },
      {
        scale: 1,
        duration: 1.3,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: img.parentElement,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  });

  // Barra de progresso conectando os 3 passos
  const stepsFill = document.getElementById('steps-line-fill');
  if (stepsFill) {
    gsap.to(stepsFill, {
      width: '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: '.steps-timeline',
        start: 'top 78%',
        end: 'bottom 65%',
        scrub: 0.7
      }
    });
  }

  // Aceleração sutil do marquee pela velocidade do scroll
  const marqueeTrack = document.querySelector('.kinetic-marquee__track');
  if (marqueeTrack) {
    ScrollTrigger.create({
      trigger: '.kinetic-marquee',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const velocityBoost = Math.min(2.4, Math.abs(self.getVelocity()) / 900);
        gsap.to(marqueeTrack, {
          timeScale: 1 + velocityBoost,
          duration: 0.4,
          overwrite: true
        });
      }
    });
  }
}

/**
 * 8. SEÇÕES PINNED (MISSÃO + DEPOIMENTOS FLUTUANTES ESTILO VENETIANSPA.CA)
 */
function initPinnedStages() {
  const mm = gsap.matchMedia();

  mm.add('(min-width: 900px)', () => {
    // Palco 1: Missão com 4 arcos fotográficos subindo nas laterais
    const missionContainer = document.querySelector('.home-scroll-container');
    if (missionContainer) {
      const missionTl = gsap.timeline({
        scrollTrigger: {
          trigger: '.home-scroll-container',
          start: 'top top',
          end: '+=2400',
          pin: '.pinned-stage',
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });

      missionTl
        .fromTo('.pinned-watermark', { x: -70, y: 20 }, { x: 140, y: -40, ease: 'none' }, 0)
        .fromTo('.move-up-img--1', { y: '105vh', rotate: -4 }, { y: '-115vh', rotate: 3, ease: 'none' }, 0)
        .fromTo('.move-up-img--2', { y: '130vh', rotate: 4 }, { y: '-105vh', rotate: -3, ease: 'none' }, 0.05)
        .fromTo('.move-up-img--3', { y: '155vh', rotate: -3 }, { y: '-95vh', rotate: 4, ease: 'none' }, 0.12)
        .fromTo('.move-up-img--4', { y: '180vh', rotate: 5 }, { y: '-90vh', rotate: -2, ease: 'none' }, 0.18);
    }

    // Palco 2: Depoimentos em 4 arcos flutuantes nas laterais
    const testiContainer = document.querySelector('.testimonial-container');
    if (testiContainer) {
      const testiTl = gsap.timeline({
        scrollTrigger: {
          trigger: '.testimonial-container',
          start: 'top top',
          end: '+=2400',
          pin: '.testimonial-stage',
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });

      testiTl
        .fromTo('.testimonial-watermark', { x: -60 }, { x: 180, ease: 'none' }, 0)
        .fromTo('.testimonial-card--1', { y: '105vh', rotate: -3 }, { y: '-110vh', rotate: 2, ease: 'none' }, 0)
        .fromTo('.testimonial-card--2', { y: '128vh', rotate: 3 }, { y: '-105vh', rotate: -2, ease: 'none' }, 0.06)
        .fromTo('.testimonial-card--3', { y: '152vh', rotate: -2 }, { y: '-95vh', rotate: 3, ease: 'none' }, 0.14)
        .fromTo('.testimonial-card--4', { y: '175vh', rotate: 3 }, { y: '-88vh', rotate: -3, ease: 'none' }, 0.2);
    }
  });

  // Mobile (< 900px): animação limpa sem sobrepor textos
  mm.add('(max-width: 899px)', () => {
    gsap.utils.toArray('.move-up-img, .testimonial-card').forEach((card) => {
      gsap.fromTo(
        card,
        { y: 36, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.75,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 88%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 180);
  });
}

/**
 * 9. ELEMENTOS 3D ESTÉTICOS QUE MUDAM DE POSIÇÃO E ROTAÇÃO COM O SCROLL (THREE.JS)
 */
function initThreeAestheticScene() {
  const canvas = document.getElementById('aesthetic-3d-canvas');
  if (!canvas) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
  } catch (err) {
    console.warn('WebGL indisponível:', err);
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 8.5);

  // Iluminação quente de estúdio de estética
  const ambientLight = new THREE.AmbientLight(0xfff4e8, 1.3);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffe6cc, 2.6);
  keyLight.position.set(5, 6, 7);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xc8a882, 2.2);
  rimLight.position.set(-6, -3, 4);
  scene.add(rimLight);

  const warmPoint = new THREE.PointLight(0xd8a878, 2.4, 18);
  warmPoint.position.set(2, 1.5, 4);
  scene.add(warmPoint);

  // Grupo principal que muda de posição e rotação conforme o scroll
  const sculptureGroup = new THREE.Group();
  scene.add(sculptureGroup);

  // Materiais luxo: vidro champagne translúcido, ouro rosado, pérola e bronze espresso
  const glassDropMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4e3cf,
    metalness: 0.08,
    roughness: 0.12,
    transmission: 0.65,
    thickness: 1.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    iridescence: 0.85,
    iridescenceIOR: 1.35,
    transparent: true,
    opacity: 0.92
  });

  const champagneGoldMat = new THREE.MeshStandardMaterial({
    color: 0xd4b28c,
    metalness: 0.88,
    roughness: 0.22
  });

  const espressoBronzeMat = new THREE.MeshStandardMaterial({
    color: 0x6b3220,
    metalness: 0.62,
    roughness: 0.28
  });

  const pearlMat = new THREE.MeshPhysicalMaterial({
    color: 0xfff8f1,
    metalness: 0.1,
    roughness: 0.18,
    clearcoat: 1.0,
    iridescence: 0.6
  });

  // 1) Gota / Frasco escultural de sérum estético (LatheGeometry)
  const dropPoints = [
    new THREE.Vector2(0.0, -1.05),
    new THREE.Vector2(0.45, -0.95),
    new THREE.Vector2(0.78, -0.5),
    new THREE.Vector2(0.82, 0.02),
    new THREE.Vector2(0.55, 0.56),
    new THREE.Vector2(0.24, 0.95),
    new THREE.Vector2(0.18, 1.12),
    new THREE.Vector2(0.0, 1.15)
  ];
  const serumGeo = new THREE.LatheGeometry(dropPoints, 48);
  const serumDrop = new THREE.Mesh(serumGeo, glassDropMat);
  sculptureGroup.add(serumDrop);

  // Colar metálico dourado no topo da gota (efeito frasco de essência)
  const collarGeo = new THREE.CylinderGeometry(0.24, 0.27, 0.22, 36);
  const collar = new THREE.Mesh(collarGeo, champagneGoldMat);
  collar.position.y = 0.98;
  sculptureGroup.add(collar);

  // Pérola luminosa no interior da gota
  const corePearl = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 32), pearlMat);
  corePearl.position.y = -0.18;
  sculptureGroup.add(corePearl);

  // 2) Anéis halótipos esculturais (remetendo ao anel luminoso do logo da clínica)
  const outerHaloGeo = new THREE.TorusGeometry(1.48, 0.028, 20, 90);
  const outerHalo = new THREE.Mesh(outerHaloGeo, champagneGoldMat);
  outerHalo.rotation.x = Math.PI * 0.36;
  outerHalo.rotation.y = Math.PI * 0.14;
  sculptureGroup.add(outerHalo);

  const innerHaloGeo = new THREE.TorusGeometry(1.18, 0.018, 16, 80);
  const innerHalo = new THREE.Mesh(innerHaloGeo, espressoBronzeMat);
  innerHalo.rotation.x = -Math.PI * 0.3;
  innerHalo.rotation.z = Math.PI * 0.22;
  sculptureGroup.add(innerHalo);

  // 3) Gotículas / pérolas orbitais (simbolizando hidratação e renovação celular)
  const orbitSpheres = [];
  const spherePositions = [
    { pos: [1.55, 0.72, 0.35], r: 0.16, mat: pearlMat },
    { pos: [-1.45, -0.55, 0.45], r: 0.12, mat: champagneGoldMat },
    { pos: [1.15, -0.98, -0.4], r: 0.1, mat: espressoBronzeMat },
    { pos: [-1.1, 1.05, -0.25], r: 0.14, mat: pearlMat }
  ];
  spherePositions.forEach((cfg) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(cfg.r, 24, 24), cfg.mat);
    mesh.position.set(...cfg.pos);
    mesh.userData.basePos = new THREE.Vector3(...cfg.pos);
    sculptureGroup.add(mesh);
    orbitSpheres.push(mesh);
  });

  // 4) Partículas cristalinas sutis
  const particleCount = 120;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 14;
    particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
  }
  const particlesGeo = new THREE.BufferGeometry();
  particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particlesMat = new THREE.PointsMaterial({
    color: 0xd9b892,
    size: 0.045,
    transparent: true,
    opacity: 0.55
  });
  const particles = new THREE.Points(particlesGeo, particlesMat);
  scene.add(particles);

  // Posição inicial na Hero (fora do texto em desktop e canto inferior direito no mobile)
  const isMobile = () => window.innerWidth < 900;
  const getScrollTargets = () => {
    const mobile = isMobile();
    return {
      initX: mobile ? 1.05 : 3.25,
      initY: mobile ? -1.85 : 0.1,
      initScale: mobile ? 0.44 : 0.96,
      s1: { x: mobile ? -0.95 : -3.15, y: mobile ? -1.75 : 0.25, z: -0.6, rotY: Math.PI * 0.95, rotX: 0.35, scale: mobile ? 0.4 : 0.86 },
      s2: { x: mobile ? 0.95 : 3.15, y: mobile ? -1.9 : -0.35, z: -0.9, rotY: Math.PI * 1.9, rotX: -0.25, rotZ: 0.22, scale: mobile ? 0.38 : 0.8 },
      s3: { x: mobile ? -0.9 : -3.0, y: mobile ? -1.75 : 0.35, z: -0.4, rotY: Math.PI * 2.8, rotX: 0.22, rotZ: -0.18, scale: mobile ? 0.4 : 0.88 },
      s4: { x: mobile ? 0.95 : 3.1, y: mobile ? -1.8 : 0.9, z: -1.6, rotY: Math.PI * 3.7, rotX: 0.45, scale: mobile ? 0.36 : 0.72 },
      s5: { x: mobile ? -0.9 : 3.05, y: mobile ? -1.8 : -0.2, z: -0.3, rotY: Math.PI * 4.6, rotX: -0.15, rotZ: 0.14, scale: mobile ? 0.4 : 0.88 },
      s6: { x: mobile ? 0.9 : -3.05, y: mobile ? -1.75 : 0.15, z: -0.8, rotY: Math.PI * 5.4, rotX: 0.28, scale: mobile ? 0.38 : 0.78 },
      s7: { x: mobile ? 0.95 : 3.0, y: mobile ? -1.85 : -0.15, z: -0.4, rotY: Math.PI * 6.2, rotX: 0.12, scale: mobile ? 0.4 : 0.84 }
    };
  };

  let targets = getScrollTargets();
  sculptureGroup.position.set(targets.initX, targets.initY, 0);
  sculptureGroup.scale.setScalar(targets.initScale);

  // Coreografia 3D ao longo de todo o scroll da página
  const scrollState = {
    x: targets.initX,
    y: targets.initY,
    z: 0,
    rotY: 0.2,
    rotX: 0.1,
    rotZ: 0,
    scale: targets.initScale
  };

  const buildScrollTimeline = () => {
    targets = getScrollTargets();
    const scrollTl = gsap.timeline({
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2,
        invalidateOnRefresh: true
      }
    });

    scrollTl
      .to(scrollState, { ...targets.s1, duration: 1 })
      .to(scrollState, { ...targets.s2, duration: 1 })
      .to(scrollState, { ...targets.s3, duration: 1 })
      .to(scrollState, { ...targets.s4, duration: 1 })
      .to(scrollState, { ...targets.s5, duration: 1 })
      .to(scrollState, { ...targets.s6, duration: 1 })
      .to(scrollState, { ...targets.s7, duration: 1 });
  };
  buildScrollTimeline();

  // Parallax suave do ponteiro do mouse
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.tx = (e.clientX / window.innerWidth - 0.5) * 0.55;
    pointer.ty = (e.clientY / window.innerHeight - 0.5) * 0.45;
  });

  const clock = new THREE.Clock();
  const animate = () => {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;

    sculptureGroup.position.x = scrollState.x + pointer.x * 0.45;
    sculptureGroup.position.y = scrollState.y + Math.sin(t * 1.1) * 0.14 - pointer.y * 0.35;
    sculptureGroup.position.z = scrollState.z;

    sculptureGroup.rotation.y = scrollState.rotY + t * 0.18 + pointer.x * 0.25;
    sculptureGroup.rotation.x = scrollState.rotX + Math.sin(t * 0.7) * 0.08 + pointer.y * 0.2;
    sculptureGroup.rotation.z = scrollState.rotZ;
    sculptureGroup.scale.setScalar(scrollState.scale);

    outerHalo.rotation.z = t * 0.25;
    innerHalo.rotation.y = -t * 0.32;

    orbitSpheres.forEach((s, idx) => {
      const base = s.userData.basePos;
      s.position.y = base.y + Math.sin(t * 1.3 + idx * 1.5) * 0.14;
      s.position.x = base.x + Math.cos(t * 0.9 + idx) * 0.08;
    });

    particles.rotation.y = t * 0.03;
    particles.rotation.x = Math.sin(t * 0.15) * 0.05;

    renderer.render(scene, camera);
  };
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

/**
 * 10. SWIPER DE TRATAMENTOS (VENETIAN RIGHT-BLEEDING CAROUSEL)
 */
function initTreatmentsCarousel() {
  if (typeof Swiper === 'undefined') return;

  new Swiper('.home-carousel', {
    slidesPerView: 1.15,
    spaceBetween: 20,
    speed: 900,
    grabCursor: true,
    navigation: {
      nextEl: '.carousel-arrow--next',
      prevEl: '.carousel-arrow--prev'
    },
    breakpoints: {
      640: {
        slidesPerView: 1.85,
        spaceBetween: 22
      },
      960: {
        slidesPerView: 2.65,
        spaceBetween: 23
      },
      1280: {
        slidesPerView: 3.25,
        spaceBetween: 24
      }
    }
  });
}

/**
 * 11. INTERAÇÕES: CURSOR, TILT 3D, BOTÕES MAGNÉTICOS, FAQ, MODAL & FORM
 */
function initInteractions() {
  // Custom Cursor
  const cursor = document.getElementById('custom-cursor');
  const cursorLabel = cursor?.querySelector('.custom-cursor__label');
  if (cursor && window.matchMedia('(pointer: fine)').matches) {
    let cx = 0;
    let cy = 0;
    let tx = 0;
    let ty = 0;

    window.addEventListener('pointermove', (e) => {
      tx = e.clientX;
      ty = e.clientY;
      cursor.classList.add('is-visible');
    });

    const loopCursor = () => {
      cx += (tx - cx) * 0.2;
      cy += (ty - cy) * 0.2;
      cursor.style.left = `${cx}px`;
      cursor.style.top = `${cy}px`;
      requestAnimationFrame(loopCursor);
    };
    requestAnimationFrame(loopCursor);

    document.querySelectorAll('[data-cursor]').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        if (cursorLabel) cursorLabel.textContent = el.getAttribute('data-cursor') || '';
        cursor.classList.add('is-labeled');
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('is-labeled');
      });
    });
  }

  // Botões magnéticos
  document.querySelectorAll('.magnetic-btn').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.22;
      const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.22;
      gsap.to(btn, { x: dx, y: dy, duration: 0.35, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.45)' });
    });
  });

  // Tilt 3D suave nos cards de pilares e passos
  document.querySelectorAll('.tilt-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(card, {
        rotateY: px * 7,
        rotateX: -py * 7,
        transformPerspective: 900,
        duration: 0.35,
        ease: 'power2.out'
      });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateY: 0,
        rotateX: 0,
        duration: 0.6,
        ease: 'power3.out'
      });
    });
  });

  // Acordeão FAQ
  const faqItems = document.querySelectorAll('.faq-item');
  const syncPanelHeight = (item) => {
    const panel = item.querySelector('.faq-item__panel');
    if (!panel) return;
    panel.style.maxHeight = item.classList.contains('is-open')
      ? `${panel.scrollHeight + 16}px`
      : '0px';
  };

  faqItems.forEach((item) => {
    syncPanelHeight(item);
    const trigger = item.querySelector('.faq-item__trigger');
    trigger?.addEventListener('click', () => {
      const willOpen = !item.classList.contains('is-open');
      faqItems.forEach((other) => {
        other.classList.remove('is-open');
        other.querySelector('.faq-item__trigger')?.setAttribute('aria-expanded', 'false');
        syncPanelHeight(other);
      });
      if (willOpen) {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        syncPanelHeight(item);
      }
    });
  });

  // Modal SAIBA MAIS dos Tratamentos
  const modal = document.getElementById('treatment-modal');
  const modalImg = document.getElementById('modal-img');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const modalDetails = document.getElementById('modal-details');
  const modalClose = document.getElementById('treatment-modal-close');
  const modalCta = document.getElementById('modal-cta');

  const closeModal = () => {
    modal?.classList.remove('is-open');
    modal?.setAttribute('aria-hidden', 'true');
  };

  document.querySelectorAll('.treatment-modal-trigger').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!modal) return;
      modalImg.src = btn.dataset.img || '';
      modalImg.alt = btn.dataset.treatment || '';
      modalTitle.textContent = btn.dataset.treatment || '';
      modalDesc.textContent = btn.dataset.desc || '';
      modalDetails.textContent = btn.dataset.details || '';
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
    });
  });

  modalClose?.addEventListener('click', closeModal);
  modal?.querySelector('.treatment-modal__backdrop')?.addEventListener('click', closeModal);
  modalCta?.addEventListener('click', () => {
    const select = document.querySelector('#evaluation-form select[name="tratamento"]');
    if (select && modalTitle?.textContent) {
      const match = Array.from(select.options).find(
        (opt) => opt.value.toUpperCase() === modalTitle.textContent.toUpperCase()
      );
      if (match) select.value = match.value;
    }
    closeModal();
  });

  // Mobile Menu Drawer
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobileClose = document.getElementById('mobile-menu-close');
  const mobileDrawer = document.getElementById('mobile-drawer');

  const closeDrawer = () => {
    mobileDrawer?.classList.remove('is-open');
    mobileDrawer?.setAttribute('aria-hidden', 'true');
    mobileToggle?.setAttribute('aria-expanded', 'false');
  };

  mobileToggle?.addEventListener('click', () => {
    mobileDrawer?.classList.add('is-open');
    mobileDrawer?.setAttribute('aria-hidden', 'false');
    mobileToggle.setAttribute('aria-expanded', 'true');
  });
  mobileClose?.addEventListener('click', closeDrawer);
  mobileDrawer?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeDrawer);
  });

  // Formulário de pré-agendamento WhatsApp
  const form = document.getElementById('evaluation-form');
  const feedback = document.getElementById('form-feedback');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const nome = String(formData.get('nome') || '').trim();
    const whatsapp = String(formData.get('whatsapp') || '').trim();
    const tratamento = String(formData.get('tratamento') || 'Avaliação Geral');
    const mensagem = String(formData.get('mensagem') || '').trim();

    if (!nome || !whatsapp) {
      if (feedback) {
        feedback.textContent = 'Por favor, informe seu nome e WhatsApp para continuar.';
      }
      return;
    }

    const texto = `Olá! Me chamo ${nome} (${whatsapp}). Gostaria de agendar uma avaliação para ${tratamento}.${mensagem ? ` Observação: ${mensagem}` : ''}`;
    const url = `https://wa.me/5500000000000?text=${encodeURIComponent(texto)}`;
    if (feedback) {
      feedback.textContent = 'Pronto! Abrindo conversa personalizada no WhatsApp da Estética Marista...';
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  });
}

/**
 * INICIALIZAÇÃO GERAL
 */
document.addEventListener('DOMContentLoaded', () => {
  prepareSplitTexts();
  initSmoothScroll();
  initScrollUI();
  initVenetianBlinds();
  initEditorialMotion();
  initPinnedStages();
  initThreeAestheticScene();
  initTreatmentsCarousel();
  initInteractions();

  initPreloader(() => {
    playHeroEntrance();
  });
});
