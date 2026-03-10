import React, { useState, useEffect, useRef, useCallback } from 'react';
import { projects, projectDetails } from './data/projects';
import { experience } from './data/experience';
import { capabilities } from './data/capabilities';
import { visualizations } from './visualizations';

// Build flat index sorted by year descending
const allProjects = projects.map((p, i) => ({
  ...p,
  details: projectDetails[p.id],
  index: String(i + 1).padStart(3, '0'),
}));

// Sort: professional work first (by year desc), then personal (by year desc)
allProjects.sort((a, b) => {
  if (a.type !== b.type) {
    return a.type === 'client' ? -1 : 1;
  }
  const yearA = parseInt(a.details?.year?.split('-')[0] || '2024');
  const yearB = parseInt(b.details?.year?.split('-')[0] || '2024');
  return yearB - yearA;
});

// Re-index after sort
allProjects.forEach((p, i) => {
  p.index = String(i + 1).padStart(3, '0');
});

// ========================
// ACCENT REGISTRATION MARKS — small technical SVG micro-designs
// ========================

const ACCENT = '#c1440e';

function RegMark0() {
  // Crosshair with square
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
      <rect x="3" y="3" width="6" height="6" stroke={ACCENT} strokeWidth="0.75" />
      <line x1="6" y1="0" x2="6" y2="3" stroke={ACCENT} strokeWidth="0.5" />
      <line x1="6" y1="9" x2="6" y2="12" stroke={ACCENT} strokeWidth="0.5" />
      <line x1="0" y1="6" x2="3" y2="6" stroke={ACCENT} strokeWidth="0.5" />
      <line x1="9" y1="6" x2="12" y2="6" stroke={ACCENT} strokeWidth="0.5" />
    </svg>
  );
}

function RegMark1() {
  // Circle with crosshair
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="6" cy="6" r="3.5" stroke={ACCENT} strokeWidth="0.75" />
      <circle cx="6" cy="6" r="0.75" fill={ACCENT} />
      <line x1="6" y1="0" x2="6" y2="2.5" stroke={ACCENT} strokeWidth="0.5" />
      <line x1="6" y1="9.5" x2="6" y2="12" stroke={ACCENT} strokeWidth="0.5" />
      <line x1="0" y1="6" x2="2.5" y2="6" stroke={ACCENT} strokeWidth="0.5" />
      <line x1="9.5" y1="6" x2="12" y2="6" stroke={ACCENT} strokeWidth="0.5" />
    </svg>
  );
}

function RegMark2() {
  // Corner brackets with center dot
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
      <path d="M0 3 L0 0 L3 0" stroke={ACCENT} strokeWidth="0.75" />
      <path d="M9 0 L12 0 L12 3" stroke={ACCENT} strokeWidth="0.75" />
      <path d="M12 9 L12 12 L9 12" stroke={ACCENT} strokeWidth="0.75" />
      <path d="M3 12 L0 12 L0 9" stroke={ACCENT} strokeWidth="0.75" />
      <circle cx="6" cy="6" r="1" fill={ACCENT} />
    </svg>
  );
}

const REG_MARKS = [RegMark0, RegMark1, RegMark2];

function AccentMark({ index = 0 }) {
  const Mark = REG_MARKS[index % REG_MARKS.length];
  return <Mark />;
}

// Simple fade-in for body content
function FadeIn({ children, as: Tag = 'div', className = '', delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      {children}
    </Tag>
  );
}

// ========================
// SUCTION HEADLINE
// ========================

const HERO_TEXT = 'Designing clear and purposeful digital experiences';

function SuctionHeadline({ scrollRef }) {
  const h1Ref = useRef(null);
  const spansRef = useRef([]);
  const frameRef = useRef(null);

  // Split text into words, each word into letter spans
  const words = HERO_TEXT.split(' ');
  let charIndex = 0;
  const totalChars = HERO_TEXT.replace(/ /g, '').length;

  const wordElements = words.map((word, wi) => {
    const letters = word.split('').map((ch) => {
      const idx = charIndex++;
      return (
        <span
          key={`${wi}-${idx}`}
          ref={(el) => { if (el) spansRef.current[idx] = el; }}
          style={{
            display: 'inline-block',
            willChange: 'transform, opacity',
            transformOrigin: '50% 0%',
          }}
        >
          {ch}
        </span>
      );
    });
    return (
      <span key={wi} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
        {letters}
        {wi < words.length - 1 && <span style={{ display: 'inline-block' }}>&nbsp;</span>}
      </span>
    );
  });

  useEffect(() => {
    const h1 = h1Ref.current;
    const scrollEl = scrollRef.current;
    if (!h1 || !scrollEl) return;
    if (window.innerWidth <= 768) return; // disable on mobile

    function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

    function update() {
      const nav = h1.closest('.left-panel')?.querySelector('.nav');
      if (!nav) return;

      const navBottom = nav.getBoundingClientRect().bottom;
      const heroRect = h1.getBoundingClientRect();
      // Start effect when h1 is still 150px below the nav bottom
      const earlyStart = 150;
      const scrollProgress = clamp((navBottom + earlyStart - heroRect.top) / (heroRect.height + earlyStart), 0, 1.2);

      for (let i = 0; i < spansRef.current.length; i++) {
        const span = spansRef.current[i];
        if (!span) continue;

        const threshold = i / totalChars;
        const localProgress = clamp((scrollProgress - threshold) / 0.12, 0, 1);

        if (localProgress === 0) {
          span.style.transform = '';
          span.style.opacity = '';
          span.style.filter = '';
        } else {
          const eased = localProgress * localProgress; // ease-in curve
          const ty = -eased * 52;
          const sy = 1 - eased * 0.6;
          const blur = eased * 6;
          span.style.transform = `translateY(${ty}px) scaleY(${sy})`;
          span.style.opacity = 1 - eased;
          span.style.filter = `blur(${blur}px)`;
        }
      }

      frameRef.current = requestAnimationFrame(update);
    }

    frameRef.current = requestAnimationFrame(update);

    return () => cancelAnimationFrame(frameRef.current);
  }, [scrollRef, totalChars]);

  return (
    <h1 ref={h1Ref} className="hero-headline">
      {wordElements}
    </h1>
  );
}

// ========================
// DISENGAGE BUTTON — 6 Kojima-inspired icon variants
// ========================

const DISENGAGE_LABELS = ['DISENGAGE', 'DISCONNECT', 'RELEASE', 'COLLAPSE', 'WITHDRAW', 'SEVER'];

function DisengageIcon0() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M16 2 L30 16 L16 30 L2 16 Z" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
      <path d="M16 8 L24 16 L16 24 L8 16 Z" stroke="currentColor" strokeWidth="0.75" />
      <line x1="12" y1="12" x2="20" y2="20" stroke="currentColor" strokeWidth="0.75" />
      <line x1="20" y1="12" x2="12" y2="20" stroke="currentColor" strokeWidth="0.75" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" />
      <line x1="16" y1="0" x2="16" y2="3" stroke="currentColor" strokeWidth="0.5" />
      <line x1="16" y1="29" x2="16" y2="32" stroke="currentColor" strokeWidth="0.5" />
      <line x1="0" y1="16" x2="3" y2="16" stroke="currentColor" strokeWidth="0.5" />
      <line x1="29" y1="16" x2="32" y2="16" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  );
}

function DisengageIcon1() {
  // Concentric circles with crosshair break
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1.5 2" />
      <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="0.75" />
      <circle cx="16" cy="16" r="1" fill="currentColor" />
      <line x1="16" y1="0" x2="16" y2="11" stroke="currentColor" strokeWidth="0.5" />
      <line x1="16" y1="21" x2="16" y2="32" stroke="currentColor" strokeWidth="0.5" />
      <line x1="0" y1="16" x2="11" y2="16" stroke="currentColor" strokeWidth="0.5" />
      <line x1="21" y1="16" x2="32" y2="16" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  );
}

function DisengageIcon2() {
  // Hexagonal tactical marker
  const r = 13;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${16 + r * Math.cos(a)},${16 + r * Math.sin(a)}`;
  }).join(' ');
  const r2 = 7;
  const pts2 = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${16 + r2 * Math.cos(a)},${16 + r2 * Math.sin(a)}`;
  }).join(' ');
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <polygon points={pts} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
      <polygon points={pts2} stroke="currentColor" strokeWidth="0.75" />
      <line x1="12" y1="12" x2="20" y2="20" stroke="currentColor" strokeWidth="0.75" />
      <line x1="20" y1="12" x2="12" y2="20" stroke="currentColor" strokeWidth="0.75" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" />
      <line x1="16" y1="0" x2="16" y2="4" stroke="currentColor" strokeWidth="0.5" />
      <line x1="16" y1="28" x2="16" y2="32" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  );
}

function DisengageIcon3() {
  // Double square / containment breach
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="2" y="2" width="28" height="28" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
      <rect x="8" y="8" width="16" height="16" stroke="currentColor" strokeWidth="0.75" />
      <line x1="8" y1="8" x2="2" y2="2" stroke="currentColor" strokeWidth="0.5" />
      <line x1="24" y1="8" x2="30" y2="2" stroke="currentColor" strokeWidth="0.5" />
      <line x1="8" y1="24" x2="2" y2="30" stroke="currentColor" strokeWidth="0.5" />
      <line x1="24" y1="24" x2="30" y2="30" stroke="currentColor" strokeWidth="0.5" />
      <line x1="12" y1="12" x2="20" y2="20" stroke="currentColor" strokeWidth="0.75" />
      <line x1="20" y1="12" x2="12" y2="20" stroke="currentColor" strokeWidth="0.75" />
      <circle cx="16" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}

function DisengageIcon4() {
  // Triangle warning / eject symbol
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M16 3 L29 28 L3 28 Z" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
      <path d="M16 10 L24 25 L8 25 Z" stroke="currentColor" strokeWidth="0.75" />
      <line x1="16" y1="14" x2="16" y2="20" stroke="currentColor" strokeWidth="1" />
      <circle cx="16" cy="23" r="1" fill="currentColor" />
      <line x1="16" y1="0" x2="16" y2="3" stroke="currentColor" strokeWidth="0.5" />
      <line x1="0" y1="28" x2="3" y2="28" stroke="currentColor" strokeWidth="0.5" />
      <line x1="29" y1="28" x2="32" y2="28" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  );
}

function DisengageIcon5() {
  // Octagonal stop / abort
  const r = 14;
  const pts = Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI / 4) * i - Math.PI / 8;
    return `${16 + r * Math.cos(a)},${16 + r * Math.sin(a)}`;
  }).join(' ');
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <polygon points={pts} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 1.5" />
      <circle cx="16" cy="16" r="7" stroke="currentColor" strokeWidth="0.75" />
      <line x1="11" y1="16" x2="21" y2="16" stroke="currentColor" strokeWidth="1" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" />
      <line x1="16" y1="0" x2="16" y2="3" stroke="currentColor" strokeWidth="0.5" />
      <line x1="16" y1="29" x2="16" y2="32" stroke="currentColor" strokeWidth="0.5" />
      <line x1="0" y1="16" x2="3" y2="16" stroke="currentColor" strokeWidth="0.5" />
      <line x1="29" y1="16" x2="32" y2="16" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  );
}

const DISENGAGE_ICONS = [DisengageIcon0, DisengageIcon1, DisengageIcon2, DisengageIcon3, DisengageIcon4, DisengageIcon5];

function DisengageButton({ onClick, projectId }) {
  const variant = useRef(Math.floor(Math.random() * DISENGAGE_ICONS.length)).current;
  const [idx, setIdx] = useState(variant);

  useEffect(() => {
    setIdx(Math.floor(Math.random() * DISENGAGE_ICONS.length));
  }, [projectId]);

  const Icon = DISENGAGE_ICONS[idx];

  return (
    <button className="project-close" onClick={onClick} aria-label="Close project">
      <Icon />
      <span className="project-close__label">{DISENGAGE_LABELS[idx]}</span>
    </button>
  );
}

// ========================
// FALLING NAME — letters drift down in glitch mode
// ========================

const NAME_TEXT = 'Kevin Boyle';

function FallingName({ active, onAllFallen }) {
  const spansRef = useRef([]);
  const physicsRef = useRef(null);
  const frameRef = useRef(null);
  const startTimeRef = useRef(null);
  const reportedRef = useRef(false);

  useEffect(() => {
    if (!active) {
      startTimeRef.current = null;
      physicsRef.current = null;
      reportedRef.current = false;
      spansRef.current.forEach(span => {
        if (span) { span.style.transform = ''; span.style.opacity = ''; span.style.filter = ''; }
      });
      cancelAnimationFrame(frameRef.current);
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    physicsRef.current = NAME_TEXT.split('').map(() => {
      // Random whip direction — any angle, strong velocity
      const angle = Math.random() * Math.PI * 2;
      const force = 4 + Math.random() * 10;
      return {
        delay: 800 + Math.random() * 2000,
        vx: Math.cos(angle) * force,
        vy: Math.sin(angle) * force,
        rotSpeed: (Math.random() - 0.5) * 8,
        friction: 0.97 + Math.random() * 0.02,
        x: 0, y: 0, rot: 0, falling: false,
        dissolveStart: 0, // timestamp when fling starts
        dissolveDuration: 600 + Math.random() * 800,
        scale: 1,
        blur: 0,
      };
    });

    startTimeRef.current = performance.now();

    function animate(now) {
      const elapsed = now - startTimeRef.current;
      const physics = physicsRef.current;
      if (!physics) return;
      let allGone = true;
      for (let i = 0; i < physics.length; i++) {
        const p = physics[i];
        const span = spansRef.current[i];
        if (!span) continue;
        if (elapsed < p.delay) { allGone = false; continue; }

        if (!p.falling) {
          p.falling = true;
          p.dissolveStart = elapsed;
        }

        // Apply velocity with friction
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.rot += p.rotSpeed;
        p.rotSpeed *= 0.98;

        // Dissolve: scale down, blur out, fade
        const dissolveElapsed = elapsed - p.dissolveStart;
        const dissolveProgress = Math.min(1, dissolveElapsed / p.dissolveDuration);
        const eased = dissolveProgress * dissolveProgress;
        const opacity = Math.max(0, 1 - eased);
        p.scale = 1 + eased * 0.5; // slight grow as it dissolves
        p.blur = eased * 8;

        span.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg) scale(${p.scale})`;
        span.style.opacity = opacity;
        span.style.filter = `blur(${p.blur}px)`;
        if (opacity > 0.01) allGone = false;
      }
      if (allGone && !reportedRef.current) {
        reportedRef.current = true;
        onAllFallen?.();
      }
      frameRef.current = requestAnimationFrame(animate);
    }
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [active]);

  return NAME_TEXT.split('').map((ch, i) => (
    <span
      key={i}
      ref={el => { spansRef.current[i] = el; }}
      style={{ display: 'inline-block', willChange: 'transform, opacity' }}
    >
      {ch === ' ' ? '\u00A0' : ch}
    </span>
  ));
}

// ========================
// GLITCH MELT — nav elements fall as whole blocks after name falls
// ========================

function useGlitchMelt(glitchMode, leftPanelRef) {
  const frameRef = useRef(null);
  const elemsRef = useRef([]);
  const startRef = useRef(null);

  useEffect(() => {
    if (!glitchMode) {
      cancelAnimationFrame(frameRef.current);
      elemsRef.current.forEach(({ el }) => {
        el.style.opacity = '';
        el.style.filter = '';
      });
      elemsRef.current = [];
      startRef.current = null;
      return;
    }

    const panel = leftPanelRef.current;
    if (!panel) return;
    startRef.current = performance.now();

    // Phase 0: project index table dissolves first at 0.3-1s
    const tableEls = panel.querySelectorAll('.project-index, .project-row');
    const phase0 = Array.from(tableEls).map(el => ({
      el,
      delay: 300 + Math.random() * 700,
      duration: 1500 + Math.random() * 1000,
    }));

    // Phase 1: headings + hero headline dissolve at 1-2s
    const headingEls = panel.querySelectorAll('.hero-headline, .about-headline, .section-label, .hero-label__title, .hero-label__years');
    const phase1 = Array.from(headingEls).map(el => ({
      el,
      delay: 1000 + Math.random() * 1000,
      duration: 2000 + Math.random() * 1000,
    }));

    // Phase 2: nav elements dissolve at 1.5-2.5s
    const navEls = panel.querySelectorAll('.nav__info, .nav__links');
    const phase2 = Array.from(navEls).map(el => ({
      el,
      delay: 1500 + Math.random() * 1000,
      duration: 1500 + Math.random() * 500,
    }));

    // Phase 3: remaining body content dissolves at 2-3.5s
    const bodyEls = panel.querySelectorAll('.hero-label, .about-section, .capabilities-section, .experience-section, .left-footer');
    const phase3 = Array.from(bodyEls).map(el => ({
      el,
      delay: 2000 + Math.random() * 1500,
      duration: 1500 + Math.random() * 1000,
    }));

    elemsRef.current = [...phase0, ...phase1, ...phase2, ...phase3];

    function animate(now) {
      const elapsed = now - startRef.current;
      for (const e of elemsRef.current) {
        if (elapsed < e.delay) continue;
        const progress = Math.min(1, (elapsed - e.delay) / e.duration);
        const eased = progress * progress;
        e.el.style.opacity = 1 - eased;
        e.el.style.filter = `blur(${eased * 4}px)`;
      }
      frameRef.current = requestAnimationFrame(animate);
    }

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [glitchMode, leftPanelRef]);
}

// ========================
// GLITCH CENTER NAME — dissolving red name after letters fall off
// ========================

const GLITCH_INTRO = [
  'Kevin Boyle',
  'Designing clear and purposeful digital experiences',
];

const GLITCH_RANDOM = [
  'SIGNAL RETURN PENDING',
  'BRIDGE TOPOLOGY NOMINAL',
  'TEMPORAL DRIFT DETECTED',
  'CARRIER LOST',
  'THRESHOLD EXCEEDED',
  'UMBILICAL SYNC 0.003Hz',
  'FIELD SATURATION CRITICAL',
  'PHANTOM ROUTE ACTIVE',
  'DECAY INDEX: UNKNOWN',
  'STILL HERE',
  'FRAGILE TOPOLOGY',
  'OBSERVER PROTOCOL',
  'RESIDUAL FREQUENCY LOW',
  'RETURN SEQUENCE',
  'DENSITY ANOMALY',
  'NEGATIVE SPACE TERRITORY',
  'MEMBRANE RUPTURE',
];

function GlitchCenterName({ onExit }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const originalRef = useRef(null);
  const noiseRef = useRef(null);
  const dimsRef = useRef({ w: 0, h: 0 });
  const burstRef = useRef({ active: false, start: 0, duration: 0, intensity: 0 });
  const nextBurstRef = useRef(0);
  const phraseRef = useRef(0);
  const nextPhraseRef = useRef(0);
  const transitionRef = useRef({ active: false, start: 0, phase: 'idle' });

  const scaleOptions = [
    { vw: 0.09, max: 120 },  // massive
    { vw: 0.05, max: 72 },   // medium
    { vw: 0.022, max: 32 },  // small
  ];

  function renderText(ctx, text, dpr) {
    const maxW = Math.floor(window.innerWidth * 0.5) - 60;
    const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font').trim() || 'ISO, monospace';
    const scale = scaleOptions[Math.floor(Math.random() * scaleOptions.length)];
    let fontSize = Math.min(window.innerWidth * scale.vw, scale.max);

    // Shrink font until text fits within left panel
    ctx.font = `300 ${fontSize}px ${fontFamily}`;
    while (ctx.measureText(text).width > maxW && fontSize > 12) {
      fontSize -= 1;
      ctx.font = `300 ${fontSize}px ${fontFamily}`;
    }

    const metrics = ctx.measureText(text);
    const w = Math.ceil(metrics.width + 40);
    const h = Math.ceil(fontSize * 1.6);
    const canvas = ctx.canvas;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    dimsRef.current = { w: w * dpr, h: h * dpr };
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    ctx.font = `300 ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = '#c1440e';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(text, w / 2, h / 2);
    originalRef.current = ctx.getImageData(0, 0, w * dpr, h * dpr);
    noiseRef.current = buildNoiseMap(w * dpr);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const dpr = window.devicePixelRatio || 1;

    renderText(ctx, GLITCH_INTRO[0], dpr);
    const now = performance.now();
    nextBurstRef.current = now + 1000 + Math.random() * 3000;
    nextPhraseRef.current = now + 3000 + Math.random() * 4000;

    function animate(now) {
      const burst = burstRef.current;
      const transition = transitionRef.current;

      // Schedule phrase transitions
      if (!transition.active && now >= nextPhraseRef.current) {
        transition.active = true;
        transition.start = now;
        transition.phase = 'out';
      }

      // Handle phrase transition: dissolve out → swap text → dissolve in
      if (transition.active) {
        const elapsed = now - transition.start;
        if (transition.phase === 'out') {
          const progress = Math.min(elapsed / 400, 1);
          const intensity = progress * 0.9;
          pixelSort(ctx, originalRef.current, dimsRef.current.w, dimsRef.current.h, intensity, noiseRef.current);
          canvas.style.opacity = 1 - progress;
          if (progress >= 1) {
            // Swap to next phrase — intro sequence first, then random
            phraseRef.current += 1;
            let nextText;
            if (phraseRef.current < GLITCH_INTRO.length) {
              nextText = GLITCH_INTRO[phraseRef.current];
            } else {
              nextText = GLITCH_RANDOM[Math.floor(Math.random() * GLITCH_RANDOM.length)];
            }
            renderText(ctx, nextText, dpr);
            transition.phase = 'in';
            transition.start = now;
          }
        } else if (transition.phase === 'in') {
          const progress = Math.min(elapsed / 400, 1);
          const intensity = 0.9 * (1 - progress);
          pixelSort(ctx, originalRef.current, dimsRef.current.w, dimsRef.current.h, intensity, noiseRef.current);
          canvas.style.opacity = progress;
          if (progress >= 1) {
            ctx.putImageData(originalRef.current, 0, 0);
            canvas.style.opacity = 1;
            transition.active = false;
            transition.phase = 'idle';
            noiseRef.current = buildNoiseMap(dimsRef.current.w);
            nextPhraseRef.current = now + 3000 + Math.random() * 4000;
          }
        }
      }

      // Pixel sort bursts (only when not transitioning)
      if (!transition.active) {
        if (!burst.active && now >= nextBurstRef.current) {
          burst.active = true;
          burst.start = now;
          burst.duration = 200 + Math.random() * 600;
          burst.intensity = 0.3 + Math.random() * 0.7;
        }

        if (burst.active) {
          const elapsed = now - burst.start;
          const progress = Math.min(elapsed / burst.duration, 1);
          const curve = progress < 0.3
            ? progress / 0.3
            : 1 - (progress - 0.3) / 0.7;
          const intensity = burst.intensity * curve;
          pixelSort(ctx, originalRef.current, dimsRef.current.w, dimsRef.current.h, intensity, noiseRef.current);

          if (progress >= 1) {
            burst.active = false;
            ctx.putImageData(originalRef.current, 0, 0);
            noiseRef.current = buildNoiseMap(dimsRef.current.w);
            nextBurstRef.current = now + 500 + Math.random() * 4000;
          }
        }
      }

      frameRef.current = requestAnimationFrame(animate);
    }
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <div className="glitch-center-name" onClick={onExit} style={{ cursor: 'pointer' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// ========================
// GLITCH OVERLAY — datamosh / pixel sort destruction canvas
// ========================

const BLEND_MODES = ['exclusion', 'multiply', 'difference', 'hard-light', 'luminosity'];

function SpectralPortrait() {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const img = new Image();
    img.src = '/images/kevin-glitch.jpg';
    let startTime = 0;
    const dissolveDuration = 12000; // 12s dissolve

    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      function resize() {
        const vw = Math.floor(window.innerWidth * 0.5);
        const vh = window.innerHeight;
        canvas.width = vw * dpr;
        canvas.height = vh * dpr;
        canvas.style.width = vw + 'px';
        canvas.style.height = vh + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      resize();
      window.addEventListener('resize', resize);
      startTime = performance.now();

      function animate(now) {
        const elapsed = now - startTime;
        const dissolveProgress = Math.min(1, elapsed / dissolveDuration);
        const vw = Math.floor(window.innerWidth * 0.5);
        const vh = window.innerHeight;

        // Draw base image
        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, vw, vh);
        ctx.filter = 'saturate(0) contrast(1.3)';
        ctx.drawImage(img, 0, 0, vw, vh);
        ctx.filter = 'none';

        // Spectral color shift — hue rotation over time
        const hueShift = (elapsed * 0.02) % 360;
        ctx.globalCompositeOperation = 'color';
        ctx.globalAlpha = 0.15 + Math.sin(elapsed * 0.001) * 0.1;
        ctx.fillStyle = `hsl(${hueShift}, 60%, 50%)`;
        ctx.fillRect(0, 0, vw, vh);

        // Second spectral layer at offset hue
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = `hsl(${(hueShift + 180) % 360}, 40%, 40%)`;
        ctx.fillRect(0, 0, vw, vh);
        ctx.globalCompositeOperation = 'source-over';

        // Scanline / interference pattern
        ctx.globalAlpha = 0.06 + dissolveProgress * 0.08;
        for (let sy = 0; sy < vh; sy += 3) {
          if (Math.random() < 0.3 + dissolveProgress * 0.4) {
            ctx.fillStyle = Math.random() < 0.1 ? '#c1440e' : '#000';
            ctx.fillRect(0, sy, vw, 1);
          }
        }

        // Dissolve: increasing noise + fade
        if (dissolveProgress > 0.2) {
          const noiseAlpha = (dissolveProgress - 0.2) * 0.6;
          ctx.globalAlpha = noiseAlpha;
          const blockSize = 4;
          for (let ny = 0; ny < vh; ny += blockSize) {
            for (let nx = 0; nx < vw; nx += blockSize) {
              if (Math.random() < dissolveProgress * 0.7) {
                const v = Math.floor(Math.random() * 30);
                ctx.fillStyle = Math.random() < 0.05
                  ? `rgba(193,68,14,${0.3 + Math.random() * 0.3})`
                  : `rgb(${v},${v},${v})`;
                ctx.fillRect(nx, ny, blockSize, blockSize);
              }
            }
          }
        }

        // Horizontal tear/offset
        if (Math.random() < 0.03 + dissolveProgress * 0.05) {
          const tearY = Math.floor(Math.random() * vh);
          const tearH = 2 + Math.floor(Math.random() * 20);
          const tearOx = Math.floor((Math.random() - 0.5) * 40);
          try {
            const dpr2 = window.devicePixelRatio || 1;
            const tearData = ctx.getImageData(0, tearY * dpr2, vw * dpr2, Math.min(tearH * dpr2, canvas.height - tearY * dpr2));
            ctx.putImageData(tearData, tearOx * dpr2, tearY * dpr2);
          } catch(e) {}
        }

        // Overall fade out
        ctx.globalAlpha = 1;
        const masterOpacity = Math.max(0, 1 - dissolveProgress * dissolveProgress);
        canvas.style.opacity = masterOpacity;

        if (masterOpacity > 0.01) {
          frameRef.current = requestAnimationFrame(animate);
        }
      }

      frameRef.current = requestAnimationFrame(animate);

      return () => {
        window.removeEventListener('resize', resize);
      };
    };

    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 9998,
        mixBlendMode: 'luminosity',
      }}
    />
  );
}

// ========================
// PERIMETER FRAME FX
// ========================
// Canvas overlay on the left panel perimeter (all 4 edges).
// Only active during glitch mode. Mixes micro-animations with
// elements from the main glitch overlay: lissajous, blob tracking
// crosshairs, ASCII fragments, datamosh blocks, radial arcs, slit-scan.

function FrameFX() {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    let W, H;
    const EDGE = 20; // how deep the frame effects reach inward

    function resize() {
      W = Math.floor(window.innerWidth / 2);
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const ACCENT = '#c1440e';
    const MID = '#888';
    const FAINT = '#e0e0e0';
    const DARK = '#1a1a1a';

    // Helper: random point along the perimeter (0-1 maps to full perimeter)
    function perimeterPoint(t) {
      const perim = 2 * W + 2 * H;
      const d = ((t % 1) + 1) % 1 * perim;
      if (d < W) return { x: d, y: 0, edge: 'top' };
      if (d < W + H) return { x: W, y: d - W, edge: 'right' };
      if (d < 2 * W + H) return { x: W - (d - W - H), y: H, edge: 'bottom' };
      return { x: 0, y: H - (d - 2 * W - H), edge: 'left' };
    }

    // --- Scanning particles along perimeter ---
    const particles = Array.from({ length: 18 }, () => ({
      t: Math.random(),
      speed: (0.00005 + Math.random() * 0.00015) * (Math.random() < 0.3 ? -1 : 1),
      size: 1 + Math.random() * 2.5,
      accent: Math.random() < 0.25,
      wobble: Math.random() * Math.PI * 2,
      wobbleFreq: 1 + Math.random() * 3,
    }));

    // --- Pulse sweeps along edges ---
    const pulses = [];
    let nextPulse = 800 + Math.random() * 2000;

    // --- Glitch pips on edges ---
    const pips = [];
    let nextPip = 400 + Math.random() * 1500;

    // --- Lissajous figures anchored to edge ---
    const lissajous = [];
    let nextLiss = 2000 + Math.random() * 4000;

    // --- ASCII fragments along frame ---
    const asciiFrags = [];
    let nextAscii = 1500 + Math.random() * 3000;
    const asciiWords = ['FAULT', 'ERR', 'NULL', 'VOID', 'DECAY', '////', '0x00', 'NaN', 'SYNC', 'LEAK', 'SIGNAL', 'DRIFT'];

    // --- Blob tracking crosshairs ---
    const crosshairs = [];
    let nextCross = 3000 + Math.random() * 5000;

    // --- Datamosh block displacements ---
    const blocks = [];
    let nextBlock = 2000 + Math.random() * 4000;

    // --- Signal burst on a random edge ---
    let burstTimer = 4000 + Math.random() * 8000;
    let burstEdge = null;
    let burstLife = 0;

    // --- Radial arc pulses from corners ---
    const arcs = [];
    let nextArc = 3000 + Math.random() * 6000;

    let lastTime = 0;

    function animate(time) {
      const dt = lastTime ? time - lastTime : 16;
      lastTime = time;
      ctx.clearRect(0, 0, W, H);

      // --- FRAME OUTLINE: faint perimeter ---
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = FAINT;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
      ctx.restore();

      // --- SCANNING PARTICLES along perimeter ---
      particles.forEach(p => {
        p.t += p.speed * dt;
        p.wobble += p.wobbleFreq * dt * 0.001;
        const pt = perimeterPoint(p.t);
        // Wobble inward from edge
        const inward = Math.sin(p.wobble) * 6;
        let dx = 0, dy = 0;
        if (pt.edge === 'top') dy = inward;
        else if (pt.edge === 'bottom') dy = -inward;
        else if (pt.edge === 'left') dx = inward;
        else dx = -inward;
        ctx.globalAlpha = 0.35 + Math.sin(p.wobble * 0.7) * 0.2;
        ctx.fillStyle = p.accent ? ACCENT : MID;
        ctx.fillRect(pt.x + dx - p.size / 2, pt.y + dy - p.size / 2, p.size, p.size);
      });
      ctx.globalAlpha = 1;

      // --- PULSE SWEEPS: bright line traveling along one edge ---
      nextPulse -= dt;
      if (nextPulse <= 0) {
        const edges = ['top', 'right', 'bottom', 'left'];
        pulses.push({
          edge: edges[Math.floor(Math.random() * 4)],
          pos: 0,
          speed: 1.5 + Math.random() * 4,
          accent: Math.random() < 0.3,
          width: 1 + Math.random() * 2,
        });
        nextPulse = 1500 + Math.random() * 4000;
      }
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.pos += p.speed;
        const maxLen = (p.edge === 'top' || p.edge === 'bottom') ? W : H;
        if (p.pos > maxLen + 10) { pulses.splice(i, 1); continue; }
        ctx.globalAlpha = 0.3 + 0.3 * (1 - Math.abs(p.pos - maxLen / 2) / (maxLen / 2));
        ctx.strokeStyle = p.accent ? ACCENT : FAINT;
        ctx.lineWidth = p.width;
        ctx.beginPath();
        if (p.edge === 'top') { ctx.moveTo(p.pos, 0); ctx.lineTo(p.pos, EDGE); }
        else if (p.edge === 'bottom') { ctx.moveTo(p.pos, H); ctx.lineTo(p.pos, H - EDGE); }
        else if (p.edge === 'left') { ctx.moveTo(0, p.pos); ctx.lineTo(EDGE, p.pos); }
        else { ctx.moveTo(W, p.pos); ctx.lineTo(W - EDGE, p.pos); }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // --- GLITCH PIPS: displacement marks on edges ---
      nextPip -= dt;
      if (nextPip <= 0) {
        const count = 2 + Math.floor(Math.random() * 5);
        const edge = ['top', 'right', 'bottom', 'left'][Math.floor(Math.random() * 4)];
        for (let j = 0; j < count; j++) {
          const pos = Math.random() * ((edge === 'top' || edge === 'bottom') ? W : H);
          pips.push({ edge, pos, life: 300 + Math.random() * 700, maxLife: 300 + Math.random() * 700, len: 4 + Math.random() * 12, accent: Math.random() < 0.2 });
        }
        nextPip = 800 + Math.random() * 3000;
      }
      for (let i = pips.length - 1; i >= 0; i--) {
        const p = pips[i];
        p.life -= dt;
        if (p.life <= 0) { pips.splice(i, 1); continue; }
        const fade = p.life / p.maxLife;
        ctx.globalAlpha = fade * 0.6;
        ctx.strokeStyle = p.accent ? ACCENT : DARK;
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (p.edge === 'top') { ctx.moveTo(p.pos, 0); ctx.lineTo(p.pos + p.len, 0); }
        else if (p.edge === 'bottom') { ctx.moveTo(p.pos, H); ctx.lineTo(p.pos + p.len, H); }
        else if (p.edge === 'left') { ctx.moveTo(0, p.pos); ctx.lineTo(0, p.pos + p.len); }
        else { ctx.moveTo(W, p.pos); ctx.lineTo(W, p.pos + p.len); }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // --- LISSAJOUS FIGURES anchored to edge points ---
      nextLiss -= dt;
      if (nextLiss <= 0) {
        const pt = perimeterPoint(Math.random());
        lissajous.push({
          x: pt.x, y: pt.y,
          a: 1 + Math.floor(Math.random() * 5),
          b: 1 + Math.floor(Math.random() * 5),
          phase: Math.random() * Math.PI * 2,
          rx: 8 + Math.random() * 25,
          ry: 8 + Math.random() * 25,
          life: 1500 + Math.random() * 3000,
          maxLife: 1500 + Math.random() * 3000,
          accent: Math.random() < 0.2,
        });
        nextLiss = 3000 + Math.random() * 6000;
      }
      for (let i = lissajous.length - 1; i >= 0; i--) {
        const l = lissajous[i];
        l.life -= dt;
        if (l.life <= 0) { lissajous.splice(i, 1); continue; }
        const fade = Math.min(1, l.life / l.maxLife, (l.maxLife - l.life) / 500);
        ctx.globalAlpha = fade * 0.35;
        ctx.strokeStyle = l.accent ? ACCENT : MID;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        for (let s = 0; s <= 150; s++) {
          const t = (s / 150) * Math.PI * 2;
          const lx = l.x + Math.sin(l.a * t + l.phase) * l.rx;
          const ly = l.y + Math.sin(l.b * t) * l.ry;
          s === 0 ? ctx.moveTo(lx, ly) : ctx.lineTo(lx, ly);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // --- ASCII FRAGMENTS along frame ---
      nextAscii -= dt;
      if (nextAscii <= 0) {
        const pt = perimeterPoint(Math.random());
        asciiFrags.push({
          x: pt.x, y: pt.y, edge: pt.edge,
          text: asciiWords[Math.floor(Math.random() * asciiWords.length)],
          life: 800 + Math.random() * 2000,
          maxLife: 800 + Math.random() * 2000,
          size: 6 + Math.floor(Math.random() * 6),
          accent: Math.random() < 0.3,
          rot: (Math.random() - 0.5) * 0.4,
        });
        nextAscii = 1000 + Math.random() * 3000;
      }
      for (let i = asciiFrags.length - 1; i >= 0; i--) {
        const a = asciiFrags[i];
        a.life -= dt;
        if (a.life <= 0) { asciiFrags.splice(i, 1); continue; }
        const fade = Math.min(1, a.life / a.maxLife, (a.maxLife - a.life) / 300);
        ctx.save();
        ctx.globalAlpha = fade * 0.5;
        ctx.font = `bold ${a.size}px monospace`;
        ctx.fillStyle = a.accent ? ACCENT : DARK;
        ctx.translate(a.x, a.y);
        ctx.rotate(a.rot);
        ctx.fillText(a.text, 0, 0);
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // --- BLOB TRACKING CROSSHAIRS on edges ---
      nextCross -= dt;
      if (nextCross <= 0) {
        const pt = perimeterPoint(Math.random());
        crosshairs.push({
          x: pt.x, y: pt.y,
          size: 6 + Math.random() * 14,
          life: 1200 + Math.random() * 2500,
          maxLife: 1200 + Math.random() * 2500,
          accent: Math.random() < 0.3,
          pulsePhase: Math.random() * Math.PI * 2,
        });
        nextCross = 2000 + Math.random() * 5000;
      }
      for (let i = crosshairs.length - 1; i >= 0; i--) {
        const c = crosshairs[i];
        c.life -= dt;
        c.pulsePhase += dt * 0.005;
        if (c.life <= 0) { crosshairs.splice(i, 1); continue; }
        const fade = Math.min(1, c.life / c.maxLife, (c.maxLife - c.life) / 400);
        const pulse = 1 + Math.sin(c.pulsePhase) * 0.2;
        const s = c.size * pulse;
        ctx.globalAlpha = fade * 0.4;
        ctx.strokeStyle = c.accent ? ACCENT : MID;
        ctx.lineWidth = 0.8;
        // Crosshair lines
        ctx.beginPath();
        ctx.moveTo(c.x - s, c.y); ctx.lineTo(c.x + s, c.y);
        ctx.moveTo(c.x, c.y - s); ctx.lineTo(c.x, c.y + s);
        ctx.stroke();
        // Circle
        ctx.beginPath();
        ctx.arc(c.x, c.y, s * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        // Corner brackets
        ctx.globalAlpha = fade * 0.25;
        const b = s * 1.2;
        ctx.beginPath();
        ctx.moveTo(c.x - b, c.y - b + 3); ctx.lineTo(c.x - b, c.y - b); ctx.lineTo(c.x - b + 3, c.y - b);
        ctx.moveTo(c.x + b, c.y - b + 3); ctx.lineTo(c.x + b, c.y - b); ctx.lineTo(c.x + b - 3, c.y - b);
        ctx.moveTo(c.x - b, c.y + b - 3); ctx.lineTo(c.x - b, c.y + b); ctx.lineTo(c.x - b + 3, c.y + b);
        ctx.moveTo(c.x + b, c.y + b - 3); ctx.lineTo(c.x + b, c.y + b); ctx.lineTo(c.x + b - 3, c.y + b);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // --- DATAMOSH BLOCKS: displaced rectangles near edges ---
      nextBlock -= dt;
      if (nextBlock <= 0) {
        const edge = ['top', 'right', 'bottom', 'left'][Math.floor(Math.random() * 4)];
        const bw = 10 + Math.random() * 40;
        const bh = 4 + Math.random() * 15;
        let bx, by;
        if (edge === 'top') { bx = Math.random() * (W - bw); by = Math.random() * EDGE; }
        else if (edge === 'bottom') { bx = Math.random() * (W - bw); by = H - EDGE + Math.random() * EDGE - bh; }
        else if (edge === 'left') { bx = Math.random() * EDGE; by = Math.random() * (H - bh); }
        else { bx = W - EDGE + Math.random() * EDGE - bw; by = Math.random() * (H - bh); }
        blocks.push({
          x: bx, y: by, w: bw, h: bh,
          ox: (Math.random() - 0.5) * 15, oy: (Math.random() - 0.5) * 8,
          life: 200 + Math.random() * 600,
          maxLife: 200 + Math.random() * 600,
          accent: Math.random() < 0.15,
        });
        nextBlock = 1500 + Math.random() * 3500;
      }
      for (let i = blocks.length - 1; i >= 0; i--) {
        const b = blocks[i];
        b.life -= dt;
        if (b.life <= 0) { blocks.splice(i, 1); continue; }
        const fade = b.life / b.maxLife;
        ctx.globalAlpha = fade * 0.3;
        ctx.fillStyle = b.accent ? ACCENT : DARK;
        ctx.fillRect(b.x + b.ox, b.y + b.oy, b.w, b.h);
        // Ghost outline at original position
        ctx.globalAlpha = fade * 0.15;
        ctx.strokeStyle = MID;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
      }
      ctx.globalAlpha = 1;

      // --- SIGNAL BURST on a random edge segment ---
      burstTimer -= dt;
      if (burstTimer <= 0 && burstLife <= 0) {
        burstEdge = ['top', 'right', 'bottom', 'left'][Math.floor(Math.random() * 4)];
        burstLife = 150 + Math.random() * 250;
        burstTimer = 5000 + Math.random() * 10000;
      }
      if (burstLife > 0) {
        burstLife -= dt;
        const intensity = Math.max(0, burstLife / 250);
        ctx.globalAlpha = intensity * 0.5;
        ctx.strokeStyle = ACCENT;
        ctx.lineWidth = 2 + intensity * 2;
        ctx.beginPath();
        if (burstEdge === 'top') { ctx.moveTo(0, 0); ctx.lineTo(W, 0); }
        else if (burstEdge === 'bottom') { ctx.moveTo(0, H); ctx.lineTo(W, H); }
        else if (burstEdge === 'left') { ctx.moveTo(0, 0); ctx.lineTo(0, H); }
        else { ctx.moveTo(W, 0); ctx.lineTo(W, H); }
        ctx.stroke();
        // Sparks
        const numSparks = Math.floor(intensity * 10);
        for (let s = 0; s < numSparks; s++) {
          let sx, sy;
          if (burstEdge === 'top') { sx = Math.random() * W; sy = Math.random() * EDGE; }
          else if (burstEdge === 'bottom') { sx = Math.random() * W; sy = H - Math.random() * EDGE; }
          else if (burstEdge === 'left') { sx = Math.random() * EDGE; sy = Math.random() * H; }
          else { sx = W - Math.random() * EDGE; sy = Math.random() * H; }
          ctx.globalAlpha = intensity * (0.3 + Math.random() * 0.4);
          ctx.fillStyle = Math.random() < 0.5 ? ACCENT : '#fff';
          ctx.fillRect(sx, sy, 1 + Math.random() * 2, 1);
        }
        ctx.globalAlpha = 1;
      }

      // --- RADIAL ARCS from corners ---
      nextArc -= dt;
      if (nextArc <= 0) {
        const corners = [[0, 0], [W, 0], [0, H], [W, H]];
        const c = corners[Math.floor(Math.random() * 4)];
        arcs.push({
          x: c[0], y: c[1],
          radius: 0,
          maxRadius: 30 + Math.random() * 60,
          speed: 0.03 + Math.random() * 0.06,
          life: 1000 + Math.random() * 2000,
          maxLife: 1000 + Math.random() * 2000,
          accent: Math.random() < 0.3,
          rings: 2 + Math.floor(Math.random() * 4),
        });
        nextArc = 4000 + Math.random() * 8000;
      }
      for (let i = arcs.length - 1; i >= 0; i--) {
        const a = arcs[i];
        a.life -= dt;
        a.radius += a.speed * dt;
        if (a.life <= 0) { arcs.splice(i, 1); continue; }
        const fade = Math.min(1, a.life / a.maxLife, (a.maxLife - a.life) / 400);
        ctx.globalAlpha = fade * 0.25;
        ctx.strokeStyle = a.accent ? ACCENT : MID;
        ctx.lineWidth = 0.6;
        for (let r = 0; r < a.rings; r++) {
          const rad = a.radius - r * 10;
          if (rad > 0) {
            ctx.beginPath();
            ctx.arc(a.x, a.y, rad, 0, Math.PI * 0.5);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      frameRef.current = requestAnimationFrame(animate);
    }

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '50%',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 10000,
      }}
    />
  );
}

function GlitchOverlay() {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const [blendMode, setBlendMode] = useState('exclusion');
  const blendRef = useRef('exclusion');

  useEffect(() => {
    const pickBlend = () => {
      const mode = BLEND_MODES[Math.floor(Math.random() * BLEND_MODES.length)];
      blendRef.current = mode;
      setBlendMode(mode);
    };
    const scheduleNext = () => {
      const delay = 3000 + Math.random() * 8000;
      return setTimeout(() => { pickBlend(); blendTimer = scheduleNext(); }, delay);
    };
    let blendTimer = scheduleNext();
    return () => clearTimeout(blendTimer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // ---- AUDIO: evolving drone + IDM glitch engine ----
    let alive = true;
    // Reuse existing AudioContext if available (survives HMR / StrictMode remounts)
    // Creating too many contexts hits Chrome's limit and breaks audio
    let audioCtx;
    if (window.__glitchAudioCtx && window.__glitchAudioCtx.state !== 'closed') {
      audioCtx = window.__glitchAudioCtx;
    } else {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      window.__glitchAudioCtx = audioCtx;
    }
    // Resume suspended AudioContext (Chrome autoplay policy)
    const tryResume = () => {
      if (audioCtx.state === 'suspended') audioCtx.resume();
    };
    tryResume();
    const resumeInterval = setInterval(tryResume, 500);
    const unlockAudio = () => {
      audioCtx.resume();
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('mousemove', unlockAudio);
      document.removeEventListener('scroll', unlockAudio);
      clearInterval(resumeInterval);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    document.addEventListener('mousemove', unlockAudio);
    document.addEventListener('scroll', unlockAudio);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    const freqData = new Uint8Array(analyser.frequencyBinCount);

    const master = audioCtx.createGain();
    master.gain.value = 0.14;
    master.connect(analyser);
    analyser.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    // === EVOLVING DRONE ===

    // Master distortion — warm saturation on everything
    const masterDist = audioCtx.createWaveShaper();
    const masterDistCurve = new Float32Array(512);
    for (let i = 0; i < 512; i++) {
      const x = (i / 256) - 1;
      masterDistCurve[i] = Math.tanh(x * 2.5);
    }
    masterDist.curve = masterDistCurve;
    masterDist.oversample = '4x';
    master.disconnect();
    master.connect(masterDist);
    masterDist.connect(analyser);

    // Layer 1: sub drone — detuned saw pair with slow pitch drift + distortion
    const sub1 = audioCtx.createOscillator();
    sub1.type = 'sawtooth';
    sub1.frequency.value = 42;
    const sub2 = audioCtx.createOscillator();
    sub2.type = 'sawtooth';
    sub2.frequency.value = 42.4;
    const sub3 = audioCtx.createOscillator();
    sub3.type = 'square';
    sub3.frequency.value = 21;
    const subGain = audioCtx.createGain();
    subGain.gain.value = 0.35;
    sub1.connect(subGain);
    sub2.connect(subGain);
    const sub3Gain = audioCtx.createGain();
    sub3Gain.gain.value = 0.15;
    sub3.connect(sub3Gain);
    sub3Gain.connect(subGain);
    // Sub distortion — gritty overtones
    const subDist = audioCtx.createWaveShaper();
    const subDistCurve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      subDistCurve[i] = Math.tanh(x * 4) * 0.9;
    }
    subDist.curve = subDistCurve;
    subDist.oversample = '2x';
    const subFilter = audioCtx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.value = 180;
    subFilter.Q.value = 4;
    subGain.connect(subDist);
    subDist.connect(subFilter);
    subFilter.connect(master);

    // Irrational pitch drift on sub — no periodicity, always unsettled
    const subDrift = audioCtx.createOscillator();
    subDrift.frequency.value = 0.0137; // irrational-ish rate
    const subDriftGain = audioCtx.createGain();
    subDriftGain.gain.value = 5;
    subDrift.connect(subDriftGain);
    subDriftGain.connect(sub1.frequency);
    subDriftGain.connect(sub2.frequency);
    // Second drift at incommensurate rate — creates beating that never repeats
    const subDrift2 = audioCtx.createOscillator();
    subDrift2.frequency.value = 0.0089;
    const subDrift2Gain = audioCtx.createGain();
    subDrift2Gain.gain.value = 7;
    subDrift2.connect(subDrift2Gain);
    subDrift2Gain.connect(sub1.frequency);

    // Sub filter breathing — two LFOs at irrational ratio
    const subFilterLfo = audioCtx.createOscillator();
    subFilterLfo.frequency.value = 0.043;
    const subFilterLfoGain = audioCtx.createGain();
    subFilterLfoGain.gain.value = 150;
    subFilterLfo.connect(subFilterLfoGain);
    subFilterLfoGain.connect(subFilter.frequency);
    const subFilterLfo2 = audioCtx.createOscillator();
    subFilterLfo2.frequency.value = 0.071;
    const subFilterLfo2Gain = audioCtx.createGain();
    subFilterLfo2Gain.gain.value = 80;
    subFilterLfo2.connect(subFilterLfo2Gain);
    subFilterLfo2Gain.connect(subFilter.frequency);

    // Layer 2: eerie dissonant mid — minor 2nd cluster, distorted
    const mid1 = audioCtx.createOscillator();
    mid1.type = 'sawtooth';
    mid1.frequency.value = 185;
    const mid2 = audioCtx.createOscillator();
    mid2.type = 'sawtooth';
    mid2.frequency.value = 196; // minor 2nd
    const mid3Osc = audioCtx.createOscillator();
    mid3Osc.type = 'triangle';
    mid3Osc.frequency.value = 277.18; // minor 6th — eerie interval
    const midGain = audioCtx.createGain();
    midGain.gain.value = 0.1;
    mid1.connect(midGain);
    mid2.connect(midGain);
    const mid3OscGain = audioCtx.createGain();
    mid3OscGain.gain.value = 0.06;
    mid3Osc.connect(mid3OscGain);
    mid3OscGain.connect(midGain);
    const midFilter = audioCtx.createBiquadFilter();
    midFilter.type = 'bandpass';
    midFilter.frequency.value = 600;
    midFilter.Q.value = 5;
    midGain.connect(midFilter);
    midFilter.connect(master);

    // Mid detune drift — multiple irrational LFOs for queasy beating
    const midDrift = audioCtx.createOscillator();
    midDrift.frequency.value = 0.0173;
    const midDriftGain = audioCtx.createGain();
    midDriftGain.gain.value = 12;
    midDrift.connect(midDriftGain);
    midDriftGain.connect(mid2.frequency);
    midDriftGain.connect(mid3Osc.frequency);
    // Cross-modulate mid1 at different rate
    const midDrift2 = audioCtx.createOscillator();
    midDrift2.frequency.value = 0.0113;
    const midDrift2Gain = audioCtx.createGain();
    midDrift2Gain.gain.value = 6;
    midDrift2.connect(midDrift2Gain);
    midDrift2Gain.connect(mid1.frequency);

    // Layer 3: spectral noise — filtered with sweeping resonance
    const noiseLen = audioCtx.sampleRate * 4;
    const noiseBuf = audioCtx.createBuffer(1, noiseLen, audioCtx.sampleRate);
    const noiseData = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) noiseData[i] = Math.random() * 2 - 1;
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.value = 0.25;
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 2000;
    noiseFilter.Q.value = 35;
    // Distort the noise for harsher texture
    const noiseDist = audioCtx.createWaveShaper();
    const noiseDistCurve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      noiseDistCurve[i] = Math.sign(x) * Math.pow(Math.abs(x), 0.4);
    }
    noiseDist.curve = noiseDistCurve;
    noise.connect(noiseGain);
    noiseGain.connect(noiseFilter);
    noiseFilter.connect(noiseDist);
    noiseDist.connect(master);

    // Noise filter sweep — two irrational LFOs for unpredictable movement
    const lfo1 = audioCtx.createOscillator();
    lfo1.frequency.value = 0.0731;
    const lfo1Gain = audioCtx.createGain();
    lfo1Gain.gain.value = 2800;
    lfo1.connect(lfo1Gain);
    lfo1Gain.connect(noiseFilter.frequency);
    const lfo1b = audioCtx.createOscillator();
    lfo1b.frequency.value = 0.0419;
    const lfo1bGain = audioCtx.createGain();
    lfo1bGain.gain.value = 1500;
    lfo1b.connect(lfo1bGain);
    lfo1bGain.connect(noiseFilter.frequency);
    // Also modulate noise Q for screaming sweeps
    const lfo1c = audioCtx.createOscillator();
    lfo1c.frequency.value = 0.0293;
    const lfo1cGain = audioCtx.createGain();
    lfo1cGain.gain.value = 20;
    lfo1c.connect(lfo1cGain);
    lfo1cGain.connect(noiseFilter.Q);

    // Layer 4: high spectral whistle — detuned sine cluster, unsettling
    const hi1 = audioCtx.createOscillator();
    hi1.type = 'sine';
    hi1.frequency.value = 3520;
    const hi2 = audioCtx.createOscillator();
    hi2.type = 'sine';
    hi2.frequency.value = 3729;
    const hi3 = audioCtx.createOscillator();
    hi3.type = 'sine';
    hi3.frequency.value = 4186; // minor 2nd above hi2
    const hiGain = audioCtx.createGain();
    hiGain.gain.value = 0.025;
    hi1.connect(hiGain);
    hi2.connect(hiGain);
    const hi3Gain2 = audioCtx.createGain();
    hi3Gain2.gain.value = 0.5;
    hi3.connect(hi3Gain2);
    hi3Gain2.connect(hiGain);
    hiGain.connect(master);
    // Irrational amplitude swell — appears and disappears unpredictably
    const lfo2 = audioCtx.createOscillator();
    lfo2.frequency.value = 0.0197;
    const lfo2Gain = audioCtx.createGain();
    lfo2Gain.gain.value = 0.025;
    lfo2.connect(lfo2Gain);
    lfo2Gain.connect(hiGain.gain);
    // Pitch drift on hi cluster
    const hiDrift = audioCtx.createOscillator();
    hiDrift.frequency.value = 0.0067;
    const hiDriftGain = audioCtx.createGain();
    hiDriftGain.gain.value = 40;
    hiDrift.connect(hiDriftGain);
    hiDriftGain.connect(hi1.frequency);
    hiDriftGain.connect(hi2.frequency);

    // Layer 5: ring-modulated metallic texture
    const ringCarrier = audioCtx.createOscillator();
    ringCarrier.type = 'sine';
    ringCarrier.frequency.value = 440;
    const ringMod = audioCtx.createOscillator();
    ringMod.type = 'sine';
    ringMod.frequency.value = 337; // inharmonic ratio
    const ringModGain = audioCtx.createGain();
    ringModGain.gain.value = 0;
    ringCarrier.connect(ringModGain);
    ringMod.connect(ringModGain.gain);
    const ringOut = audioCtx.createGain();
    ringOut.gain.value = 0.04;
    ringModGain.connect(ringOut);
    ringOut.connect(master);

    // Slow swell of ring mod — fades in and out over long cycles
    const ringLfo = audioCtx.createOscillator();
    ringLfo.frequency.value = 0.05;
    const ringLfoGain = audioCtx.createGain();
    ringLfoGain.gain.value = 0.05;
    ringLfo.connect(ringLfoGain);
    ringLfoGain.connect(ringOut.gain);

    // Layer 6: arrhythmic stutter gate — FM'd square for non-periodic cuts
    const gate = audioCtx.createOscillator();
    gate.type = 'square';
    gate.frequency.value = 4.3;
    const gateGain = audioCtx.createGain();
    gateGain.gain.value = 0.07;
    gate.connect(gateGain);
    gateGain.connect(master.gain);

    // Gate rate modulated by two incommensurate LFOs — never settles into a grid
    const gateDrift = audioCtx.createOscillator();
    gateDrift.frequency.value = 0.0317;
    const gateDriftGain = audioCtx.createGain();
    gateDriftGain.gain.value = 4;
    gateDrift.connect(gateDriftGain);
    gateDriftGain.connect(gate.frequency);
    const gateDrift2 = audioCtx.createOscillator();
    gateDrift2.frequency.value = 0.0523;
    const gateDrift2Gain = audioCtx.createGain();
    gateDrift2Gain.gain.value = 2.5;
    gateDrift2.connect(gateDrift2Gain);
    gateDrift2Gain.connect(gate.frequency);

    // === IDM GLITCH ENGINE ===

    const glitchGain = audioCtx.createGain();
    glitchGain.gain.value = 0.55;
    const glitchDist = audioCtx.createWaveShaper();
    const distCurve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      distCurve[i] = Math.tanh(x * 6); // hard saturation
    }
    glitchDist.curve = distCurve;
    glitchDist.oversample = '4x';
    // Second stage — bitcrusher-style fold
    const glitchDist2 = audioCtx.createWaveShaper();
    const distCurve2 = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      distCurve2[i] = Math.sin(x * Math.PI * 1.5) * 0.8;
    }
    glitchDist2.curve = distCurve2;
    glitchGain.connect(glitchDist);
    glitchDist.connect(glitchDist2);
    glitchDist2.connect(master);

    function makeGlitchBuffer(type) {
      const sr = audioCtx.sampleRate;
      let len, buf, data;

      if (type === 'pop') {
        len = Math.floor(sr * 0.012);
        buf = audioCtx.createBuffer(1, len, sr);
        data = buf.getChannelData(0);
        const p = Math.random() > 0.5 ? 1 : -1;
        data[0] = p; data[1] = p; data[2] = p * 0.95;
        for (let i = 3; i < len; i++) data[i] = p * Math.exp(-i / (len * 0.08)) * (Math.random() * 0.3 + 0.7);
      } else if (type === 'crackle') {
        len = Math.floor(sr * (0.04 + Math.random() * 0.12));
        buf = audioCtx.createBuffer(1, len, sr);
        data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() < 0.3 ? (Math.random() > 0.5 ? 1 : -1) : 0;
      } else if (type === 'bitcrush') {
        len = Math.floor(sr * (0.06 + Math.random() * 0.2));
        buf = audioCtx.createBuffer(1, len, sr);
        data = buf.getChannelData(0);
        const steps = Math.pow(2, 1 + Math.floor(Math.random() * 2));
        const holdLen = 8 + Math.floor(Math.random() * 24);
        let held = 0;
        for (let i = 0; i < len; i++) {
          if (i % holdLen === 0) held = Math.round((Math.random() * 2 - 1) * steps) / steps;
          data[i] = held * 0.9;
        }
      } else if (type === 'dropout') {
        len = Math.floor(sr * (0.08 + Math.random() * 0.25));
        buf = audioCtx.createBuffer(1, len, sr);
        data = buf.getChannelData(0);
        const silenceEnd = Math.floor(len * (0.3 + Math.random() * 0.4));
        for (let i = 0; i < silenceEnd; i++) data[i] = 0;
        const freq = 60 + Math.random() * 300;
        for (let i = silenceEnd; i < len; i++) data[i] = (Math.sin(2 * Math.PI * freq * i / sr) > 0 ? 0.9 : -0.9);
      } else if (type === 'screech') {
        len = Math.floor(sr * (0.03 + Math.random() * 0.08));
        buf = audioCtx.createBuffer(1, len, sr);
        data = buf.getChannelData(0);
        const baseF = 400 + Math.random() * 2000, modF = 50 + Math.random() * 500, modD = 2000 + Math.random() * 8000;
        let ph = 0, mph = 0;
        for (let i = 0; i < len; i++) { const t = i / len; mph += (2 * Math.PI * modF) / sr; ph += (2 * Math.PI * (baseF + Math.sin(mph) * modD)) / sr; data[i] = Math.sin(ph) * (1 - t * 0.5) * 0.8; }
      } else if (type === 'stutter') {
        len = Math.floor(sr * (0.1 + Math.random() * 0.3));
        buf = audioCtx.createBuffer(1, len, sr);
        data = buf.getChannelData(0);
        const gl = Math.floor(sr * (0.003 + Math.random() * 0.015));
        const grain = new Float32Array(gl);
        for (let i = 0; i < gl; i++) grain[i] = (Math.random() * 2 - 1) * 0.8;
        for (let i = 0; i < len; i++) data[i] = grain[i % gl];
      } else if (type === 'nuke') {
        len = Math.floor(sr * (0.01 + Math.random() * 0.04));
        buf = audioCtx.createBuffer(1, len, sr);
        data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1);
      } else if (type === 'metallic') {
        // Ring-modulated sine burst — inharmonic bell/clang
        len = Math.floor(sr * (0.05 + Math.random() * 0.15));
        buf = audioCtx.createBuffer(1, len, sr);
        data = buf.getChannelData(0);
        const f1 = 200 + Math.random() * 2000;
        const f2 = f1 * (1.1 + Math.random() * 0.9); // inharmonic
        for (let i = 0; i < len; i++) {
          const t = i / len;
          data[i] = Math.sin(2 * Math.PI * f1 * i / sr) * Math.sin(2 * Math.PI * f2 * i / sr) * Math.exp(-t * 4) * 0.8;
        }
      } else if (type === 'granular') {
        // Granular cloud — overlapping micro-grains with pitch scatter
        len = Math.floor(sr * (0.15 + Math.random() * 0.4));
        buf = audioCtx.createBuffer(1, len, sr);
        data = buf.getChannelData(0);
        const numGrains = 8 + Math.floor(Math.random() * 20);
        for (let g = 0; g < numGrains; g++) {
          const gStart = Math.floor(Math.random() * len * 0.8);
          const gLen = Math.floor(sr * (0.002 + Math.random() * 0.02));
          const gFreq = 100 + Math.random() * 4000;
          for (let i = 0; i < gLen && gStart + i < len; i++) {
            const env = Math.sin(Math.PI * i / gLen); // hanning
            data[gStart + i] += Math.sin(2 * Math.PI * gFreq * i / sr) * env * 0.3;
          }
        }
      } else if (type === 'feedback') {
        // Simulated feedback squeal — rising pitch into saturation
        len = Math.floor(sr * (0.08 + Math.random() * 0.2));
        buf = audioCtx.createBuffer(1, len, sr);
        data = buf.getChannelData(0);
        const startF = 800 + Math.random() * 2000;
        const endF = startF * (2 + Math.random() * 4);
        let ph = 0;
        for (let i = 0; i < len; i++) {
          const t = i / len;
          const f = startF * Math.pow(endF / startF, t);
          ph += (2 * Math.PI * f) / sr;
          const raw = Math.sin(ph) * (0.3 + t * 0.7);
          data[i] = Math.tanh(raw * 3) * 0.7; // soft saturate
        }
      } else if (type === 'machineGun') {
        // Rapid rhythmic pulse train — like a broken sequencer
        len = Math.floor(sr * (0.2 + Math.random() * 0.4));
        buf = audioCtx.createBuffer(1, len, sr);
        data = buf.getChannelData(0);
        const pulseRate = Math.floor(sr * (0.01 + Math.random() * 0.03));
        const pulseLen = Math.floor(pulseRate * (0.2 + Math.random() * 0.5));
        const pFreq = 80 + Math.random() * 600;
        for (let i = 0; i < len; i++) {
          const pos = i % pulseRate;
          if (pos < pulseLen) {
            data[i] = Math.sin(2 * Math.PI * pFreq * i / sr) * 0.7;
          }
        }
      }

      return buf;
    }

    // Weighted toward stutter/noise — duplicates increase selection probability
    const glitchTypes = ['pop', 'crackle', 'crackle', 'bitcrush', 'bitcrush', 'dropout', 'screech', 'stutter', 'stutter', 'stutter', 'nuke', 'nuke', 'metallic', 'granular', 'feedback', 'machineGun'];
    const glitchBuffers = {};
    glitchTypes.forEach(type => {
      glitchBuffers[type] = [];
      for (let i = 0; i < 6; i++) glitchBuffers[type].push(makeGlitchBuffer(type));
    });

    // Schedule IDM glitch events
    let glitchTimer;
    function scheduleGlitch() {
      const type = glitchTypes[Math.floor(Math.random() * glitchTypes.length)];
      const variants = glitchBuffers[type];
      const buffer = variants[Math.floor(Math.random() * variants.length)];

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      if (Math.random() < 0.5) source.playbackRate.value = 0.25 + Math.random() * 3;

      // Occasionally reverse playback
      if (Math.random() < 0.15) source.playbackRate.value = -(0.5 + Math.random() * 2);

      source.connect(glitchGain);
      source.start();

      const roll = Math.random();
      let nextDelay;
      if (roll < 0.35) nextDelay = 15 + Math.random() * 60;
      else if (roll < 0.6) nextDelay = 80 + Math.random() * 250;
      else if (roll < 0.85) nextDelay = 300 + Math.random() * 800;
      else nextDelay = 1000 + Math.random() * 2000; // occasional longer breath
      if (alive) glitchTimer = setTimeout(scheduleGlitch, nextDelay);
    }
    if (alive) glitchTimer = setTimeout(scheduleGlitch, 300);

    // === STUTTER BURSTS — rapid-fire micro-loops ===
    const stutterGain = audioCtx.createGain();
    stutterGain.gain.value = 0.6;
    const stutterDist = audioCtx.createWaveShaper();
    const stutterDistCurve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      stutterDistCurve[i] = Math.tanh(x * 5);
    }
    stutterDist.curve = stutterDistCurve;
    stutterGain.connect(stutterDist);
    stutterDist.connect(master);

    function fireStutterBurst() {
      const t = audioCtx.currentTime;
      const sr = audioCtx.sampleRate;
      // Generate a tiny grain (1-15ms) and repeat it rapidly
      const grainLen = Math.floor(sr * (0.001 + Math.random() * 0.014));
      const grain = audioCtx.createBuffer(1, grainLen, sr);
      const gd = grain.getChannelData(0);
      // Random grain source: noise, sine, or square
      const grainType = Math.random();
      if (grainType < 0.4) {
        // Noise grain
        for (let i = 0; i < grainLen; i++) gd[i] = (Math.random() * 2 - 1) * 0.9;
      } else if (grainType < 0.7) {
        // Sine grain with random freq
        const f = 60 + Math.random() * 800;
        for (let i = 0; i < grainLen; i++) gd[i] = Math.sin(2 * Math.PI * f * i / sr) * 0.9;
      } else {
        // Square pulse grain
        const f = 40 + Math.random() * 400;
        for (let i = 0; i < grainLen; i++) gd[i] = (Math.sin(2 * Math.PI * f * i / sr) > 0 ? 0.9 : -0.9);
      }

      // Fire a burst of 4-20 rapid repetitions
      const reps = 4 + Math.floor(Math.random() * 16);
      const gap = 0.005 + Math.random() * 0.04; // 5-45ms between reps
      for (let r = 0; r < reps; r++) {
        const src = audioCtx.createBufferSource();
        src.buffer = grain;
        // Pitch variation across burst
        src.playbackRate.value = 0.5 + Math.random() * 2.5;
        const env = audioCtx.createGain();
        // Accent the first and random hits
        env.gain.setValueAtTime(r === 0 || Math.random() < 0.3 ? 1.0 : 0.4 + Math.random() * 0.4, t + r * gap);
        env.gain.linearRampToValueAtTime(0, t + r * gap + grainLen / sr + 0.01);
        src.connect(env);
        env.connect(stutterGain);
        src.start(t + r * gap);
      }

      // Schedule next burst — sometimes rapid clusters, sometimes long pauses
      const roll = Math.random();
      let nextDelay;
      if (roll < 0.25) nextDelay = 100 + Math.random() * 300; // rapid double burst
      else if (roll < 0.5) nextDelay = 400 + Math.random() * 1200;
      else if (roll < 0.75) nextDelay = 1500 + Math.random() * 3000;
      else nextDelay = 3000 + Math.random() * 6000;
      if (alive) setTimeout(fireStutterBurst, nextDelay);
    }
    if (alive) setTimeout(fireStutterBurst, 500 + Math.random() * 2000);

    // === WHITE NOISE BLASTS — harsh filtered bursts ===
    const blastGain = audioCtx.createGain();
    blastGain.gain.value = 0.5;
    const blastFilter = audioCtx.createBiquadFilter();
    blastFilter.type = 'highpass';
    blastFilter.frequency.value = 800;
    blastFilter.Q.value = 2;
    const blastDist = audioCtx.createWaveShaper();
    const blastDistCurve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      blastDistCurve[i] = Math.sign(x) * Math.pow(Math.abs(x), 0.3); // harsh
    }
    blastDist.curve = blastDistCurve;
    blastGain.connect(blastFilter);
    blastFilter.connect(blastDist);
    blastDist.connect(master);

    function fireNoiseBlast() {
      const t = audioCtx.currentTime;
      const sr = audioCtx.sampleRate;
      // Duration: 30ms to 500ms
      const dur = 0.03 + Math.random() * 0.47;
      const len = Math.floor(sr * dur);
      const buf = audioCtx.createBuffer(1, len, sr);
      const data = buf.getChannelData(0);

      const blastType = Math.random();
      if (blastType < 0.35) {
        // Pure white noise blast
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1);
      } else if (blastType < 0.6) {
        // Gated noise — staccato chops
        const gateLen = Math.floor(sr * (0.008 + Math.random() * 0.02));
        for (let i = 0; i < len; i++) {
          data[i] = (i % (gateLen * 2) < gateLen) ? (Math.random() * 2 - 1) : 0;
        }
      } else if (blastType < 0.8) {
        // Noise with descending filter sweep (baked in)
        for (let i = 0; i < len; i++) {
          const pos = i / len;
          const cutoff = 1 - pos * 0.8; // descending brightness
          const raw = Math.random() * 2 - 1;
          // Simple 1-pole lowpass approximation
          data[i] = i === 0 ? raw * cutoff : data[i - 1] + cutoff * (raw - data[i - 1]);
        }
      } else {
        // Crunch burst — bit-reduced noise
        const bits = 2 + Math.floor(Math.random() * 3);
        const levels = Math.pow(2, bits);
        for (let i = 0; i < len; i++) {
          data[i] = Math.round((Math.random() * 2 - 1) * levels) / levels;
        }
      }

      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = 0.5 + Math.random() * 2;
      const env = audioCtx.createGain();
      // Sharp attack, variable release
      env.gain.setValueAtTime(0.7 + Math.random() * 0.3, t);
      env.gain.linearRampToValueAtTime(0, t + dur);
      src.connect(env);
      env.connect(blastGain);
      src.start(t);

      // Randomly shift the filter for each blast
      blastFilter.frequency.setValueAtTime(200 + Math.random() * 4000, t);
      blastFilter.Q.setValueAtTime(1 + Math.random() * 10, t);

      // Schedule next
      const roll = Math.random();
      let nextDelay;
      if (roll < 0.2) nextDelay = 50 + Math.random() * 200; // rapid succession
      else if (roll < 0.5) nextDelay = 300 + Math.random() * 1000;
      else if (roll < 0.8) nextDelay = 1000 + Math.random() * 3000;
      else nextDelay = 3000 + Math.random() * 7000;
      if (alive) setTimeout(fireNoiseBlast, nextDelay);
    }
    if (alive) setTimeout(fireNoiseBlast, 800 + Math.random() * 2000);

    // === DISTORTED 808 SUB KICKS ===
    const kickDist = audioCtx.createWaveShaper();
    const kickDistCurve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      kickDistCurve[i] = Math.tanh(x * 8);
    }
    kickDist.curve = kickDistCurve;
    kickDist.oversample = '2x';
    const kickFilter = audioCtx.createBiquadFilter();
    kickFilter.type = 'lowpass';
    kickFilter.frequency.value = 80;
    kickFilter.Q.value = 6;
    const kickGain = audioCtx.createGain();
    kickGain.gain.value = 0.55;
    kickDist.connect(kickFilter);
    kickFilter.connect(kickGain);
    kickGain.connect(master);

    function fire808Kick() {
      const t = audioCtx.currentTime;
      // 808-style: sine with long decay, slower pitch sweep, deep sub tail
      const kickOsc = audioCtx.createOscillator();
      kickOsc.type = 'sine';
      const startPitch = 60 + Math.random() * 30;
      const endPitch = 28 + Math.random() * 12;
      kickOsc.frequency.setValueAtTime(startPitch, t);
      kickOsc.frequency.exponentialRampToValueAtTime(endPitch, t + 0.15);
      // 808 click — sharper, shorter than 909
      const clickLen = Math.floor(audioCtx.sampleRate * 0.002);
      const clickBuf = audioCtx.createBuffer(1, clickLen, audioCtx.sampleRate);
      const clickData = clickBuf.getChannelData(0);
      clickData[0] = 1; clickData[1] = -0.8; clickData[2] = 0.5;
      for (let i = 3; i < clickLen; i++) clickData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (clickLen * 0.1));
      const clickSrc = audioCtx.createBufferSource();
      clickSrc.buffer = clickBuf;
      const clickGain2 = audioCtx.createGain();
      clickGain2.gain.value = 0.4;
      clickSrc.connect(clickGain2);
      clickGain2.connect(kickDist);
      // Long 808 decay envelope
      const kickEnv = audioCtx.createGain();
      kickEnv.gain.setValueAtTime(1.0, t);
      kickEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.8 + Math.random() * 0.6);
      kickOsc.connect(kickEnv);
      kickEnv.connect(kickDist);
      kickOsc.start(t);
      clickSrc.start(t);
      kickOsc.stop(t + 1.5);

      // Schedule next — irregular timing, sometimes rapid doubles
      const roll = Math.random();
      let nextDelay;
      if (roll < 0.15) nextDelay = 80 + Math.random() * 150; // rapid double
      else if (roll < 0.5) nextDelay = 500 + Math.random() * 1500;
      else if (roll < 0.8) nextDelay = 2000 + Math.random() * 4000;
      else nextDelay = 5000 + Math.random() * 8000; // long pause
      if (alive) setTimeout(fire808Kick, nextDelay);
    }
    if (alive) setTimeout(fire808Kick, 2000 + Math.random() * 3000);

    // === DRONE EVOLUTION — arrhythmic, uncomfortable, venetian snares-inspired ===
    // Uncomfortable intervals: minor 2nds, tritones, quarter-tones, 7ths
    const dissonantRatios = [
      1.01, 1.02, 1.04,    // microtonal beating
      1.059, 1.122,         // minor 2nd, major 2nd
      1.414, 1.498,         // tritone, ~flat 5th
      1.587, 1.682,         // minor 6th, quarter-flat 7th
      1.888, 1.944,         // major 7th area
      0.97, 0.943,          // quarter-tone flat
    ];

    function evolveDrone() {
      const t = audioCtx.currentTime;
      // Non-periodic evolution timing — sometimes rapid, sometimes glacial
      const dur = Math.random() < 0.3
        ? 2 + Math.random() * 5    // quick uncomfortable shift
        : 12 + Math.random() * 25; // slow glacial drift

      // Sub — drift into uncomfortable microtonal territory
      const newSub = 28 + Math.random() * 30;
      const subDetune = 0.5 + Math.random() * 2; // wide beating
      sub1.frequency.linearRampToValueAtTime(newSub, t + dur);
      sub2.frequency.linearRampToValueAtTime(newSub + subDetune, t + dur);
      sub3.frequency.linearRampToValueAtTime(newSub * (Math.random() < 0.4 ? 0.5 : dissonantRatios[Math.floor(Math.random() * dissonantRatios.length)]), t + dur);
      // Randomly tighten or blow open the sub filter
      subFilter.frequency.linearRampToValueAtTime(60 + Math.random() * 250, t + dur);
      subFilter.Q.linearRampToValueAtTime(2 + Math.random() * 12, t + dur);

      // Mid — pick uncomfortable interval clusters
      const newMid = 120 + Math.random() * 160;
      const r1 = dissonantRatios[Math.floor(Math.random() * dissonantRatios.length)];
      const r2 = dissonantRatios[Math.floor(Math.random() * dissonantRatios.length)];
      mid1.frequency.linearRampToValueAtTime(newMid, t + dur);
      mid2.frequency.linearRampToValueAtTime(newMid * r1, t + dur);
      mid3Osc.frequency.linearRampToValueAtTime(newMid * r2, t + dur);
      // Randomly shift mid gain — sometimes barely there, sometimes dominant
      midGain.gain.linearRampToValueAtTime(0.03 + Math.random() * 0.12, t + dur);

      // Noise — aggressive filter sweeps
      noiseFilter.frequency.linearRampToValueAtTime(400 + Math.random() * 6000, t + dur);
      noiseFilter.Q.linearRampToValueAtTime(10 + Math.random() * 40, t + dur);
      noiseGain.gain.linearRampToValueAtTime(0.1 + Math.random() * 0.3, t + dur);

      // High — cluster shifts, sometimes very close for painful beating
      const newHi = 2000 + Math.random() * 4000;
      const hiSpread = Math.random() < 0.4 ? 1 + Math.random() * 8 : 50 + Math.random() * 200;
      hi1.frequency.linearRampToValueAtTime(newHi, t + dur);
      hi2.frequency.linearRampToValueAtTime(newHi + hiSpread, t + dur);
      hi3.frequency.linearRampToValueAtTime(newHi * (dissonantRatios[Math.floor(Math.random() * 5)]), t + dur);
      hiGain.gain.linearRampToValueAtTime(Math.random() < 0.3 ? 0.04 : 0.008, t + dur);

      // Ring mod — inharmonic, always wrong
      const ringF = 150 + Math.random() * 800;
      ringCarrier.frequency.linearRampToValueAtTime(ringF, t + dur);
      ringMod.frequency.linearRampToValueAtTime(ringF * dissonantRatios[Math.floor(Math.random() * dissonantRatios.length)], t + dur);
      ringOut.gain.linearRampToValueAtTime(Math.random() * 0.08, t + dur);

      // Gate — drift rate arrhythmically
      gate.frequency.linearRampToValueAtTime(1.5 + Math.random() * 12, t + dur);

      // Non-periodic scheduling
      const nextEvolve = dur * 1000 * (0.6 + Math.random() * 0.8);
      if (alive) setTimeout(evolveDrone, nextEvolve);
    }
    if (alive) setTimeout(evolveDrone, 3000 + Math.random() * 4000);

    // Layer 7: SPECTRAL STEGANOGRAPHY — portrait encoded into frequency domain
    // Loads the portrait, downscales to bitmap, encodes pixel brightness as sine
    // wave amplitudes. The portrait is visible in a spectrogram viewer.
    let stegoSource = null;
    const stegoGain = audioCtx.createGain();
    stegoGain.gain.value = 0.06;
    stegoGain.connect(master);

    const stegoImg = new Image();
    stegoImg.src = '/images/kevin-glitch.jpg';
    stegoImg.onload = () => {
      if (!alive) return;
      const stegoW = 256; // time steps
      const stegoH = 128; // frequency bins
      const stegoDuration = 6;
      const sr = audioCtx.sampleRate;
      const totalSamples = Math.floor(sr * stegoDuration);

      // Downscale portrait to stego dimensions
      const offscreen = document.createElement('canvas');
      offscreen.width = stegoW;
      offscreen.height = stegoH;
      const octx = offscreen.getContext('2d');
      // Flip vertically — low rows = low freq = bottom of spectrogram
      octx.translate(0, stegoH);
      octx.scale(1, -1);
      octx.drawImage(stegoImg, 0, 0, stegoW, stegoH);
      const pixels = octx.getImageData(0, 0, stegoW, stegoH).data;

      // Boost contrast for clearer spectrogram
      for (let i = 0; i < pixels.length; i += 4) {
        const lum = pixels[i] * 0.299 + pixels[i+1] * 0.587 + pixels[i+2] * 0.114;
        const boosted = Math.min(255, Math.max(0, (lum - 60) * 2));
        pixels[i] = pixels[i+1] = pixels[i+2] = boosted;
      }

      const buffer = audioCtx.createBuffer(1, totalSamples, sr);
      const data = buffer.getChannelData(0);

      const fMin = 200;
      const fMax = 10000;
      const samplesPerCol = totalSamples / stegoW;

      // Additive synthesis with phase accumulation
      for (let row = 0; row < stegoH; row++) {
        const t = row / (stegoH - 1);
        const freq = fMin * Math.pow(fMax / fMin, t);
        const phaseInc = (2 * Math.PI * freq) / sr;
        let phase = 0;
        let currentCol = -1;
        let brightness = 0;

        for (let s = 0; s < totalSamples; s++) {
          const col = Math.min(Math.floor(s / samplesPerCol), stegoW - 1);
          if (col !== currentCol) {
            currentCol = col;
            brightness = pixels[(row * stegoW + col) * 4] / 255;
          }
          if (brightness > 0.05) {
            data[s] += brightness * Math.sin(phase);
          }
          phase += phaseInc;
          if (phase > 6.2831853) phase -= 6.2831853;
        }
      }

      // Normalize
      let max = 0;
      for (let s = 0; s < totalSamples; s++) {
        const a = Math.abs(data[s]);
        if (a > max) max = a;
      }
      if (max > 0) {
        for (let s = 0; s < totalSamples; s++) data[s] /= max;
      }

      stegoSource = audioCtx.createBufferSource();
      stegoSource.buffer = buffer;
      stegoSource.loop = true;
      stegoSource.connect(stegoGain);
      stegoSource.start();
    };

    // Start all oscillators (stego starts async when image loads)
    const startTime = audioCtx.currentTime;
    [sub1, sub2, sub3, mid1, mid2, mid3Osc, noise, hi1, hi2, hi3, lfo1, lfo1b, lfo1c, lfo2, gate,
     subDrift, subDrift2, subFilterLfo, subFilterLfo2, midDrift, midDrift2, hiDrift,
     ringCarrier, ringMod, ringLfo, gateDrift, gateDrift2].forEach(n => n.start(startTime));

    // Fade in
    master.gain.setValueAtTime(0, startTime);
    master.gain.linearRampToValueAtTime(0.18, startTime + 2);

    // ---- VISUAL: pixel sort with audio-reactive displacement ----
    const scale = 0.35;
    let w, h;
    let noiseMap;

    function resize() {
      w = Math.floor(window.innerWidth * scale);
      h = Math.floor(window.innerHeight * scale);
      canvas.width = w;
      canvas.height = h;
      noiseMap = new Float32Array(w);
      for (let x = 0; x < w; x++) {
        noiseMap[x] = (Math.random() - 0.5) * 2;
      }
    }
    resize();
    window.addEventListener('resize', resize);

    // Seed with organic noise field instead of horizontal lines
    function seedBase() {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      // Scattered bright points — particle field (monochrome + accent)
      const numPts = 40 + Math.floor(Math.random() * 60);
      for (let i = 0; i < numPts; i++) {
        const px = Math.random() * w;
        const py = Math.random() * h;
        const radius = 1 + Math.random() * 3;
        const brightness = 20 + Math.floor(Math.random() * 70);
        const isAccent = Math.random() < 0.2;
        if (isAccent) {
          const a = brightness / 255;
          ctx.fillStyle = `rgb(${Math.floor(193 * a)},${Math.floor(68 * a)},${Math.floor(14 * a)})`;
        } else {
          ctx.fillStyle = `rgb(${brightness},${brightness},${brightness})`;
        }
        ctx.fillRect(px, py, radius, radius);
      }
      // Organic curves — bezier strokes (monochrome + accent)
      ctx.lineWidth = 0.5 + Math.random();
      for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = Math.random() < 0.25 ? '#4a1906' : ['#252525', '#1a1a1a', '#303030'][Math.floor(Math.random() * 3)];
        ctx.globalAlpha = 0.1 + Math.random() * 0.12;
        ctx.beginPath();
        ctx.moveTo(Math.random() * w, Math.random() * h);
        ctx.bezierCurveTo(
          Math.random() * w, Math.random() * h,
          Math.random() * w, Math.random() * h,
          Math.random() * w, Math.random() * h
        );
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    seedBase();

    // --- EFFECT SCHEDULER: staggered temporal variation ---
    // Each effect has independent on/off windows. Max ~2-3 concurrent.
    const effectSlots = {
      videoDropout:   { active: false, nextToggle: 0, onMin: 3000, onMax: 8000,  offMin: 6000,  offMax: 15000 },
      organicDisp:    { active: false, nextToggle: 0, onMin: 4000, onMax: 10000, offMin: 5000,  offMax: 12000 },
      vertexTrails:   { active: false, nextToggle: 0, onMin: 2000, onMax: 6000,  offMin: 12000, offMax: 25000 },
      lissajous:      { active: false, nextToggle: 0, onMin: 5000, onMax: 12000, offMin: 5000,  offMax: 12000 },
      slitScan:       { active: false, nextToggle: 0, onMin: 4000, onMax: 10000, offMin: 5000,  offMax: 12000 },
      feedbackMirror: { active: false, nextToggle: 0, onMin: 4000, onMax: 10000, offMin: 6000,  offMax: 15000 },
      radialPulse:    { active: false, nextToggle: 0, onMin: 5000, onMax: 12000, offMin: 5000,  offMax: 12000 },
      datamosh:       { active: false, nextToggle: 0, onMin: 4000, onMax: 10000, offMin: 5000,  offMax: 12000 },
      blobTracking:   { active: false, nextToggle: 0, onMin: 5000, onMax: 12000, offMin: 6000,  offMax: 15000 },
      asciiBlowout:   { active: false, nextToggle: 0, onMin: 4000, onMax: 10000, offMin: 5000,  offMax: 14000 },
    };
    const slotKeys = Object.keys(effectSlots);
    // Stagger initial activations so they don't all start together
    slotKeys.forEach((key, i) => {
      effectSlots[key].nextToggle = 2000 + i * 2000 + Math.random() * 3000;
    });

    function updateEffectScheduler(time) {
      const activeCount = slotKeys.filter(k => effectSlots[k].active).length;
      slotKeys.forEach(key => {
        const slot = effectSlots[key];
        if (time >= slot.nextToggle) {
          if (slot.active) {
            // Turn off — schedule next activation
            slot.active = false;
            slot.nextToggle = time + slot.offMin + Math.random() * (slot.offMax - slot.offMin);
          } else if (activeCount < 3 || Math.random() < 0.1) {
            // Turn on — allow up to ~3 concurrent, rarely more
            slot.active = true;
            slot.nextToggle = time + slot.onMin + Math.random() * (slot.onMax - slot.onMin);
          } else {
            // Too many active — defer
            slot.nextToggle = time + 3000 + Math.random() * 5000;
          }
        }
      });
    }

    let noiseTimer = 0;
    const noiseInterval = 1200;

    function animate(time) {
      // Get frequency spectrum from audio
      analyser.getByteFrequencyData(freqData);

      // Derive audio energy bands
      let bassEnergy = 0, midEnergy = 0, highEnergy = 0;
      const binCount = freqData.length;
      for (let i = 0; i < binCount; i++) {
        const v = freqData[i] / 255;
        if (i < binCount * 0.15) bassEnergy += v;
        else if (i < binCount * 0.5) midEnergy += v;
        else highEnergy += v;
      }
      bassEnergy /= (binCount * 0.15);
      midEnergy /= (binCount * 0.35);
      highEnergy /= (binCount * 0.5);

      updateEffectScheduler(time);

      // Audio-modulated noise evolution
      if (time - noiseTimer > noiseInterval) {
        noiseTimer = time;
        for (let x = 0; x < w; x++) {
          // Map frequency bins to columns for spectral displacement
          const bin = Math.floor((x / w) * binCount);
          const freqInfluence = (freqData[bin] || 0) / 255;
          noiseMap[x] += (Math.random() - 0.5) * (0.3 + freqInfluence * 0.8);
          noiseMap[x] = Math.max(-1, Math.min(1, noiseMap[x]));
        }
      }

      // --- VIDEO DROPOUT: VHS-style signal loss ---
      if (effectSlots.videoDropout.active) {
      const dropoutRoll = Math.random();
      if (dropoutRoll < 0.006) {
        // Hard black dropout
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
        frameRef.current = requestAnimationFrame(animate);
        return;
      } else if (dropoutRoll < 0.009) {
        // Accent flash
        ctx.fillStyle = '#c1440e';
        ctx.fillRect(0, 0, w, h);
        frameRef.current = requestAnimationFrame(animate);
        return;
      } else if (dropoutRoll < 0.013) {
        // VHS rolling — shift entire image vertically
        try {
          const shiftY = Math.floor(Math.random() * h * 0.6);
          const top = ctx.getImageData(0, 0, w, shiftY);
          const bottom = ctx.getImageData(0, shiftY, w, h - shiftY);
          ctx.putImageData(bottom, 0, 0);
          ctx.putImageData(top, 0, h - shiftY);
        } catch(e) {}
        frameRef.current = requestAnimationFrame(animate);
        return;
      } else if (dropoutRoll < 0.02) {
        // Horizontal hold loss — offset random horizontal slices
        const numSlices = 3 + Math.floor(Math.random() * 8);
        try {
          for (let i = 0; i < numSlices; i++) {
            const sy = Math.floor(Math.random() * h);
            const sh = 2 + Math.floor(Math.random() * 15);
            const ox = Math.floor((Math.random() - 0.5) * w * 0.4);
            const slice = ctx.getImageData(0, sy, w, Math.min(sh, h - sy));
            ctx.putImageData(slice, ox, sy);
          }
        } catch(e) {}
      } else if (dropoutRoll < 0.035) {
        // Partial horizontal dropout — random bands
        const numBands = 2 + Math.floor(Math.random() * 6);
        for (let i = 0; i < numBands; i++) {
          const by = Math.random() * h;
          const bh = 5 + Math.random() * (h * 0.15);
          ctx.fillStyle = Math.random() > 0.3 ? '#000' : (Math.random() < 0.3 ? '#c1440e' : '#222');
          ctx.fillRect(0, by, w, bh);
        }
      } else if (dropoutRoll < 0.04) {
        // Static burst — fill region with noise
        const nx = Math.floor(Math.random() * w * 0.5);
        const ny = Math.floor(Math.random() * h * 0.5);
        const nw = Math.floor(30 + Math.random() * w * 0.4);
        const nh = Math.floor(20 + Math.random() * h * 0.3);
        const noiseImg = ctx.createImageData(Math.min(nw, w - nx), Math.min(nh, h - ny));
        for (let i = 0; i < noiseImg.data.length; i += 4) {
          const v = Math.floor(Math.random() * 60);
          noiseImg.data[i] = v;
          noiseImg.data[i + 1] = v;
          noiseImg.data[i + 2] = v;
          noiseImg.data[i + 3] = 255;
        }
        ctx.putImageData(noiseImg, nx, ny);
      }
      } // end videoDropout

      // Pixel sort — EXTREME intensity driven by bass, chroma by highs
      const imageData = ctx.getImageData(0, 0, w, h);
      const src = imageData.data;
      const output = ctx.createImageData(w, h);
      const dst = output.data;

      const t = time * 0.001;
      const baseIntensity = 0.6 + Math.sin(t * 0.5) * 0.25;
      const intensity = baseIntensity + bassEnergy * 0.8;
      const maxDisp = Math.floor(h * 0.35 * intensity);
      const chromaOffset = Math.max(2, Math.floor((4 + highEnergy * 12) * intensity));

      for (let x = 0; x < w; x++) {
        // Per-column: blend noise map with live frequency data
        const bin = Math.floor((x / w) * binCount);
        const freqMod = (freqData[bin] || 0) / 255;
        const colNoise = noiseMap[x] * (0.8 + freqMod * 1.2);

        for (let y = 0; y < h; y++) {
          const idx = (y * w + x) * 4;
          const lum = (src[idx] * 0.299 + src[idx + 1] * 0.587 + src[idx + 2] * 0.114) / 255;

          // Mid energy adds aggressive horizontal wobble
          const hDisp = Math.round(midEnergy * 10 * Math.sin(y * 0.08 + t * 5));
          const sampleX = Math.max(0, Math.min(w - 1, x + hDisp));

          const disp = Math.round(lum * maxDisp * colNoise);
          const sampleY = Math.max(0, Math.min(h - 1, y - disp));
          const rY = Math.max(0, Math.min(h - 1, sampleY - chromaOffset));
          const bY = Math.max(0, Math.min(h - 1, sampleY + chromaOffset));

          // Monochrome pixel sort — luminance displacement with accent tint on bright pixels
          const rSrc = (rY * w + sampleX) * 4;
          const gSrc = (sampleY * w + sampleX) * 4;
          const bSrc = (bY * w + sampleX) * 4;
          const lumR = src[rSrc] * 0.299 + src[rSrc + 1] * 0.587 + src[rSrc + 2] * 0.114;
          const lumG = src[gSrc] * 0.299 + src[gSrc + 1] * 0.587 + src[gSrc + 2] * 0.114;
          const lumB = src[bSrc] * 0.299 + src[bSrc + 1] * 0.587 + src[bSrc + 2] * 0.114;
          const monoVal = (lumR + lumG + lumB) / 3 * 0.75; // moderate brightness crush
          // Tint brighter pixels toward accent (#c1440e)
          const accentMix = monoVal > 60 ? (monoVal - 60) / 135 * 0.4 : 0;
          dst[idx]     = Math.floor(monoVal * (1 - accentMix) + (193 * monoVal / 255) * accentMix);
          dst[idx + 1] = Math.floor(monoVal * (1 - accentMix) + (68 * monoVal / 255) * accentMix);
          dst[idx + 2] = Math.floor(monoVal * (1 - accentMix) + (14 * monoVal / 255) * accentMix);
          dst[idx + 3] = 255;
        }
      }

      // --- MONOCHROME SCATTER: explode pixels as luminance fragments with accent tint ---
      const scatterData = ctx.createImageData(w, h);
      const sd = scatterData.data;
      for (let i = 3; i < sd.length; i += 4) sd[i] = 255;

      const scatterSpread = Math.floor(6 + bassEnergy * 12);
      const threshold = 80;

      for (let y = 0; y < h; y += 2) {
        for (let x = 0; x < w; x += 2) {
          const si = (y * w + x) * 4;
          const pixLum = (dst[si] * 0.299 + dst[si + 1] * 0.587 + dst[si + 2] * 0.114);

          if (pixLum > threshold) {
            const sx = Math.max(0, Math.min(w - 1, x + Math.floor((Math.random() - 0.5) * scatterSpread)));
            const sy = Math.max(0, Math.min(h - 1, y + Math.floor((Math.random() - 0.3) * scatterSpread)));
            const di = (sy * w + sx) * 4;
            // 20% of scattered pixels get accent tint
            if (Math.random() < 0.2) {
              const v = pixLum / 255 * 0.5;
              sd[di]     = Math.min(255, sd[di] + Math.floor(193 * v));
              sd[di + 1] = Math.min(255, sd[di + 1] + Math.floor(68 * v));
              sd[di + 2] = Math.min(255, sd[di + 2] + Math.floor(14 * v));
            } else {
              const l = Math.floor(pixLum * 0.5);
              sd[di]     = Math.min(255, sd[di] + l);
              sd[di + 1] = Math.min(255, sd[di + 1] + l);
              sd[di + 2] = Math.min(255, sd[di + 2] + l);
            }
          }
        }
      }

      // Blend: mix pixel-sorted output with RGB scatter
      const blendRatio = 0.25 + highEnergy * 0.2;
      for (let i = 0; i < dst.length; i += 4) {
        dst[i]     = Math.floor(dst[i] * (1 - blendRatio) + sd[i] * blendRatio);
        dst[i + 1] = Math.floor(dst[i + 1] * (1 - blendRatio) + sd[i + 1] * blendRatio);
        dst[i + 2] = Math.floor(dst[i + 2] * (1 - blendRatio) + sd[i + 2] * blendRatio);
      }

      ctx.putImageData(output, 0, 0);

      // Feedback trail — slight fade instead of full clear, creates ghosting
      ctx.save();
      ctx.globalAlpha = 0.04 + bassEnergy * 0.04;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      // Re-seed with organic particles — keep canvas alive
      if (bassEnergy > 0.4 || Math.random() < 0.05) {
        ctx.save();
        ctx.globalAlpha = 0.2 + bassEnergy * 0.25;
        seedBase();
        ctx.restore();
      }

      // Audio-reactive particle burst — monochrome + accent dots driven by frequency
      ctx.save();
      const numParticles = Math.floor(bassEnergy * 20 + midEnergy * 12);
      for (let i = 0; i < numParticles; i++) {
        const bin = Math.floor(Math.random() * binCount);
        const v = freqData[bin] / 255;
        if (v < 0.15) continue;
        const px = (bin / binCount) * w + (Math.random() - 0.5) * 30;
        const py = Math.random() * h;
        const size = 1 + v * 2;
        const bright = Math.floor(25 + v * 55);
        if (Math.random() < 0.15) {
          ctx.fillStyle = `rgb(${Math.floor(120 * v)},${Math.floor(42 * v)},${Math.floor(9 * v)})`;
        } else {
          ctx.fillStyle = `rgb(${bright},${bright},${bright})`;
        }
        ctx.fillRect(px, py, size, size);
      }
      ctx.restore();

      // Organic displacement — warp a region with bezier-driven offset
      if (effectSlots.organicDisp.active && Math.random() < 0.04) {
        const srcX = Math.floor(Math.random() * w * 0.6);
        const srcY = Math.floor(Math.random() * h * 0.6);
        const sw = 20 + Math.floor(Math.random() * 80);
        const sh = 20 + Math.floor(Math.random() * 80);
        const ox = Math.floor((Math.random() - 0.5) * 40);
        const oy = Math.floor((Math.random() - 0.5) * 40);
        try {
          const region = ctx.getImageData(srcX, srcY, Math.min(sw, w - srcX), Math.min(sh, h - srcY));
          ctx.globalAlpha = 0.6 + Math.random() * 0.4;
          ctx.putImageData(region, srcX + ox, srcY + oy);
          ctx.globalAlpha = 1;
        } catch(e) {}
      }

      // Vertex trails — audio-reactive flowing lines
      if (effectSlots.vertexTrails.active && midEnergy > 0.35 && Math.random() < 0.4) {
        ctx.save();
        const invertedBlend = ['exclusion', 'difference'].includes(blendRef.current);
        ctx.globalAlpha = invertedBlend ? 0.25 + midEnergy * 0.2 : 0.06 + midEnergy * 0.08;
        ctx.strokeStyle = invertedBlend
          ? (Math.random() < 0.2 ? '#c1440e' : ['#e0e0e0', '#c8c8c8', '#b0b0b0'][Math.floor(Math.random() * 3)])
          : (Math.random() < 0.2 ? '#3d1504' : ['#1e1e1e', '#181818', '#141414'][Math.floor(Math.random() * 3)]);
        ctx.lineWidth = 0.5 + Math.random() * 1.5;
        ctx.beginPath();
        const startX = Math.random() * w;
        const startY = Math.random() * h;
        ctx.moveTo(startX, startY);
        const segs = 3 + Math.floor(Math.random() * 5);
        for (let i = 0; i < segs; i++) {
          ctx.bezierCurveTo(
            startX + (Math.random() - 0.5) * w * 0.5,
            startY + (Math.random() - 0.5) * h * 0.5,
            startX + (Math.random() - 0.5) * w * 0.5,
            startY + (Math.random() - 0.5) * h * 0.5,
            Math.random() * w,
            Math.random() * h
          );
        }
        ctx.stroke();
        ctx.restore();
      }

      // --- FILM GRAIN / ANALOG NOISE ---
      ctx.save();
      const grainIntensity = 0.04 + bassEnergy * 0.06;
      ctx.globalAlpha = grainIntensity;
      const grainSize = 3;
      for (let gy = 0; gy < h; gy += grainSize) {
        for (let gx = 0; gx < w; gx += grainSize) {
          const v = Math.floor(Math.random() * 40);
          ctx.fillStyle = `rgb(${v},${v},${v})`;
          ctx.fillRect(gx, gy, grainSize, grainSize);
        }
      }
      ctx.restore();

      // --- LISSAJOUS FIGURES — oscilloscope-style parametric curves ---
      if (effectSlots.lissajous.active && Math.random() < 0.08 + midEnergy * 0.08) {
        ctx.save();
        const invertLiss = ['exclusion', 'difference'].includes(blendRef.current);
        ctx.globalAlpha = invertLiss ? 0.3 : 0.08;
        const isAccentL = Math.random() < 0.15;
        ctx.strokeStyle = isAccentL
          ? (invertLiss ? '#c1440e' : '#6b2408')
          : (invertLiss ? '#d0d0d0' : '#1a1a1a');
        ctx.lineWidth = 0.5 + Math.random();
        const lcx = Math.random() * w;
        const lcy = Math.random() * h;
        const lrx = 15 + Math.random() * 60;
        const lry = 15 + Math.random() * 60;
        const la = 1 + Math.floor(Math.random() * 5);
        const lb = 1 + Math.floor(Math.random() * 5);
        const lphase = Math.random() * Math.PI * 2;
        ctx.beginPath();
        for (let li = 0; li <= 200; li++) {
          const lt = (li / 200) * Math.PI * 2;
          const lx = lcx + Math.sin(la * lt + lphase) * lrx;
          const ly = lcy + Math.sin(lb * lt) * lry;
          li === 0 ? ctx.moveTo(lx, ly) : ctx.lineTo(lx, ly);
        }
        ctx.stroke();
        ctx.restore();
      }

      // --- SLIT-SCAN DISTORTION — time-stretch a horizontal band ---
      if (effectSlots.slitScan.active && Math.random() < 0.06 + highEnergy * 0.06) {
        try {
          const slitY = Math.floor(Math.random() * h);
          const slitH = 1 + Math.floor(Math.random() * 4);
          const slit = ctx.getImageData(0, slitY, w, Math.min(slitH, h - slitY));
          const stretchH = 10 + Math.floor(Math.random() * 40);
          ctx.save();
          ctx.globalAlpha = 0.4 + Math.random() * 0.3;
          for (let si = 0; si < stretchH; si++) {
            ctx.putImageData(slit, 0, slitY + si);
          }
          ctx.restore();
        } catch(e) {}
      }

      // --- FEEDBACK MIRROR — duplicate and flip a region ---
      if (effectSlots.feedbackMirror.active && Math.random() < 0.05) {
        try {
          const mx = Math.floor(Math.random() * w * 0.4);
          const my = Math.floor(Math.random() * h * 0.4);
          const mw = 40 + Math.floor(Math.random() * 100);
          const mh = 40 + Math.floor(Math.random() * 100);
          const mirrorRegion = ctx.getImageData(mx, my, Math.min(mw, w - mx), Math.min(mh, h - my));
          // Flip horizontally by reversing pixel rows
          const mrw = mirrorRegion.width;
          const mrh = mirrorRegion.height;
          const md = mirrorRegion.data;
          for (let ry = 0; ry < mrh; ry++) {
            for (let rx = 0; rx < Math.floor(mrw / 2); rx++) {
              const li2 = (ry * mrw + rx) * 4;
              const ri2 = (ry * mrw + (mrw - 1 - rx)) * 4;
              for (let c = 0; c < 4; c++) {
                const tmp = md[li2 + c]; md[li2 + c] = md[ri2 + c]; md[ri2 + c] = tmp;
              }
            }
          }
          ctx.globalAlpha = 0.3 + Math.random() * 0.3;
          ctx.putImageData(mirrorRegion, mx + Math.floor((Math.random() - 0.5) * 40), my);
          ctx.globalAlpha = 1;
        } catch(e) {}
      }

      // --- RADIAL PULSE — concentric rings on bass hits ---
      if (effectSlots.radialPulse.active && bassEnergy > 0.3 && Math.random() < 0.12) {
        ctx.save();
        const invertRad = ['exclusion', 'difference'].includes(blendRef.current);
        ctx.globalAlpha = invertRad ? 0.2 : 0.05;
        const pcx = Math.random() * w;
        const pcy = Math.random() * h;
        const rings = 3 + Math.floor(Math.random() * 6);
        ctx.strokeStyle = Math.random() < 0.2
          ? (invertRad ? '#c1440e' : '#4a1906')
          : (invertRad ? '#b0b0b0' : '#1a1a1a');
        ctx.lineWidth = 0.5;
        for (let ri = 0; ri < rings; ri++) {
          const radius = 8 + ri * (8 + Math.random() * 15);
          ctx.beginPath();
          ctx.arc(pcx, pcy, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // --- DATAMOSH BLOCK SHIFT — offset rectangular chunks ---
      if (effectSlots.datamosh.active && Math.random() < 0.06 + bassEnergy * 0.06) {
        try {
          const numBlocks = 1 + Math.floor(Math.random() * 4);
          for (let bi = 0; bi < numBlocks; bi++) {
            const bx = Math.floor(Math.random() * w);
            const by2 = Math.floor(Math.random() * h);
            const bw2 = 10 + Math.floor(Math.random() * 60);
            const bh2 = 10 + Math.floor(Math.random() * 40);
            const bxo = Math.floor((Math.random() - 0.5) * 30);
            const byo = Math.floor((Math.random() - 0.5) * 20);
            const block = ctx.getImageData(
              Math.max(0, bx), Math.max(0, by2),
              Math.min(bw2, w - Math.max(0, bx)), Math.min(bh2, h - Math.max(0, by2))
            );
            ctx.putImageData(block, bx + bxo, by2 + byo);
          }
        } catch(e) {}
      }

      // --- BLOB TRACKING — contour outlines around bright regions ---
      if (effectSlots.blobTracking.active && Math.random() < 0.06 + bassEnergy * 0.06) {
        try {
          const blobData = ctx.getImageData(0, 0, w, h);
          const bd = blobData.data;
          const invertBlob = ['exclusion', 'difference'].includes(blendRef.current);
          // Find bright regions and draw tracking contours
          const blobThresh = 40 + Math.floor(bassEnergy * 30);
          const visited = new Uint8Array(w * h);
          const numBlobs = 2 + Math.floor(Math.random() * 4);
          let blobsFound = 0;

          ctx.save();
          ctx.globalAlpha = invertBlob ? 0.35 : 0.12;
          ctx.lineWidth = 1 + Math.random();

          for (let attempt = 0; attempt < 30 && blobsFound < numBlobs; attempt++) {
            const sx2 = Math.floor(Math.random() * w);
            const sy2 = Math.floor(Math.random() * h);
            const si2 = (sy2 * w + sx2) * 4;
            const lum2 = bd[si2] * 0.299 + bd[si2 + 1] * 0.587 + bd[si2 + 2] * 0.114;
            if (lum2 < blobThresh || visited[sy2 * w + sx2]) continue;

            // Trace contour by marching around bright region
            const contourPts = [];
            let cx2 = sx2, cy2 = sy2;
            const maxSteps = 80 + Math.floor(Math.random() * 120);
            let angle = 0;

            for (let step = 0; step < maxSteps; step++) {
              contourPts.push({ x: cx2, y: cy2 });
              visited[cy2 * w + cx2] = 1;

              // March along contour edge — find next bright neighbor
              let found = false;
              for (let da = -2; da <= 2; da++) {
                const a = angle + da * 0.4;
                const nx2 = Math.round(cx2 + Math.cos(a) * 2);
                const ny2 = Math.round(cy2 + Math.sin(a) * 2);
                if (nx2 < 0 || nx2 >= w || ny2 < 0 || ny2 >= h) continue;
                const ni2 = (ny2 * w + nx2) * 4;
                const nl = bd[ni2] * 0.299 + bd[ni2 + 1] * 0.587 + bd[ni2 + 2] * 0.114;
                if (nl >= blobThresh && !visited[ny2 * w + nx2]) {
                  cx2 = nx2; cy2 = ny2;
                  angle = a;
                  found = true;
                  break;
                }
              }
              if (!found) {
                // Nudge angle and try to continue
                angle += 0.5 + Math.random() * 0.5;
                cx2 = Math.max(0, Math.min(w - 1, Math.round(cx2 + Math.cos(angle) * 2)));
                cy2 = Math.max(0, Math.min(h - 1, Math.round(cy2 + Math.sin(angle) * 2)));
              }
            }

            if (contourPts.length > 10) {
              // Draw tracking contour
              const isAccentBlob = Math.random() < 0.3;
              ctx.strokeStyle = isAccentBlob
                ? (invertBlob ? '#c1440e' : '#8a3009')
                : (invertBlob ? '#c0c0c0' : '#2a2a2a');
              ctx.beginPath();
              ctx.moveTo(contourPts[0].x, contourPts[0].y);
              for (let pi = 1; pi < contourPts.length; pi++) {
                ctx.lineTo(contourPts[pi].x, contourPts[pi].y);
              }
              ctx.closePath();
              ctx.stroke();

              // Tracking crosshair at centroid
              let avgX = 0, avgY = 0;
              contourPts.forEach(p => { avgX += p.x; avgY += p.y; });
              avgX /= contourPts.length;
              avgY /= contourPts.length;
              const crossSize = 4 + Math.random() * 8;
              ctx.beginPath();
              ctx.moveTo(avgX - crossSize, avgY);
              ctx.lineTo(avgX + crossSize, avgY);
              ctx.moveTo(avgX, avgY - crossSize);
              ctx.lineTo(avgX, avgY + crossSize);
              ctx.stroke();
              // Tracking circle
              ctx.beginPath();
              ctx.arc(avgX, avgY, crossSize * 1.5, 0, Math.PI * 2);
              ctx.stroke();

              blobsFound++;
            }
          }
          ctx.restore();
        } catch(e) {}
      }

      // --- ASCII BLOWOUT — scatter text characters across canvas ---
      if (effectSlots.asciiBlowout.active && Math.random() < 0.05 + highEnergy * 0.05) {
        ctx.save();
        const invertAscii = ['exclusion', 'difference'].includes(blendRef.current);
        const asciiWords = ['FAULT', 'ERR', 'NULL', 'VOID', 'DECAY', 'LOST', '////', '0x00', 'NaN',
          'BREAK', 'SYNC', 'DEAD', 'NOISE', 'BLEED', 'DRIFT', 'ABORT', 'LEAK', '????',
          'KEVIN', 'BOYLE', 'DESIGN', 'SIGNAL', 'STATIC', 'FIELD'];
        const asciiChars = '@#$%&*+=<>{}[]|/\\~^';
        const numBursts = 3 + Math.floor(Math.random() * 8 + bassEnergy * 6);
        const burstCenterX = Math.random() * w;
        const burstCenterY = Math.random() * h;
        const spread = 30 + Math.random() * w * 0.4;

        for (let ai = 0; ai < numBursts; ai++) {
          const angle2 = Math.random() * Math.PI * 2;
          const dist = Math.random() * spread;
          const ax = burstCenterX + Math.cos(angle2) * dist;
          const ay = burstCenterY + Math.sin(angle2) * dist;

          const useWord = Math.random() < 0.35;
          const text2 = useWord
            ? asciiWords[Math.floor(Math.random() * asciiWords.length)]
            : asciiChars[Math.floor(Math.random() * asciiChars.length)].repeat(1 + Math.floor(Math.random() * 3));

          const fontSize2 = useWord
            ? 3 + Math.floor(Math.random() * 8)
            : 4 + Math.floor(Math.random() * 12);

          ctx.font = `bold ${fontSize2}px monospace`;
          ctx.globalAlpha = invertAscii
            ? 0.2 + Math.random() * 0.4
            : 0.06 + Math.random() * 0.15;

          const isAccentAscii = Math.random() < 0.25;
          ctx.fillStyle = isAccentAscii
            ? (invertAscii ? '#c1440e' : '#8a3009')
            : (invertAscii ? '#d0d0d0' : '#1a1a1a');

          // Slight rotation for chaotic feel
          ctx.translate(ax, ay);
          ctx.rotate((Math.random() - 0.5) * 0.8);
          ctx.fillText(text2, 0, 0);
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        ctx.restore();
      }

      frameRef.current = requestAnimationFrame(animate);
    }

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      alive = false;
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
      clearTimeout(glitchTimer);
      clearInterval(resumeInterval);
      // Remove audio unlock listeners from this mount
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('mousemove', unlockAudio);
      document.removeEventListener('scroll', unlockAudio);
      // Fade out audio then close
      try {
        const t = audioCtx.currentTime;
        master.gain.linearRampToValueAtTime(0, t + 0.5);
      } catch(e) {}
      setTimeout(() => {
        [sub1, sub2, sub3, mid1, mid2, mid3Osc, noise, hi1, hi2, hi3, lfo1, lfo1b, lfo1c, lfo2, gate,
         subDrift, subDrift2, subFilterLfo, subFilterLfo2, midDrift, midDrift2, hiDrift,
         ringCarrier, ringMod, ringLfo, gateDrift, gateDrift2, stegoSource].forEach(n => { try { n.stop(); } catch(e) {} });
        // Don't close audioCtx — it's shared via window.__glitchAudioCtx for reuse across remounts
      }, 600);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 9999,
          mixBlendMode: blendMode,
          imageRendering: 'pixelated',
          clipPath: 'inset(0 50% 0 0)',
        }}
      />
    </>
  );
}

// ========================
// APP
// ========================

const initialViz = Math.floor(Math.random() * visualizations.length);

function App() {
  const [selectedId, setSelectedId] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [vizIndex, setVizIndex] = useState(initialViz);
  const [glitchMode, setGlitchMode] = useState(false);
  const [nameFallen, setNameFallen] = useState(false);
  const initialLoadRef = useRef(true);
  const leftPanelRef = useRef(null);

  // Brief glimpse of normal site before glitch kicks in
  useEffect(() => {
    const timer = setTimeout(() => setGlitchMode(true), 800);
    return () => clearTimeout(timer);
  }, []);

  // Cascading text melt effect in glitch mode
  useGlitchMelt(glitchMode, leftPanelRef);


  const selected = selectedId
    ? allProjects.find((p) => p.id === selectedId)
    : null;

  // Suction scroll effect on all text elements approaching the nav
  useEffect(() => {
    if (window.innerWidth <= 768) return; // disable on mobile
    const panel = leftPanelRef.current;
    if (!panel) return;

    const nav = panel.querySelector('.nav');
    if (!nav) return;

    const selector = '.hero-label, .project-row, .section-label, .about-headline, .about-text, .about-links, .capability, .experience-row, .footer-cta, .footer-meta, .project-view__skill, .project-view__skills';
    let elements = panel.querySelectorAll(selector);

    // Re-query periodically in case DOM changes
    const requery = setInterval(() => {
      elements = panel.querySelectorAll(selector);
    }, 2000);

    function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

    let frame;
    function update() {
      const navBottom = nav.getBoundingClientRect().bottom;

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const rect = el.getBoundingClientRect();
        const distFromNav = rect.top - navBottom;
        const triggerDist = 120;

        if (distFromNav > triggerDist) {
          if (el.style.transform) {
            el.style.transform = '';
            el.style.opacity = '';
            el.style.filter = '';
          }
          continue;
        }

        const progress = clamp(1 - (distFromNav / triggerDist), 0, 1);
        const eased = progress * progress;
        const ty = -eased * 35;
        const sy = 1 - eased * 0.5;
        const blur = eased * 5;

        el.style.transform = `translateY(${ty}px) scaleY(${sy})`;
        el.style.opacity = 1 - eased;
        el.style.filter = `blur(${blur}px)`;
        el.style.transformOrigin = '50% 0%';
      }

      frame = requestAnimationFrame(update);
    }

    frame = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(frame);
      clearInterval(requery);
    };
  }, []);

  const handleSelect = useCallback((id) => {
    const newId = selectedId === id ? null : id;

    if (selectedId && newId) {
      setTransitioning(true);
      setTimeout(() => {
        setSelectedId(newId);
        setTransitioning(false);
      }, 250);
    } else {
      setSelectedId(newId);
    }
  }, [selectedId]);

  return (
    <div className={`split-layout${glitchMode ? ' glitch-mode' : ''}`}>
      {glitchMode && <GlitchOverlay />}
      {glitchMode && <FrameFX />}
      {/* LEFT PANEL */}
      <div className="left-panel" ref={leftPanelRef} onClick={glitchMode ? () => { initialLoadRef.current = false; setGlitchMode(false); setNameFallen(false); } : undefined}>
        <nav className="nav">
          <span className="nav__name" style={{ cursor: glitchMode ? 'default' : 'pointer' }} onClick={!glitchMode ? () => setGlitchMode(true) : undefined}>
            <FallingName active={glitchMode} onAllFallen={() => setNameFallen(true)} />
          </span>
          <span className="nav__info">
            <span>Design Engineer</span>
            <span>Austin, TX</span>
          </span>
          <span className="nav__links">
            <a href="mailto:thekevinboyle@gmail.com">Email &#x2197;</a>
            <a href="#about" onClick={(e) => { e.preventDefault(); document.querySelector('.about-section')?.scrollIntoView({ behavior: 'smooth' }); }}>About &#x2197;</a>
            <a href="/kevin-boyle-general-2026.pdf" target="_blank" rel="noopener noreferrer">CV &#x2197;</a>
          </span>
        </nav>

        <div className="hero-section">
          <SuctionHeadline scrollRef={leftPanelRef} />
          <div className="hero-label">
            <span className="hero-label__title"><AccentMark index={0} />Selected Work</span>
            <span className="hero-label__years">2016 - Present Day</span>
          </div>
        </div>

        <div className="project-index">
          {allProjects.map((project) => (
            <div
              key={project.id}
              className={`project-row ${selectedId === project.id ? 'project-row--selected' : ''}`}
              onClick={() => handleSelect(project.id)}
            >
              <span className="project-row__index">{project.index}</span>
              <span className="project-row__name">{project.title}</span>
              <span className="project-row__category">{project.details?.category || project.category}</span>
              <span className="project-row__year">{project.details?.year || '2024'}</span>
            </div>
          ))}
        </div>

        <div className="about-section">
          <span className="section-label"><AccentMark index={0} />About</span>
          <h2 className="about-headline">Context engineering is the art of shaping AI behavior.</h2>
          <FadeIn as="p" className="about-text" delay={100}>
            I bring a decade of design experience to this emerging discipline. From building design systems at IBM to crafting user experiences at startups, I've learned that the best interfaces disappear.
          </FadeIn>
          <FadeIn as="p" className="about-text" delay={200}>
            Now I apply those principles to human-AI collaboration, designing the invisible architectures that shape how machines understand intent.
          </FadeIn>
          <div className="about-links">
            <a href="https://weareallgonners.bandcamp.com/" target="_blank" rel="noopener noreferrer">Bandcamp &#x2197;</a>
            <a href="https://transgressive.libsyn.com/" target="_blank" rel="noopener noreferrer">Transgressive Podcast &#x2197;</a>
            <a href="https://www.linkedin.com/in/kevinboyle/" target="_blank" rel="noopener noreferrer">LinkedIn &#x2197;</a>
          </div>
        </div>

        <div className="capabilities-section">
          <span className="section-label"><AccentMark index={1} />What I Do</span>
          {capabilities.map((cap, i) => (
            <FadeIn key={cap.number} as="div" className="capability" delay={i * 80}>
              <span className="capability__number">{cap.number}</span>
              <div className="capability__content">
                <h3 className="capability__title">{cap.title}</h3>
                <p className="capability__description">{cap.description}</p>
                <div className="capability__tags">
                  {cap.tags.map((tag) => (
                    <span key={tag} className="capability__tag">{tag}</span>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <div className="experience-section">
          <span className="section-label"><AccentMark index={2} />Work Experience</span>
          {experience.map((exp, i) => (
            <FadeIn key={exp.years} as="div" className="experience-row" delay={i * 60}>
              <span className="experience-row__role">{exp.role}</span>
              <span className="experience-row__company">{exp.company}</span>
              <span className="experience-row__years">{exp.years}</span>
            </FadeIn>
          ))}
        </div>

        <footer className="left-footer">
          <div className="footer-cta">
            <span className="footer-cta__text">Experimental sensory coordination&mdash;</span>
            <a href="mailto:thekevinboyle@gmail.com?subject=Ayoo" className="footer-cta__link">Send a signal</a>
          </div>
          <div className="footer-meta">
            <span>2026 &copy; Kevin Boyle</span>
            <span>thekevinboyle@gmail.com</span>
          </div>
        </footer>
        {glitchMode && nameFallen && <GlitchCenterName onExit={() => { initialLoadRef.current = false; setGlitchMode(false); setNameFallen(false); }} />}
      </div>

      {/* RIGHT PANEL */}
      <div className="right-panel">
        {selected ? (
          <>
            <DisengageButton onClick={() => setSelectedId(null)} projectId={selectedId} />
            <ProjectView project={selected} transitioning={transitioning} />
          </>
        ) : (
          <>
            <CycleVizButton onClick={() => setVizIndex((i) => (i + 1) % visualizations.length)} index={vizIndex} />
            <VisualizationField vizIndex={vizIndex} />
          </>
        )}
      </div>
    </div>
  );
}

// ========================
// CYCLE VIZ BUTTON — rotates through visualizations
// ========================

function CycleVizButton({ onClick, index }) {
  const total = visualizations.length;
  const label = String(index + 1).padStart(2, '0') + '/' + String(total).padStart(2, '0');

  return (
    <button className="viz-cycle" onClick={onClick} aria-label="Next visualization">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 2" />
        <circle cx="16" cy="16" r="8" stroke="currentColor" strokeWidth="0.75" />
        <path d="M16 6 A10 10 0 0 1 26 16" stroke="currentColor" strokeWidth="1" fill="none" />
        <path d="M25 13 L26 16 L23 16" stroke="currentColor" strokeWidth="1" fill="none" />
        <path d="M16 26 A10 10 0 0 1 6 16" stroke="currentColor" strokeWidth="1" fill="none" />
        <path d="M7 19 L6 16 L9 16" stroke="currentColor" strokeWidth="1" fill="none" />
        <circle cx="16" cy="16" r="1.5" fill="currentColor" />
      </svg>
      <span className="viz-cycle__label">{label}</span>
    </button>
  );
}

// ========================
// VISUALIZATION FIELD
// ========================

function VisualizationField({ vizIndex }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const frameRef = useRef(null);
  const stateRef = useRef({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const viz = visualizations[vizIndex];
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const dpr = window.devicePixelRatio || 1;

    function resize() {
      const parent = canvas.parentElement;
      const style = getComputedStyle(parent);
      const w = Math.floor(parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight));
      const h = Math.floor(parent.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stateRef.current = {}; // reset state on resize
    }

    resize();
    window.addEventListener('resize', resize);

    function handleMouseMove(e) {
      const rect = canvas.parentElement.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left) / rect.width;
      mouseRef.current.y = (e.clientY - rect.top) / rect.height;
    }

    canvas.parentElement.addEventListener('mousemove', handleMouseMove);

    function animate(time) {
      const t = time * 0.001;
      const cw = canvas.width / dpr;
      const ch = canvas.height / dpr;
      viz.render(ctx, cw, ch, t, mouseRef.current.x, mouseRef.current.y, stateRef.current);
      frameRef.current = requestAnimationFrame(animate);
    }

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
      canvas.parentElement?.removeEventListener('mousemove', handleMouseMove);
    };
  }, [vizIndex]);

  return <canvas ref={canvasRef} className="blob-field" />;
}

// ========================
// PROJECT VIEW
// ========================

function ProjectView({ project, transitioning }) {
  const details = project.details;
  const [viewKey, setViewKey] = useState(project.id);

  useEffect(() => {
    setViewKey(project.id);
  }, [project.id]);

  if (!details) return null;

  const gallery = details.gallery || [];
  const hero = details.hero;
  const images = gallery.length > 0 ? gallery : hero ? [hero] : [];
  const hasExternalUrl = details.externalUrl;
  const hasAppUrl = details.appUrl;

  return (
    <div className={`project-view ${transitioning ? 'project-view--out' : ''}`} key={viewKey}>
      {details.description && (
        <div className="project-view__info">
          <p className="project-view__role">
            {details.role} — {details.year}
          </p>
          <p className="project-view__description">{details.description}</p>
          {details.workDescription && (
            <p className="project-view__work-description">{details.workDescription}</p>
          )}
          {details.skills && details.skills.length > 0 && (
            <div className="project-view__skills">
              {details.skills.map((skill) => (
                <span key={skill} className="project-view__skill">{skill}</span>
              ))}
            </div>
          )}
          {hasExternalUrl && (
            <a
              href={details.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="project-view__link"
            >
              Visit Site &rarr;
            </a>
          )}
          {hasAppUrl && (
            <a
              href={details.appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="project-view__link"
            >
              Launch App &rarr;
            </a>
          )}
        </div>
      )}

      <div className="project-view__images">
        {images.map((img, i) => (
          <MaybePixelSort
            key={`${viewKey}-${i}`}
            src={img}
            alt={`${project.title} ${i + 1}`}
            className="project-view__image"
            delay={i * 100}
          />
        ))}
      </div>
    </div>
  );
}

// ========================
// MAYBE PIXEL SORT — always applied
// ========================

function MaybePixelSort({ src, alt, className, delay }) {
  return <PixelSortImage src={src} alt={alt} className={className} delay={delay} />;
}

// ========================
// PIXEL SORT IMAGE
// ========================

function PixelSortImage({ src, alt, className }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [canvasOpacity, setCanvasOpacity] = useState(0);
  const [imgOpacity, setImgOpacity] = useState(0);
  const [ready, setReady] = useState(false);
  const frameRef = useRef(null);
  const originalRef = useRef(null);
  const noiseRef = useRef(null);
  const dimsRef = useRef({ w: 0, h: 0 });

  // Preload image and prepare canvas data
  useEffect(() => {
    setCanvasOpacity(0);
    setImgOpacity(0);
    setReady(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const maxW = 450;
      const scale = Math.min(1, maxW / img.width);
      const w = Math.floor(img.width * scale);
      const h = Math.floor(img.height * scale);
      canvas.width = w;
      canvas.height = h;
      dimsRef.current = { w, h };

      ctx.drawImage(img, 0, 0, w, h);
      originalRef.current = ctx.getImageData(0, 0, w, h);
      noiseRef.current = buildNoiseMap(w);

      // Show a lightly sorted initial frame
      pixelSort(ctx, originalRef.current, w, h, 0.5, noiseRef.current);
      setReady(true);
      setCanvasOpacity(1);
    };

    img.src = src;
    return () => cancelAnimationFrame(frameRef.current);
  }, [src]);

  // Trigger animation on scroll into view
  useEffect(() => {
    if (!ready || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          const { w, h } = dimsRef.current;
          const startTime = performance.now();
          const duration = 1800; // longer, smoother reveal

          function animate(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Smooth ease-in-out curve
            const eased = progress < 0.5
              ? 2 * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            const intensity = 0.5 * (1 - eased);

            pixelSort(ctx, originalRef.current, w, h, intensity, noiseRef.current);

            // Cross-fade: canvas fades out, image fades in during last 40%
            if (progress > 0.6) {
              const fadeProgress = (progress - 0.6) / 0.4;
              setCanvasOpacity(1 - fadeProgress);
              setImgOpacity(fadeProgress);
            }

            if (progress >= 1) {
              setCanvasOpacity(0);
              setImgOpacity(1);
              return;
            }

            frameRef.current = requestAnimationFrame(animate);
          }

          frameRef.current = requestAnimationFrame(animate);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [ready]);

  return (
    <div ref={containerRef} className="pixel-sort-container">
      <canvas
        ref={canvasRef}
        className="pixel-sort-canvas"
        style={{ opacity: canvasOpacity, transition: 'opacity 0.3s ease' }}
      />
      <img
        src={src}
        alt={alt}
        className={className}
        style={{
          opacity: imgOpacity,
          transition: 'opacity 0.3s ease',
        }}
      />
    </div>
  );
}

// Pre-generate a noise map per column for randomized displacement direction
function buildNoiseMap(w) {
  const noise = new Float32Array(w);
  for (let x = 0; x < w; x++) {
    noise[x] = (Math.random() - 0.5) * 2; // -1 to 1
  }
  return noise;
}

function pixelSort(ctx, original, w, h, intensity, noiseMap) {
  const output = ctx.createImageData(w, h);
  const src = original.data;
  const dst = output.data;

  const maxDisp = Math.floor(h * 0.1 * intensity);
  const chromaOffset = Math.max(1, Math.floor(2 * intensity));

  for (let x = 0; x < w; x++) {
    const colNoise = noiseMap[x];
    for (let y = 0; y < h; y++) {
      const idx = (y * w + x) * 4;
      const lum = (src[idx] * 0.299 + src[idx + 1] * 0.587 + src[idx + 2] * 0.114) / 255;

      // Displacement direction driven by per-column noise, not just luminance
      const disp = Math.round(lum * maxDisp * colNoise);
      const sampleY = Math.max(0, Math.min(h - 1, y - disp));

      const rY = Math.max(0, Math.min(h - 1, sampleY - chromaOffset));
      const bY = Math.max(0, Math.min(h - 1, sampleY + chromaOffset));

      const di = (y * w + x) * 4;
      dst[di]     = src[(rY * w + x) * 4];
      dst[di + 1] = src[(sampleY * w + x) * 4 + 1];
      dst[di + 2] = src[(bY * w + x) * 4 + 2];
      dst[di + 3] = 255;
    }
  }

  ctx.putImageData(output, 0, 0);
}

export default App;
