import React, { useState, useEffect, useRef, useCallback } from 'react';
import { projects, projectDetails } from './data/projects';
import { experience } from './data/experience';
import { capabilities } from './data/capabilities';
import { visualizations } from './visualizations';
import { SoundEngine } from './sound';

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

function SuctionHeadline({ scrollRef, glitchMode }) {
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
    if (window.innerWidth <= 768) return;

    // In glitch mode, clear per-letter styles so the parent melt can control opacity/blur
    if (glitchMode) {
      spansRef.current.forEach(span => {
        if (span) { span.style.transform = ''; span.style.opacity = ''; span.style.filter = ''; }
      });
      return;
    }

    function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

    function update(time) {
      const t = time * 0.001;
      const nav = h1.closest('.left-panel')?.querySelector('.nav');
      if (!nav) return;

      const navBottom = nav.getBoundingClientRect().bottom;
      const heroRect = h1.getBoundingClientRect();
      const earlyStart = 150;
      const scrollProgress = clamp((navBottom + earlyStart - heroRect.top) / (heroRect.height + earlyStart), 0, 1.2);

      for (let i = 0; i < spansRef.current.length; i++) {
        const span = spansRef.current[i];
        if (!span) continue;

        const threshold = i / totalChars;
        const localProgress = clamp((scrollProgress - threshold) / 0.12, 0, 1);

        if (localProgress > 0) {
          // Scroll suction
          const eased = localProgress * localProgress;
          const ty = -eased * 52;
          const sy = 1 - eased * 0.6;
          const blur = eased * 6;
          span.style.transform = `translateY(${ty}px) scaleY(${sy})`;
          span.style.opacity = 1 - eased;
          span.style.filter = `blur(${blur}px)`;
        } else {
          span.style.transform = '';
          span.style.opacity = '';
          span.style.filter = '';
        }
      }

      frameRef.current = requestAnimationFrame(update);
    }

    frameRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameRef.current);
  }, [scrollRef, totalChars, glitchMode]);

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

function DisengageButton({ onClick, onHover, projectId }) {
  const variant = useRef(Math.floor(Math.random() * DISENGAGE_ICONS.length)).current;
  const [idx, setIdx] = useState(variant);

  useEffect(() => {
    setIdx(Math.floor(Math.random() * DISENGAGE_ICONS.length));
  }, [projectId]);

  const Icon = DISENGAGE_ICONS[idx];

  return (
    <button className="project-close" onClick={onClick} onMouseEnter={onHover} aria-label="Close project">
      <Icon />
      <span className="project-close__label">{DISENGAGE_LABELS[idx]}</span>
    </button>
  );
}

// ========================
// FALLING NAME — letters drift down in glitch mode
// ========================

const NAME_TEXT = 'Kevin Boyle';

function FallingName({ active, onAllFallen, hovered }) {
  const spansRef = useRef([]);
  const physicsRef = useRef(null);
  const frameRef = useRef(null);
  const startTimeRef = useRef(null);
  const reportedRef = useRef(false);
  const hoverFrameRef = useRef(null);
  const hoverStartRef = useRef(null);

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
        delay: 300 + Math.random() * 1000,
        vx: Math.cos(angle) * force,
        vy: Math.sin(angle) * force,
        rotSpeed: (Math.random() - 0.5) * 8,
        friction: 0.97 + Math.random() * 0.02,
        x: 0, y: 0, rot: 0, falling: false,
        dissolveStart: 0, // timestamp when fling starts
        dissolveDuration: 400 + Math.random() * 500,
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

  // Hover dither pulse
  useEffect(() => {
    if (active || !hovered) {
      cancelAnimationFrame(hoverFrameRef.current);
      hoverStartRef.current = null;
      spansRef.current.forEach(span => {
        if (span) {
          span.style.maskImage = ''; span.style.webkitMaskImage = '';
          span.style.maskSize = ''; span.style.webkitMaskSize = '';
        }
      });
      return;
    }

    const phases = NAME_TEXT.split('').map((_, i) => i * 0.7 + Math.random() * 0.5);

    function animate(time) {
      if (!hoverStartRef.current) hoverStartRef.current = time;
      const t = (time - hoverStartRef.current) * 0.001;
      // Ramp intensity in over 0.3s
      const intensity = Math.min(t / 0.3, 1);

      spansRef.current.forEach((span, i) => {
        if (!span || span.textContent === '\u00A0') return;
        const wave = Math.sin(t * 2.5 + phases[i]) * 0.5 + 0.5;
        const dissolve = wave * 0.35 * intensity;
        const dotRadius = (1 - dissolve * 2) * 50;
        if (dissolve > 0.05) {
          const mask = `radial-gradient(circle, black ${dotRadius}%, transparent ${dotRadius}%)`;
          span.style.maskImage = mask;
          span.style.webkitMaskImage = mask;
          span.style.maskSize = '3px 3px';
          span.style.webkitMaskSize = '3px 3px';
        } else {
          span.style.maskImage = ''; span.style.webkitMaskImage = '';
          span.style.maskSize = ''; span.style.webkitMaskSize = '';
        }
      });
      hoverFrameRef.current = requestAnimationFrame(animate);
    }

    hoverFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(hoverFrameRef.current);
  }, [active, hovered]);

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

    // Phase 0: project index table dissolves first at 0.2-0.5s
    const tableEls = panel.querySelectorAll('.project-index, .project-row');
    const phase0 = Array.from(tableEls).map(el => ({
      el,
      delay: 200 + Math.random() * 300,
      duration: 800 + Math.random() * 600,
    }));

    // Phase 1: headings + hero headline dissolve at 0.4-1s
    const headingEls = panel.querySelectorAll('.hero-headline, .about-headline, .section-label, .hero-label__title, .hero-label__years');
    const phase1 = Array.from(headingEls).map(el => ({
      el,
      delay: 400 + Math.random() * 600,
      duration: 1000 + Math.random() * 600,
    }));

    // Phase 2: nav elements dissolve at 0.6-1.2s
    const navEls = panel.querySelectorAll('.nav__info, .nav__links');
    const phase2 = Array.from(navEls).map(el => ({
      el,
      delay: 600 + Math.random() * 600,
      duration: 800 + Math.random() * 400,
    }));

    // Phase 3: remaining body content dissolves at 0.8-1.5s
    const bodyEls = panel.querySelectorAll('.hero-label, .about-section, .capabilities-section, .experience-section, .left-footer');
    const phase3 = Array.from(bodyEls).map(el => ({
      el,
      delay: 800 + Math.random() * 700,
      duration: 800 + Math.random() * 600,
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

// ========================
// GLITCH CAPTURE GRID — surveillance screenshot gallery
// ========================

const CAPTURE_LABELS = [
  ...GLITCH_RANDOM,
  'SECTOR SCAN', 'FRAME LOCK', 'CAPTURE REF', 'REGION HOLD',
  'FIELD SAMPLE', 'NODE EXTRACT', 'SIGNAL GRAB', 'ZONE CLIP',
];

const GRID_COLS = 8;
const GRID_ROWS = 10;
function generateGridLayout() {
  const occupied = [];
  for (let r = 0; r < GRID_ROWS; r++) occupied.push(new Array(GRID_COLS).fill(false));
  const cells = [];

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (occupied[r][c]) continue;
      const options = [];
      const trySpan = (cs, rs, w) => {
        for (let dr = 0; dr < rs; dr++)
          for (let dc = 0; dc < cs; dc++)
            if (r + dr >= GRID_ROWS || c + dc >= GRID_COLS || occupied[r + dr][c + dc]) return;
        options.push({ cs, rs, w });
      };
      trySpan(1, 1, 12);
      trySpan(2, 1, 18);
      trySpan(1, 2, 12);
      trySpan(2, 2, 22);
      trySpan(3, 2, 10);
      trySpan(2, 3, 8);
      trySpan(3, 3, 5);
      if (!options.length) continue;

      const total = options.reduce((s, o) => s + o.w, 0);
      let roll = Math.random() * total;
      let chosen = options[0];
      for (const opt of options) { roll -= opt.w; if (roll <= 0) { chosen = opt; break; } }

      for (let dr = 0; dr < chosen.rs; dr++)
        for (let dc = 0; dc < chosen.cs; dc++)
          occupied[r + dr][c + dc] = true;
      cells.push({ col: c, row: r, cs: chosen.cs, rs: chosen.rs });
    }
  }
  return cells;
}

function CaptureTracker({ tracker }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const ac = (a) => `rgba(193,68,14,${a})`;
    const fontFam = "'ISO', monospace";
    const DURATION = 120;

    function draw() {
      ctx.clearRect(0, 0, w, h);
      if (!tracker) return;

      const { cropRect, cell, startTime } = tracker;
      const elapsed = performance.now() - startTime;
      const t = Math.min(1, elapsed / DURATION);

      // Source box position (left panel, CSS pixels)
      const sx = cropRect.x;
      const sy = cropRect.y;
      const sw = cropRect.w;
      const sh = cropRect.h;

      // Destination cell position (right panel)
      // The grid is inset 16px inside .capture-grid-wrapper which fills .right-panel (right half)
      const halfW = w / 2;
      const gridEl = document.querySelector('.capture-grid');
      let dx, dy, dw, dh;
      if (gridEl) {
        const gr = gridEl.getBoundingClientRect();
        const colW = gr.width / GRID_COLS;
        const rowH = gr.height / GRID_ROWS;
        dx = gr.left + cell.col * colW;
        dy = gr.top + cell.row * rowH;
        dw = cell.cs * colW;
        dh = cell.rs * rowH;
      } else {
        dx = halfW + 16 + (cell.col / GRID_COLS) * (halfW - 32);
        dy = 16 + (cell.row / GRID_ROWS) * (h - 32);
        dw = (cell.cs / GRID_COLS) * (halfW - 32);
        dh = (cell.rs / GRID_ROWS) * (h - 32);
      }

      // Source box — corner ticks
      ctx.strokeStyle = 'rgba(255, 60, 30, 0.9)';
      ctx.lineWidth = 1.5;
      const tk = 8;
      // Top-left
      ctx.beginPath(); ctx.moveTo(sx, sy + tk); ctx.lineTo(sx, sy); ctx.lineTo(sx + tk, sy); ctx.stroke();
      // Top-right
      ctx.beginPath(); ctx.moveTo(sx + sw - tk, sy); ctx.lineTo(sx + sw, sy); ctx.lineTo(sx + sw, sy + tk); ctx.stroke();
      // Bottom-right
      ctx.beginPath(); ctx.moveTo(sx + sw, sy + sh - tk); ctx.lineTo(sx + sw, sy + sh); ctx.lineTo(sx + sw - tk, sy + sh); ctx.stroke();
      // Bottom-left
      ctx.beginPath(); ctx.moveTo(sx + tk, sy + sh); ctx.lineTo(sx, sy + sh); ctx.lineTo(sx, sy + sh - tk); ctx.stroke();

      // Label
      ctx.font = `7px ${fontFam}`;
      ctx.fillStyle = 'rgba(255, 60, 30, 0.8)';
      ctx.textBaseline = 'bottom';
      ctx.textAlign = 'left';
      const coordLabel = `${String.fromCharCode(65 + cell.row)}${cell.col}`;
      ctx.fillText(`SAMPLE ${coordLabel}`, sx, sy - 2);

      // Connecting line — animate from source center to dest center
      const fromX = sx + sw / 2;
      const fromY = sy + sh / 2;
      const toX = dx + dw / 2;
      const toY = dy + dh / 2;
      const curX = fromX + (toX - fromX) * t;
      const curY = fromY + (toY - fromY) * t;

      ctx.strokeStyle = 'rgba(255, 60, 30, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(curX, curY);
      ctx.stroke();

      // Leading dot
      ctx.fillStyle = 'rgba(255, 60, 30, 0.9)';
      ctx.beginPath();
      ctx.arc(curX, curY, 3, 0, Math.PI * 2);
      ctx.fill();

      if (t < 1) {
        rafRef.current = requestAnimationFrame(draw);
      }
    }

    draw();
    if (tracker) rafRef.current = requestAnimationFrame(draw);

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [tracker]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10000 }}
    />
  );
}

function CaptureFrameOverlay() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const dpr = window.devicePixelRatio || 1;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const ac = (a) => `rgba(193,68,14,${a})`;
    const gc = (a) => `rgba(180,180,180,${a})`;
    const fontFam = "'ISO', monospace";

    // Inset margin — frame floats inside the panel
    const m = 16;
    const L = m, T = m, R = w - m, B = h - m;
    const fw = R - L, fh = B - T;

    // Outer border — thin
    ctx.strokeStyle = ac(0.15);
    ctx.lineWidth = 0.5;
    ctx.strokeRect(L + 0.5, T + 0.5, fw - 1, fh - 1);

    // Corner brackets — large L-shapes
    const bk = 28;
    ctx.strokeStyle = ac(0.45);
    ctx.lineWidth = 1;
    [[L, T, L + bk, T, L, T + bk], [R - bk, T, R, T, R, T + bk], [R, B - bk, R, B, R - bk, B], [L + bk, B, L, B, L, B - bk]].forEach(([x1, y1, cx, cy, x2, y2]) => {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(cx, cy); ctx.lineTo(x2, y2); ctx.stroke();
    });

    // Secondary inner brackets — smaller
    const bk2 = 12;
    const ins = 6;
    ctx.strokeStyle = ac(0.2);
    ctx.lineWidth = 0.5;
    [[L + ins, T + ins, L + ins + bk2, T + ins, L + ins, T + ins + bk2], [R - ins - bk2, T + ins, R - ins, T + ins, R - ins, T + ins + bk2],
     [R - ins, B - ins - bk2, R - ins, B - ins, R - ins - bk2, B - ins], [L + ins + bk2, B - ins, L + ins, B - ins, L + ins, B - ins - bk2]].forEach(([x1, y1, cx, cy, x2, y2]) => {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(cx, cy); ctx.lineTo(x2, y2); ctx.stroke();
    });

    // Tick marks along each edge
    ctx.strokeStyle = ac(0.2);
    ctx.lineWidth = 0.5;
    const tickL = 5;
    const tickS = 3;
    for (let i = 1; i < GRID_COLS; i++) {
      const x = L + (i / GRID_COLS) * fw;
      const major = i % 2 === 0;
      ctx.beginPath(); ctx.moveTo(x, T); ctx.lineTo(x, T + (major ? tickL : tickS)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, B); ctx.lineTo(x, B - (major ? tickL : tickS)); ctx.stroke();
    }
    for (let i = 1; i < GRID_ROWS; i++) {
      const y = T + (i / GRID_ROWS) * fh;
      const major = i % 2 === 0;
      ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(L + (major ? tickL : tickS), y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(R, y); ctx.lineTo(R - (major ? tickL : tickS), y); ctx.stroke();
    }

    // Crosshair indicators at mid-edges
    ctx.strokeStyle = ac(0.3);
    ctx.lineWidth = 0.5;
    const ch = 6;
    const mx = L + fw / 2, my = T + fh / 2;
    [[mx, T], [mx, B], [L, my], [R, my]].forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.moveTo(cx - ch, cy); ctx.lineTo(cx + ch, cy);
      ctx.moveTo(cx, cy - ch); ctx.lineTo(cx, cy + ch);
      ctx.stroke();
    });

    // Small reticle circles at quarter positions
    ctx.strokeStyle = gc(0.08);
    ctx.lineWidth = 0.5;
    [[L + fw * 0.25, T + fh * 0.25], [L + fw * 0.75, T + fh * 0.25], [L + fw * 0.75, T + fh * 0.75], [L + fw * 0.25, T + fh * 0.75]].forEach(([cx, cy]) => {
      ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 2, cy); ctx.lineTo(cx + 2, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - 2); ctx.lineTo(cx, cy + 2); ctx.stroke();
    });

    // Edge dashes — registration-mark style
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = ac(0.08);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(L + bk + 4, T); ctx.lineTo(R - bk - 4, T);
    ctx.moveTo(L + bk + 4, B); ctx.lineTo(R - bk - 4, B);
    ctx.moveTo(L, T + bk + 4); ctx.lineTo(L, B - bk - 4);
    ctx.moveTo(R, T + bk + 4); ctx.lineTo(R, B - bk - 4);
    ctx.stroke();
    ctx.setLineDash([]);

    // Technical labels
    ctx.font = `5px ${fontFam}`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillStyle = ac(0.35);
    ctx.fillText('CAPTURE GRID', L + bk + 4, T + 3);
    ctx.textAlign = 'right';
    ctx.fillText('ACTIVE', R - bk - 4, T + 3);
    ctx.textBaseline = 'bottom';
    ctx.fillText('SECTOR REF', R - bk - 4, B - 3);
    ctx.textAlign = 'left';
    ctx.fillText(`GRID ${GRID_COLS}\u00D7${GRID_ROWS}`, L + bk + 4, B - 3);

    // Numbered edge markers
    ctx.font = `4px ${fontFam}`;
    ctx.fillStyle = gc(0.12);
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    for (let i = 0; i < GRID_COLS; i++) {
      ctx.fillText(String(i), L + (i + 0.5) / GRID_COLS * fw, T + tickL + 1);
    }
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    for (let i = 0; i < GRID_ROWS; i++) {
      ctx.fillText(String.fromCharCode(65 + i), L + tickL + 1, T + (i + 0.5) / GRID_ROWS * fh);
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}
    />
  );
}

// Reusable composite canvas — avoids allocation per capture
let _compCanvas = null;
let _compCtx = null;

function grabFromCanvases() {
  const allCanvases = Array.from(document.querySelectorAll('canvas'));
  const halfW = window.innerWidth / 2;

  const sources = allCanvases.filter(c => {
    if (c.width === 0 || c.height === 0) return false;
    if (parseFloat(c.style.opacity || '1') < 0.05) return false;
    const r = c.getBoundingClientRect();
    return r.left < halfW && r.width > 10 && r.height > 10;
  });

  if (!sources.length) return null;

  const vw = Math.floor(halfW);
  const vh = window.innerHeight;

  if (!_compCanvas || _compCanvas.width !== vw || _compCanvas.height !== vh) {
    _compCanvas = document.createElement('canvas');
    _compCanvas.width = vw;
    _compCanvas.height = vh;
    _compCtx = _compCanvas.getContext('2d');
  }
  const ctx = _compCtx;
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, vw, vh);

  for (const src of sources) {
    const r = src.getBoundingClientRect();

    const dx = Math.max(0, Math.round(r.left));
    const dy = Math.max(0, Math.round(r.top));
    const dw = Math.min(Math.round(r.width), vw - dx);
    const dh = Math.min(Math.round(r.height), vh - dy);
    if (dw <= 0 || dh <= 0) continue;

    const sw = src.width * (dw / r.width);
    const sh = src.height * (dh / r.height);

    try {
      ctx.save();
      // Use 'lighter' for all sources — dark/black pixels add nothing,
      // bright pixels accumulate. Prevents opaque dark backgrounds on
      // one canvas from overwriting bright content from another.
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(src, 0, 0, sw, sh, dx, dy, dw, dh);
      ctx.restore();
    } catch (e) {
      ctx.restore();
    }
  }

  // Try up to 4 crops to find one with visual content
  for (let attempt = 0; attempt < 4; attempt++) {
    const maxW = Math.min(300, vw * 0.7);
    const maxH = Math.min(250, vh * 0.6);
    const cw = Math.floor(60 + Math.random() * (maxW - 60));
    const ch = Math.floor(50 + Math.random() * (maxH - 50));
    const cx = Math.floor(Math.random() * Math.max(1, vw - cw));
    const cy = Math.floor(Math.random() * Math.max(1, vh - ch));

    const crop = document.createElement('canvas');
    crop.width = cw;
    crop.height = ch;
    const cropCtx = crop.getContext('2d');
    cropCtx.drawImage(_compCanvas, cx, cy, cw, ch, 0, 0, cw, ch);

    try {
      const imgData = cropCtx.getImageData(0, 0, cw, ch);
      const d = imgData.data;
      let totalBright = 0;
      let samples = 0;
      for (let i = 0; i < d.length; i += 16) {
        totalBright += d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
        samples++;
      }
      const avgBright = totalBright / samples;
      // If any content or last attempt, apply aggressive boost
      if (avgBright > 2 || attempt === 3) {
        const boost = avgBright < 15 ? 6 + (15 - avgBright) * 1.5 : avgBright < 40 ? 3.5 : 1.5;
        const offset = avgBright < 10 ? 25 : avgBright < 25 ? 15 : 5;
        for (let i = 0; i < d.length; i += 4) {
          d[i]     = Math.min(255, (d[i] * boost + offset) | 0);
          d[i + 1] = Math.min(255, (d[i + 1] * boost + offset) | 0);
          d[i + 2] = Math.min(255, (d[i + 2] * boost + offset) | 0);
        }
        cropCtx.putImageData(imgData, 0, 0);
        return { dataUrl: crop.toDataURL('image/jpeg', 0.8), cropRect: { x: cx, y: cy, w: cw, h: ch } };
      }
    } catch (e) {
      return { dataUrl: crop.toDataURL('image/jpeg', 0.8), cropRect: { x: cx, y: cy, w: cw, h: ch } };
    }
  }
  return null;
}

function GlitchCaptureGrid() {
  const [phase, setPhase] = useState('capturing');
  const [captureCount, setCaptureCount] = useState(0);
  const layoutRef = useRef(null);
  const capturesRef = useRef([]);
  const timerRef = useRef(null);
  const fillTargetRef = useRef(0);
  const [tracker, setTracker] = useState(null); // active tracking line

  // Generate layout at start of each cycle
  if (!layoutRef.current) {
    const cells = generateGridLayout();
    layoutRef.current = cells.map(c => ({
      ...c,
      label: CAPTURE_LABELS[Math.floor(Math.random() * CAPTURE_LABELS.length)],
    }));
    capturesRef.current = [];
    // 40% chance full fill, otherwise 30-70% of cells
    fillTargetRef.current = Math.random() < 0.4
      ? cells.length
      : Math.floor(cells.length * (0.3 + Math.random() * 0.4));
  }

  // Capture loop
  useEffect(() => {
    if (phase !== 'capturing') return;
    let mounted = true;
    const target = fillTargetRef.current;

    function scheduleCapture() {
      const delay = 600 + Math.random() * 900;
      timerRef.current = setTimeout(() => {
        if (!mounted) return;
        if (capturesRef.current.length >= target) {
          setPhase('display');
          return;
        }
        const result = grabFromCanvases();
        if (result) {
          const cellIndex = capturesRef.current.length;
          const cell = layoutRef.current[cellIndex];
          capturesRef.current.push(result.dataUrl);

          // Start tracking line animation
          setTracker({ cropRect: result.cropRect, cell, startTime: performance.now() });

          // After line animation completes, place the clip and clear tracker
          setTimeout(() => {
            setCaptureCount(capturesRef.current.length);
            setTracker(null);
          }, 120);
        }
        scheduleCapture();
      }, delay);
    }

    scheduleCapture();
    return () => { mounted = false; if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase]);

  // Display for 3s → dither
  useEffect(() => {
    if (phase !== 'display') return;
    const t = setTimeout(() => setPhase('dither'), 3000);
    return () => clearTimeout(t);
  }, [phase]);

  // Dither for 3s → invert
  useEffect(() => {
    if (phase !== 'dither') return;
    const t = setTimeout(() => setPhase('invert'), 3000);
    return () => clearTimeout(t);
  }, [phase]);

  // Invert for 1s → strobe
  useEffect(() => {
    if (phase !== 'invert') return;
    const t = setTimeout(() => setPhase('strobe'), 1000);
    return () => clearTimeout(t);
  }, [phase]);

  // Strobe for 5s → dissolve
  useEffect(() => {
    if (phase !== 'strobe') return;
    const t = setTimeout(() => setPhase('dissolving'), 5000);
    return () => clearTimeout(t);
  }, [phase]);

  // Dissolve for 2s → restart
  useEffect(() => {
    if (phase !== 'dissolving') return;
    const t = setTimeout(() => {
      layoutRef.current = null;
      capturesRef.current = [];
      setCaptureCount(0);
      setPhase('capturing');
    }, 2000);
    return () => clearTimeout(t);
  }, [phase]);

  // Fade-in tracking
  const [visible, setVisible] = useState(new Set());
  useEffect(() => {
    const newIdxs = [];
    for (let i = 0; i < captureCount; i++) if (!visible.has(i)) newIdxs.push(i);
    if (newIdxs.length) {
      requestAnimationFrame(() => {
        setVisible(prev => {
          const next = new Set(prev);
          newIdxs.forEach(i => next.add(i));
          return next;
        });
      });
    }
    if (captureCount === 0 && visible.size > 0) setVisible(new Set());
  }, [captureCount]);

  const layout = layoutRef.current || [];
  const caps = capturesRef.current;

  return (
    <>
    <CaptureTracker tracker={tracker} />
    <div className={`capture-grid-wrapper${phase === 'dither' ? ' capture-grid--dither' : ''}${phase === 'invert' ? ' capture-grid--invert' : ''}${phase === 'strobe' ? ' capture-grid--strobe' : ''}${phase === 'dissolving' ? ' capture-grid--dissolving' : ''}`}>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="dither-filter" colorInterpolationFilters="sRGB">
            <feImage href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAJklEQVQYV2M8cODAf3d3dwYGBgYGRjjDHcZgBDOQaEYkGsxAogEA1BkP/1FvDNIAAAAASUVORK5CYII=" x="0" y="0" width="8" height="8" result="bayer" />
            <feTile in="bayer" result="pattern" />
            <feColorMatrix in="SourceGraphic" type="saturate" values="0" result="gray" />
            <feComponentTransfer in="gray" result="bright">
              <feFuncR type="linear" slope="1.2" intercept="0.05" />
              <feFuncG type="linear" slope="1.2" intercept="0.05" />
              <feFuncB type="linear" slope="1.2" intercept="0.05" />
            </feComponentTransfer>
            <feBlend in="bright" in2="pattern" mode="difference" result="mixed" />
            <feComponentTransfer in="mixed">
              <feFuncR type="discrete" tableValues="0 0.35 0.7 1" />
              <feFuncG type="discrete" tableValues="0 0.35 0.7 1" />
              <feFuncB type="discrete" tableValues="0 0.35 0.7 1" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      <CaptureFrameOverlay />
      <div className="capture-grid">
      {layout.slice(0, captureCount).map((cell, i) => (
        <div
          key={i}
          className={`capture-cell${visible.has(i) ? ' capture-cell--visible' : ''}${phase === 'dissolving' ? ' capture-cell--dissolving' : ''}`}
          style={{
            gridColumn: `${cell.col + 1} / span ${cell.cs}`,
            gridRow: `${cell.row + 1} / span ${cell.rs}`,
            transitionDelay: phase === 'dissolving' ? `${i * 30}ms` : '0ms',
          }}
        >
          <img src={caps[i]} alt="" />
          <span className="capture-cell__label">{cell.label}</span>
        </div>
      ))}
      </div>
    </div>
    </>
  );
}

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
    nextBurstRef.current = now + 500 + Math.random() * 1500;
    nextPhraseRef.current = now + 1500 + Math.random() * 2000;

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
            nextPhraseRef.current = now + 1500 + Math.random() * 2000;
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
            nextBurstRef.current = now + 300 + Math.random() * 1500;
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

    const ACCENT = '#7a2a08';
    const MID = '#444';
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

// ========================
// CDJ WAVEFORM — audio-visual instrument with synthesis control + vinyl scrub
// ========================
function GlitchWaveform() {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const interactRef = useRef({
    active: false,
    x: 0, y: 0,         // normalized 0-1
    prevX: 0, prevY: 0,
    velocity: 0,         // px/ms
    lastMoveTime: 0,
    lastGlitchTime: 0,
    // CDJ scrub state
    targetSample: 0,
    readHead: 0,
    stutterPhase: 0,
    // Saved synth values to restore on release
    savedParams: null,
    masterGainBefore: 0.14,
    // Interaction trail for visual feedback
    trail: [],
  });
  const scrubNodeRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const PANEL_H = 160;

    function resize() {
      const vw = Math.floor(window.innerWidth * 0.5);
      canvas.width = vw * dpr;
      canvas.height = PANEL_H * dpr;
      canvas.style.width = vw + 'px';
      canvas.style.height = PANEL_H + 'px';
    }
    resize();
    window.addEventListener('resize', resize);

    // Particle field — nodes representing synthesis voices
    const NUM_PARTICLES = 48;
    const particles = [];
    for (let i = 0; i < NUM_PARTICLES; i++) {
      const bx = (i + 0.5) / NUM_PARTICLES;
      particles.push({
        x: bx, y: 0.35 + Math.random() * 0.3,
        baseX: bx, baseY: 0.35 + Math.random() * 0.3,
        vx: 0, vy: 0,
        size: 1.5 + Math.random() * 1.5,
        energy: 0,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let scanX = 0;
    let prevTime = performance.now();

    // HUD helpers (glitch palette: light on dark)
    const hud = (alpha) => `rgba(255,255,255,${alpha})`;
    const accent = (alpha) => `rgba(193,68,14,${alpha})`;
    const font = (size) => `${size}px 'ISO', monospace`;

    function animate() {
      const now = performance.now();
      const dt = Math.min(32, now - prevTime);
      prevTime = now;
      const t = now * 0.001;
      const wf = window.__glitchWaveform;
      const ir = interactRef.current;

      const w = canvas.width;
      const h = canvas.height;

      // --- BACKGROUND (transparent — glitch overlay shows through) ---
      ctx.clearRect(0, 0, w, h);

      // Subtle grid
      ctx.strokeStyle = hud(0.03);
      ctx.lineWidth = 0.5 * dpr;
      for (let i = 1; i < 12; i++) {
        const gx = w * i / 12;
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
      }
      for (let i = 1; i < 4; i++) {
        const gy = h * i / 4;
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
      }

      // --- AUDIO DATA ---
      let bassE = 0, midE = 0, hiE = 0;
      if (wf && wf.freqSnapshots.length > 0) {
        const snap = wf.freqSnapshots[wf.freqSnapshots.length - 1];
        bassE = snap.bass / 255;
        midE = snap.mid / 255;
        hiE = snap.high / 255;
      }
      const totalE = bassE + midE + hiE;

      // --- SCAN LINE ---
      scanX = (scanX + dt * 0.0003) % 1;
      const sx = scanX * w;
      ctx.fillStyle = accent(0.06 + totalE * 0.04);
      ctx.fillRect(sx, 0, 2 * dpr, h);
      // Scan glow
      const scanGrad = ctx.createLinearGradient(sx - 30 * dpr, 0, sx + 30 * dpr, 0);
      scanGrad.addColorStop(0, 'rgba(193,68,14,0)');
      scanGrad.addColorStop(0.5, `rgba(193,68,14,${0.03 + totalE * 0.02})`);
      scanGrad.addColorStop(1, 'rgba(193,68,14,0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(sx - 30 * dpr, 0, 60 * dpr, h);

      // --- UPDATE PARTICLES ---
      const mx = ir.active ? ir.x : -1;
      const my = ir.active ? ir.y : -1;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        // Audio energy drives vertical displacement per frequency bin
        const binRatio = i / NUM_PARTICLES;
        let audioDisplace = 0;
        if (binRatio < 0.2) audioDisplace = bassE * 0.15;
        else if (binRatio < 0.6) audioDisplace = midE * 0.12;
        else audioDisplace = hiE * 0.1;

        // Breathe around base position
        const breathX = Math.sin(t * 0.7 + p.phase) * 0.008;
        const breathY = Math.cos(t * 0.5 + p.phase * 1.3) * 0.02 + audioDisplace * Math.sin(t * 2 + i);

        let targetX = p.baseX + breathX;
        let targetY = p.baseY + breathY;

        // Mouse gravity when interacting
        if (ir.active) {
          const dx = mx - p.x;
          const dy = my - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const radius = 0.15;
          if (dist < radius) {
            const force = (1 - dist / radius) * 0.4;
            // Attract particles toward cursor
            targetX = p.x + dx * force;
            targetY = p.y + dy * force;
            p.energy = Math.min(1, p.energy + 0.1);
          }
        }

        // Spring physics
        p.vx += (targetX - p.x) * 0.08;
        p.vy += (targetY - p.y) * 0.08;
        p.vx *= 0.85;
        p.vy *= 0.85;
        p.x += p.vx;
        p.y += p.vy;
        p.energy *= 0.95;

        // Audio energy per particle
        p.energy = Math.max(p.energy, audioDisplace * 2);
      }

      // --- CONNECTIONS ---
      const connDist = 0.07;
      ctx.lineWidth = 0.5 * dpr;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < connDist) {
            const alpha = (1 - d / connDist) * 0.12 * (1 + (a.energy + b.energy));
            ctx.strokeStyle = ir.active ? accent(alpha) : hud(alpha);
            ctx.beginPath();
            ctx.moveTo(a.x * w, a.y * h);
            ctx.lineTo(b.x * w, b.y * h);
            ctx.stroke();
          }
        }
      }

      // --- DRAW PARTICLES ---
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const px = p.x * w;
        const py = p.y * h;
        const binRatio = i / NUM_PARTICLES;
        const sz = (p.size + p.energy * 3) * dpr;

        // Color by frequency band
        let r, g, b2;
        if (binRatio < 0.2) { r = 80; g = 120; b2 = 200; }       // bass — blue
        else if (binRatio < 0.6) { r = 180; g = 180; b2 = 180; }  // mid — white
        else { r = 193; g = 68; b2 = 14; }                          // high — accent red
        const alpha = 0.3 + p.energy * 0.5;

        ctx.fillStyle = `rgba(${r},${g},${b2},${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, sz, 0, Math.PI * 2);
        ctx.fill();

        // Glow ring on energized particles
        if (p.energy > 0.2) {
          ctx.strokeStyle = `rgba(${r},${g},${b2},${p.energy * 0.3})`;
          ctx.lineWidth = 0.5 * dpr;
          ctx.beginPath();
          ctx.arc(px, py, sz + 3 * dpr, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // --- WAVEFORM TRACE (bottom edge) ---
      if (wf && wf.writePos > 1024) {
        const traceY = h * 0.85;
        const traceH = h * 0.1;
        ctx.strokeStyle = hud(0.12);
        ctx.lineWidth = 0.75 * dpr;
        ctx.beginPath();
        const traceCols = Math.floor(w / dpr);
        const samplesPerT = Math.floor(1024 * NUM_PARTICLES / traceCols);
        const traceStart = Math.max(0, wf.writePos - traceCols * samplesPerT);
        for (let i = 0; i < traceCols; i++) {
          const si = traceStart + i * samplesPerT;
          if (si >= wf.writePos) break;
          const s = wf.samples[si % wf.maxSamples];
          const px = i * dpr;
          const py = traceY + s * traceH;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // --- HUD OVERLAY ---
      // Corner brackets
      const bSz = 8 * dpr;
      const pad = 6 * dpr;
      ctx.strokeStyle = hud(ir.active ? 0.25 : 0.12);
      ctx.lineWidth = 0.75 * dpr;
      // TL
      ctx.beginPath(); ctx.moveTo(pad, pad + bSz); ctx.lineTo(pad, pad); ctx.lineTo(pad + bSz, pad); ctx.stroke();
      // TR
      ctx.beginPath(); ctx.moveTo(w - pad - bSz, pad); ctx.lineTo(w - pad, pad); ctx.lineTo(w - pad, pad + bSz); ctx.stroke();
      // BL
      ctx.beginPath(); ctx.moveTo(pad, h - pad - bSz); ctx.lineTo(pad, h - pad); ctx.lineTo(pad + bSz, h - pad); ctx.stroke();
      // BR
      ctx.beginPath(); ctx.moveTo(w - pad - bSz, h - pad); ctx.lineTo(w - pad, h - pad); ctx.lineTo(w - pad, h - pad - bSz); ctx.stroke();

      // Labels
      ctx.font = font(7 * dpr);
      ctx.fillStyle = hud(0.2);
      ctx.fillText('SYNTHESIS CONTROL', pad + 2 * dpr, pad + bSz + 10 * dpr);

      // Timecode
      const mins = Math.floor(t / 60).toString().padStart(2, '0');
      const secs = Math.floor(t % 60).toString().padStart(2, '0');
      const frames = Math.floor((t * 24) % 24).toString().padStart(2, '0');
      ctx.fillStyle = hud(0.15);
      ctx.fillText(`${mins}:${secs}:${frames}`, w - pad - 50 * dpr, pad + bSz + 10 * dpr);

      // Audio levels
      ctx.fillStyle = hud(0.15);
      ctx.fillText(`BASS ${(bassE * 100).toFixed(0).padStart(3)}`, pad + 2 * dpr, h - pad - 20 * dpr);
      ctx.fillText(`MID  ${(midE * 100).toFixed(0).padStart(3)}`, pad + 55 * dpr, h - pad - 20 * dpr);
      ctx.fillText(`HIGH ${(hiE * 100).toFixed(0).padStart(3)}`, pad + 108 * dpr, h - pad - 20 * dpr);

      // Level bars
      const barY = h - pad - 8 * dpr;
      const barH = 3 * dpr;
      const barW = 40 * dpr;
      [[pad + 2 * dpr, bassE, '80,120,200'], [pad + 55 * dpr, midE, '180,180,180'], [pad + 108 * dpr, hiE, '193,68,14']].forEach(([bx, val, col]) => {
        ctx.fillStyle = hud(0.06);
        ctx.fillRect(bx, barY, barW, barH);
        ctx.fillStyle = `rgba(${col},${0.3 + val * 0.4})`;
        ctx.fillRect(bx, barY, barW * Math.min(1, val), barH);
      });

      // --- INTERACTION HUD ---
      if (ir.active) {
        const ix = ir.x * w;
        const iy = ir.y * h;

        // Crosshair
        ctx.strokeStyle = hud(0.35);
        ctx.lineWidth = 0.75 * dpr;
        const chSz = 12 * dpr;
        ctx.beginPath();
        ctx.moveTo(ix - chSz, iy); ctx.lineTo(ix - 3 * dpr, iy);
        ctx.moveTo(ix + 3 * dpr, iy); ctx.lineTo(ix + chSz, iy);
        ctx.moveTo(ix, iy - chSz); ctx.lineTo(ix, iy - 3 * dpr);
        ctx.moveTo(ix, iy + 3 * dpr); ctx.lineTo(ix, iy + chSz);
        ctx.stroke();

        // Crosshair rings
        ctx.strokeStyle = hud(0.08);
        ctx.beginPath(); ctx.arc(ix, iy, 20 * dpr, 0, Math.PI * 2); ctx.stroke();
        // Rotating arc
        ctx.strokeStyle = accent(0.2);
        ctx.beginPath(); ctx.arc(ix, iy, 28 * dpr, t * 2 % (Math.PI * 2), (t * 2 + 1.2) % (Math.PI * 2)); ctx.stroke();

        // Parameter readout near cursor
        ctx.font = font(6 * dpr);
        ctx.fillStyle = hud(0.4);
        const lx = ix + 18 * dpr;
        const ly = iy - 12 * dpr;
        // X maps to filter freq
        const freqVal = 200 * Math.pow(40, ir.x);
        ctx.fillText(`FREQ ${Math.floor(freqVal)}Hz`, lx, ly);
        // Y maps to Q
        const qVal = 5 + (1 - ir.y) * 40;
        ctx.fillText(`Q ${qVal.toFixed(1)}`, lx, ly + 9 * dpr);
        ctx.fillText(`VEL ${ir.velocity.toFixed(1)}`, lx, ly + 18 * dpr);

        // Interaction trail
        ir.trail.push({ x: ix, y: iy, t: now, v: ir.velocity });
        while (ir.trail.length > 0 && now - ir.trail[0].t > 400) ir.trail.shift();
        for (let i = 0; i < ir.trail.length; i++) {
          const pt = ir.trail[i];
          const age = (now - pt.t) / 400;
          ctx.fillStyle = accent(Math.max(0, (1 - age) * 0.25));
          const sz = (1 + pt.v * 0.015) * dpr;
          ctx.fillRect(pt.x - sz, pt.y - sz, sz * 2, sz * 2);
        }

        // Dashed guide lines to edges
        ctx.setLineDash([3 * dpr, 4 * dpr]);
        ctx.strokeStyle = hud(0.04);
        ctx.beginPath(); ctx.moveTo(ix, 0); ctx.lineTo(ix, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, iy); ctx.lineTo(w, iy); ctx.stroke();
        ctx.setLineDash([]);

        // Read head indicator on waveform trace
        const totalRec = Math.min(wf ? wf.writePos : 0, wf ? wf.maxSamples : 0);
        if (totalRec > 0) {
          const rhRatio = ir.readHead / totalRec;
          const rhx = Math.max(0, Math.min(rhRatio * w, w));
          ctx.fillStyle = accent(0.4);
          ctx.fillRect(rhx - 0.5 * dpr, h * 0.78, 1 * dpr, h * 0.2);
        }
      }

      // Blinking rec dot
      if (Math.sin(t * 3) > 0) {
        ctx.fillStyle = accent(0.5);
        ctx.beginPath(); ctx.arc(w - pad - 8 * dpr, h - pad - 20 * dpr, 2 * dpr, 0, Math.PI * 2); ctx.fill();
      }
      ctx.font = font(6 * dpr);
      ctx.fillStyle = hud(0.2);
      ctx.fillText('REC', w - pad - 22 * dpr, h - pad - 17 * dpr);

      // Top/bottom accent lines
      ctx.fillStyle = accent(ir.active ? 0.4 : 0.2);
      ctx.fillRect(0, 0, w, 1);
      ctx.fillRect(0, h - 1, w, 1);

      frameRef.current = requestAnimationFrame(animate);
    }
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Map interaction to synthesis parameters
  const modulateSynth = (x, y, velocity) => {
    const synth = window.__glitchSynth;
    if (!synth) return;
    const t = synth.audioCtx.currentTime;
    const ramp = 0.03; // 30ms ramp for smooth control

    // X axis: filter frequency sweep (low left → high right)
    // Noise filter: 200Hz – 8000Hz (exponential)
    const noiseFreq = 200 * Math.pow(40, x);
    synth.noiseFilter.frequency.linearRampToValueAtTime(noiseFreq, t + ramp);
    // Sub filter opens with X too: 60Hz – 400Hz
    const subFreq = 60 + x * 340;
    synth.subFilter.frequency.linearRampToValueAtTime(subFreq, t + ramp);

    // Y axis: timbre — top (y=0) = bright/harsh, bottom (y=1) = dark/sub
    // Noise filter Q: high at top for screaming resonance
    const noiseQ = 5 + (1 - y) * 40;
    synth.noiseFilter.Q.linearRampToValueAtTime(noiseQ, t + ramp);
    // Mid gain: louder at top
    synth.midGain.gain.linearRampToValueAtTime(0.02 + (1 - y) * 0.14, t + ramp);
    // Hi gain: louder at top
    synth.hiGain.gain.linearRampToValueAtTime(0.005 + (1 - y) * 0.04, t + ramp);
    // Noise gain: louder at top
    synth.noiseGain.gain.linearRampToValueAtTime(0.1 + (1 - y) * 0.25, t + ramp);
    // Sub gain: louder at bottom
    synth.subGain.gain.linearRampToValueAtTime(0.15 + y * 0.3, t + ramp);
    // Ring mod: more present in the middle
    const ringAmt = Math.sin(y * Math.PI) * 0.08;
    synth.ringOut.gain.linearRampToValueAtTime(ringAmt, t + ramp);

    // Velocity triggers glitch events
    if (velocity > 8) {
      const now = performance.now();
      const ir = interactRef.current;
      if (now - ir.lastGlitchTime > 80) {
        ir.lastGlitchTime = now;
        if (velocity > 25) {
          synth.fireBlast();
          synth.fireKick();
        } else if (velocity > 15) {
          synth.fireStutter();
        } else {
          synth.fireGlitch();
        }
      }
    }
  };

  // Save current synth param values to restore on release
  const saveParams = () => {
    const synth = window.__glitchSynth;
    if (!synth) return null;
    return {
      noiseFreq: synth.noiseFilter.frequency.value,
      noiseQ: synth.noiseFilter.Q.value,
      subFreq: synth.subFilter.frequency.value,
      midGain: synth.midGain.gain.value,
      hiGain: synth.hiGain.gain.value,
      noiseGain: synth.noiseGain.gain.value,
      subGain: synth.subGain.gain.value,
      ringOut: synth.ringOut.gain.value,
    };
  };

  // Restore synth params with smooth ramp
  const restoreParams = (saved) => {
    const synth = window.__glitchSynth;
    if (!synth || !saved) return;
    const t = synth.audioCtx.currentTime;
    const ramp = 0.3; // 300ms ease back
    synth.noiseFilter.frequency.linearRampToValueAtTime(saved.noiseFreq, t + ramp);
    synth.noiseFilter.Q.linearRampToValueAtTime(saved.noiseQ, t + ramp);
    synth.subFilter.frequency.linearRampToValueAtTime(saved.subFreq, t + ramp);
    synth.midGain.gain.linearRampToValueAtTime(saved.midGain, t + ramp);
    synth.hiGain.gain.linearRampToValueAtTime(saved.hiGain, t + ramp);
    synth.noiseGain.gain.linearRampToValueAtTime(saved.noiseGain, t + ramp);
    synth.subGain.gain.linearRampToValueAtTime(saved.subGain, t + ramp);
    synth.ringOut.gain.linearRampToValueAtTime(saved.ringOut, t + ramp);
  };

  const startInteract = (e) => {
    e.stopPropagation();
    const audioCtx = window.__glitchAudioCtx;
    const wf = window.__glitchWaveform;
    if (!audioCtx || !wf || wf.writePos === 0) return;

    const ir = interactRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    ir.active = true;
    ir.x = x; ir.y = y;
    ir.prevX = x; ir.prevY = y;
    ir.velocity = 0;
    ir.lastMoveTime = performance.now();
    ir.stutterPhase = 0;
    ir.trail = [];
    ir.lastGlitchTime = 0;

    // Save current synth state and duck live audio
    ir.savedParams = saveParams();
    const master = window.__glitchMaster;
    if (master) {
      ir.masterGainBefore = master.gain.value;
      master.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.05);
    }

    // Compute scrub position
    const totalRecorded = Math.min(wf.writePos, wf.maxSamples);
    const samplePos = Math.floor(x * totalRecorded);
    ir.targetSample = samplePos;
    ir.readHead = samplePos;

    // Apply initial synth modulation
    modulateSynth(x, y, 0);

    // Create scrub output node for vinyl playback
    const scrubNode = audioCtx.createScriptProcessor(1024, 0, 1);
    const scrubGain = audioCtx.createGain();
    scrubGain.gain.value = 1.0;

    scrubNode.onaudioprocess = (evt) => {
      const output = evt.outputBuffer.getChannelData(0);
      const w = window.__glitchWaveform;
      if (!w || !ir.active) { output.fill(0); return; }

      const total = Math.min(w.writePos, w.maxSamples);
      if (total === 0) { output.fill(0); return; }

      // Read sample from circular buffer by absolute position
      const getSample = (absIdx) => {
        const clamped = Math.max(0, Math.min(absIdx, total - 1));
        // Oldest sample in buffer is at writePos % maxSamples
        // Map absolute index [0..total-1] to circular buffer position
        const oldest = w.writePos > w.maxSamples ? (w.writePos % w.maxSamples) : 0;
        return w.samples[(oldest + clamped) % w.maxSamples];
      };

      const now = performance.now();
      const timeSinceMove = now - ir.lastMoveTime;
      const isMoving = timeSinceMove < 100;
      const diff = ir.targetSample - ir.readHead;

      if (isMoving && Math.abs(diff) > 50) {
        // Dragging — play toward target (forward or reverse)
        const step = diff / output.length;
        const clampedStep = Math.sign(step) * Math.min(Math.abs(step), 4);
        for (let i = 0; i < output.length; i++) {
          output[i] = getSample(Math.floor(ir.readHead));
          ir.readHead += clampedStep;
        }
        ir.stutterPhase = 0;
      } else {
        // Stationary — DAW-style loop (~500ms centered on target)
        const loopLen = Math.floor(w.sampleRate * 0.5);
        const halfLoop = Math.floor(loopLen / 2);
        const loopStart = Math.max(0, ir.targetSample - halfLoop);
        const fadeLen = Math.floor(w.sampleRate * 0.008); // 8ms crossfade
        for (let i = 0; i < output.length; i++) {
          const phase = ir.stutterPhase % loopLen;
          let gain = 1;
          if (phase < fadeLen) gain = phase / fadeLen;
          else if (phase > loopLen - fadeLen) gain = (loopLen - phase) / fadeLen;
          output[i] = getSample(loopStart + phase) * gain;
          ir.stutterPhase++;
        }
        ir.readHead = ir.targetSample;
      }
    };

    scrubNode.connect(scrubGain);
    scrubGain.connect(audioCtx.destination);
    scrubNodeRef.current = { node: scrubNode, gain: scrubGain };
  };

  const moveInteract = (e) => {
    const ir = interactRef.current;
    if (!ir.active) return;
    const wf = window.__glitchWaveform;
    if (!wf || wf.writePos === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const now = performance.now();
    const dt = Math.max(1, now - ir.lastMoveTime);

    // Velocity in normalized units per ms → scale to usable range
    const dx = x - ir.prevX;
    const dy = y - ir.prevY;
    const dist = Math.sqrt(dx * dx + dy * dy) * rect.width; // px
    ir.velocity = dist / dt * 16; // scale for sensitivity

    ir.prevX = ir.x;
    ir.prevY = ir.y;
    ir.x = x;
    ir.y = y;
    ir.lastMoveTime = now;

    // Update scrub target
    const totalRecorded = Math.min(wf.writePos, wf.maxSamples);
    ir.targetSample = Math.floor(x * totalRecorded);

    // Modulate synthesis in real-time
    modulateSynth(x, y, ir.velocity);
  };

  const endInteract = () => {
    const ir = interactRef.current;
    if (!ir.active) return;
    ir.active = false;
    ir.trail = [];

    // Disconnect scrub node
    if (scrubNodeRef.current) {
      try { scrubNodeRef.current.node.disconnect(); } catch (ex) { /* noop */ }
      try { scrubNodeRef.current.gain.disconnect(); } catch (ex) { /* noop */ }
      scrubNodeRef.current = null;
    }

    // Restore live audio and synth parameters
    const audioCtx = window.__glitchAudioCtx;
    const master = window.__glitchMaster;
    if (audioCtx && master) {
      master.gain.linearRampToValueAtTime(ir.masterGainBefore || 0.14, audioCtx.currentTime + 0.15);
    }
    restoreParams(ir.savedParams);
    ir.savedParams = null;
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startInteract}
      onMouseMove={moveInteract}
      onMouseUp={endInteract}
      onMouseLeave={endInteract}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '50vw',
        height: '160px',
        cursor: 'crosshair',
        zIndex: 10001,
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
    window.__glitchMaster = master;
    master.connect(analyser);
    analyser.connect(audioCtx.destination);

    // --- CDJ WAVEFORM RECORDER — capture audio for waveform display + scrub ---
    const recorderNode = audioCtx.createScriptProcessor(2048, 1, 1);
    const maxRecordSamples = audioCtx.sampleRate * 120; // 2 min buffer
    if (!window.__glitchWaveform || window.__glitchWaveform.sampleRate !== audioCtx.sampleRate) {
      window.__glitchWaveform = {
        samples: new Float32Array(maxRecordSamples),
        writePos: 0,
        maxSamples: maxRecordSamples,
        sampleRate: audioCtx.sampleRate,
        freqSnapshots: [],
      };
    }
    recorderNode.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const wf = window.__glitchWaveform;
      if (!wf) return;
      for (let i = 0; i < input.length; i++) {
        wf.samples[wf.writePos % wf.maxSamples] = input[i];
        wf.writePos++;
      }
      // Snapshot frequency data for CDJ coloring
      analyser.getByteFrequencyData(freqData);
      const bins = freqData.length;
      let bass = 0, mid = 0, high = 0;
      const bassEnd = Math.floor(bins * 0.12);
      const midEnd = Math.floor(bins * 0.45);
      for (let i = 0; i < bins; i++) {
        if (i < bassEnd) bass += freqData[i];
        else if (i < midEnd) mid += freqData[i];
        else high += freqData[i];
      }
      wf.freqSnapshots.push({
        bass: bass / bassEnd,
        mid: mid / (midEnd - bassEnd),
        high: high / (bins - midEnd),
      });
    };
    const recorderSilence = audioCtx.createGain();
    recorderSilence.gain.value = 0;
    analyser.connect(recorderNode);
    recorderNode.connect(recorderSilence);
    recorderSilence.connect(audioCtx.destination);

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
    noiseFilter.Q.value = 45;
    // Distort the noise — hard clip for abrasive bite
    const noiseDist = audioCtx.createWaveShaper();
    const noiseDistCurve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      noiseDistCurve[i] = Math.tanh(x * 6);
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
      stutterDistCurve[i] = Math.tanh(x * 8);
    }
    stutterDist.curve = stutterDistCurve;
    stutterGain.connect(stutterDist);
    stutterDist.connect(master);

    function fireStutterBurst() {
      const t = audioCtx.currentTime;
      const sr = audioCtx.sampleRate;
      // Generate a tiny grain (0.5-6ms) — very short for snappy transients
      const grainLen = Math.floor(sr * (0.0005 + Math.random() * 0.0055));
      const grain = audioCtx.createBuffer(1, grainLen, sr);
      const gd = grain.getChannelData(0);
      // Random grain source: noise, sine, or square
      const grainType = Math.random();
      if (grainType < 0.5) {
        // Noise grain — most common for abrasive texture
        for (let i = 0; i < grainLen; i++) gd[i] = (Math.random() * 2 - 1);
      } else if (grainType < 0.75) {
        // Square pulse grain — hard edges
        const f = 80 + Math.random() * 600;
        for (let i = 0; i < grainLen; i++) gd[i] = (Math.sin(2 * Math.PI * f * i / sr) > 0 ? 1 : -1);
      } else {
        // DC click — maximum snap
        gd[0] = 1; if (grainLen > 1) gd[1] = -1;
        for (let i = 2; i < grainLen; i++) gd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (grainLen * 0.15));
      }

      // Fire a burst of 6-30 rapid repetitions
      const reps = 6 + Math.floor(Math.random() * 24);
      const gap = 0.002 + Math.random() * 0.015; // 2-17ms between reps — tighter
      for (let r = 0; r < reps; r++) {
        const src = audioCtx.createBufferSource();
        src.buffer = grain;
        src.playbackRate.value = 0.8 + Math.random() * 3;
        const env = audioCtx.createGain();
        // Hard attack, instant decay — no tail
        const hitGain = r === 0 || Math.random() < 0.35 ? 1.0 : 0.5 + Math.random() * 0.5;
        env.gain.setValueAtTime(hitGain, t + r * gap);
        env.gain.exponentialRampToValueAtTime(0.001, t + r * gap + grainLen / sr + 0.003);
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
    blastFilter.frequency.value = 1200;
    blastFilter.Q.value = 6;
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
      // Duration: 10ms to 150ms — short and snappy
      const dur = 0.01 + Math.random() * 0.14;
      const len = Math.floor(sr * dur);
      const buf = audioCtx.createBuffer(1, len, sr);
      const data = buf.getChannelData(0);

      const blastType = Math.random();
      if (blastType < 0.35) {
        // Pure white noise blast
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1);
      } else if (blastType < 0.6) {
        // Gated noise — staccato chops
        const gateLen = Math.floor(sr * (0.003 + Math.random() * 0.008));
        for (let i = 0; i < len; i++) {
          data[i] = (i % (gateLen * 2) < gateLen) ? (Math.random() * 2 - 1) : 0;
        }
      } else if (blastType < 0.8) {
        // Noise with fast descending sweep
        for (let i = 0; i < len; i++) {
          const pos = i / len;
          const cutoff = 1 - pos * 0.95;
          const raw = Math.random() * 2 - 1;
          data[i] = i === 0 ? raw * cutoff : data[i - 1] + cutoff * (raw - data[i - 1]);
        }
      } else {
        // Crunch burst — harsh bit-reduced noise
        const bits = 1 + Math.floor(Math.random() * 2);
        const levels = Math.pow(2, bits);
        for (let i = 0; i < len; i++) {
          data[i] = Math.round((Math.random() * 2 - 1) * levels) / levels;
        }
      }

      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = 0.8 + Math.random() * 3;
      const env = audioCtx.createGain();
      // Instant attack, exponential decay — snappy
      env.gain.setValueAtTime(1.0, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + dur);
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

    // Expose synthesis nodes for instrument interaction
    window.__glitchSynth = {
      noiseFilter, noiseGain, subFilter, subGain,
      midGain, midFilter, hiGain, ringOut,
      glitchGain, master, audioCtx,
      // For triggering glitch events from interaction
      fireGlitch: () => { if (alive) scheduleGlitch(); },
      fireStutter: () => { if (alive) fireStutterBurst(); },
      fireKick: () => { if (alive) fire808Kick(); },
      fireBlast: () => { if (alive) fireNoiseBlast(); },
    };

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

    // Preload portrait for dithered flash effect
    const portraitImg = new Image();
    portraitImg.crossOrigin = 'anonymous';
    let portraitReady = false;
    let portraitCanvas = null;
    portraitImg.onload = () => {
      // Pre-render dithered version to an offscreen canvas — fill canvas height
      const pc = document.createElement('canvas');
      const pScale = h / portraitImg.height;
      const pw = Math.floor(portraitImg.width * pScale);
      const ph = h;
      pc.width = pw;
      pc.height = ph;
      const pctx = pc.getContext('2d', { willReadFrequently: true });
      pctx.drawImage(portraitImg, 0, 0, pw, ph);
      const pid = pctx.getImageData(0, 0, pw, ph);
      const pp = pid.data;
      // Apply 8x8 Bayer dither
      const bayer = [
         0,32, 8,40, 2,34,10,42, 48,16,56,24,50,18,58,26,
        12,44, 4,36,14,46, 6,38, 60,28,52,20,62,30,54,22,
         3,35,11,43, 1,33, 9,41, 51,19,59,27,49,17,57,25,
        15,47, 7,39,13,45, 5,37, 63,31,55,23,61,29,53,21,
      ];
      for (let i = 0; i < pp.length; i += 4) {
        const px2 = (i / 4) % pw;
        const py2 = Math.floor((i / 4) / pw);
        const lum = pp[i] * 0.299 + pp[i + 1] * 0.587 + pp[i + 2] * 0.114;
        const threshold = (bayer[(py2 & 7) * 8 + (px2 & 7)] / 63) * 255 * 0.7;
        const val = lum > threshold ? Math.min(255, lum * 1.1) : lum * 0.25;
        pp[i] = val; pp[i + 1] = val; pp[i + 2] = val;
      }
      pctx.putImageData(pid, 0, 0);
      portraitCanvas = pc;
      portraitReady = true;
    };
    portraitImg.src = '/images/portrait-glitch.jpg';
    let nextPortraitFlash = 15000 + Math.random() * 20000; // first flash after 15-35s
    let portraitFlashUntil = 0;

    // --- EFFECT SCHEDULER: staggered temporal variation ---
    // Each effect has independent on/off windows. Max ~2-3 concurrent.
    const effectSlots = {
      videoDropout:   { active: false, nextToggle: 0, onMin: 3000, onMax: 8000,  offMin: 6000,  offMax: 15000, firing: false, fireUntil: 0 },
      organicDisp:    { active: false, nextToggle: 0, onMin: 4000, onMax: 10000, offMin: 5000,  offMax: 12000, firing: false, fireUntil: 0 },
      vertexTrails:   { active: false, nextToggle: 0, onMin: 2000, onMax: 6000,  offMin: 12000, offMax: 25000, firing: false, fireUntil: 0 },
      lissajous:      { active: false, nextToggle: 0, onMin: 5000, onMax: 12000, offMin: 5000,  offMax: 12000, firing: false, fireUntil: 0 },
      slitScan:       { active: false, nextToggle: 0, onMin: 4000, onMax: 10000, offMin: 5000,  offMax: 12000, firing: false, fireUntil: 0 },
      feedbackMirror: { active: false, nextToggle: 0, onMin: 4000, onMax: 10000, offMin: 6000,  offMax: 15000, firing: false, fireUntil: 0 },
      radialPulse:    { active: false, nextToggle: 0, onMin: 5000, onMax: 12000, offMin: 5000,  offMax: 12000, firing: false, fireUntil: 0 },
      datamosh:       { active: false, nextToggle: 0, onMin: 4000, onMax: 10000, offMin: 5000,  offMax: 12000, firing: false, fireUntil: 0 },
      blobTracking:   { active: false, nextToggle: 0, onMin: 5000, onMax: 12000, offMin: 6000,  offMax: 15000, firing: false, fireUntil: 0 },
      asciiBlowout:   { active: false, nextToggle: 0, onMin: 4000, onMax: 10000, offMin: 5000,  offMax: 14000, firing: false, fireUntil: 0 },
      bayerDither:    { active: false, nextToggle: 0, onMin: 3000, onMax: 8000,  offMin: 8000,  offMax: 18000, firing: false, fireUntil: 0 },
    };
    // Helper: check if an effect should render this frame (sustain-based, not per-frame dice)
    // Global cap: only 1-2 effects visually firing at any time
    const MAX_FIRING = 2;
    function countFiring() {
      return slotKeys.filter(k => effectSlots[k].firing && performance.now() < effectSlots[k].fireUntil).length;
    }
    function shouldFire(slot, chance, time, sustainMin, sustainMax) {
      // Already sustaining — keep going
      if (slot.firing && time < slot.fireUntil) return true;
      // Sustain expired — stop
      if (slot.firing) { slot.firing = false; return false; }
      // Too many already firing — skip
      if (countFiring() >= MAX_FIRING) return false;
      // Roll the dice
      if (Math.random() < chance) {
        slot.firing = true;
        slot.fireUntil = time + sustainMin + Math.random() * (sustainMax - sustainMin);
        return true;
      }
      return false;
    }
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
          } else if (activeCount < 2 || Math.random() < 0.05) {
            // Turn on — allow up to ~2 concurrent, rarely more
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

      // Re-seed with organic particles — keep canvas alive (more aggressive when dither active)
      const reseedChance = effectSlots.bayerDither.active ? 0.12 : 0.05;
      if (bassEnergy > 0.4 || Math.random() < reseedChance) {
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
      if (effectSlots.organicDisp.active && shouldFire(effectSlots.organicDisp, 0.03, time, 800, 2500)) {
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
      if (effectSlots.vertexTrails.active && midEnergy > 0.35 && shouldFire(effectSlots.vertexTrails, 0.2, time, 1000, 3000)) {
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

      // --- FILM GRAIN / ANALOG NOISE — sparse, audio-reactive bursts ---
      if (Math.random() < 0.15 + bassEnergy * 0.15) {
        ctx.save();
        const grainIntensity = 0.03 + bassEnergy * 0.04;
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
      }

      // --- LISSAJOUS FIGURES — oscilloscope-style parametric curves ---
      if (effectSlots.lissajous.active && shouldFire(effectSlots.lissajous, 0.06, time, 1500, 4000)) {
        ctx.save();
        const invertLiss = ['exclusion', 'difference'].includes(blendRef.current);
        ctx.globalAlpha = invertLiss ? 0.25 : 0.06;
        const isAccentL = Math.random() < 0.15;
        ctx.strokeStyle = isAccentL
          ? (invertLiss ? '#8a2e08' : '#4a1906')
          : (invertLiss ? '#999' : '#111');
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
      if (effectSlots.slitScan.active && shouldFire(effectSlots.slitScan, 0.04, time, 1000, 3000)) {
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
      if (effectSlots.feedbackMirror.active && shouldFire(effectSlots.feedbackMirror, 0.03, time, 1200, 3500)) {
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
      if (effectSlots.radialPulse.active && bassEnergy > 0.3 && shouldFire(effectSlots.radialPulse, 0.08, time, 1500, 4000)) {
        ctx.save();
        const invertRad = ['exclusion', 'difference'].includes(blendRef.current);
        ctx.globalAlpha = invertRad ? 0.15 : 0.04;
        const pcx = Math.random() * w;
        const pcy = Math.random() * h;
        const rings = 3 + Math.floor(Math.random() * 6);
        ctx.strokeStyle = Math.random() < 0.2
          ? (invertRad ? '#8a2e08' : '#3a1204')
          : (invertRad ? '#999' : '#111');
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
      if (effectSlots.datamosh.active && shouldFire(effectSlots.datamosh, 0.04, time, 800, 2500)) {
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
      if (effectSlots.blobTracking.active && shouldFire(effectSlots.blobTracking, 0.04, time, 1000, 3000)) {
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
      if (effectSlots.asciiBlowout.active && shouldFire(effectSlots.asciiBlowout, 0.04, time, 1000, 3000)) {
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

      // --- BAYER DITHER — ordered dithering like TouchDesigner Dither TOP ---
      if (effectSlots.bayerDither.active && shouldFire(effectSlots.bayerDither, 0.08, time, 1500, 4000)) {
        try {
          const ditherData = ctx.getImageData(0, 0, w, h);
          const dd = ditherData.data;
          // 8x8 Bayer matrix (normalized to 0-63)
          const bayer8 = [
             0,32, 8,40, 2,34,10,42,
            48,16,56,24,50,18,58,26,
            12,44, 4,36,14,46, 6,38,
            60,28,52,20,62,30,54,22,
             3,35,11,43, 1,33, 9,41,
            51,19,59,27,49,17,57,25,
            15,47, 7,39,13,45, 5,37,
            63,31,55,23,61,29,53,21,
          ];
          // Audio-reactive: bass pushes toward coarser quantization
          const ditherScale = 0.6 + bassEnergy * 0.4;
          const step = w > 400 ? 2 : 1;
          for (let dy = 0; dy < h; dy += step) {
            for (let dx = 0; dx < w; dx += step) {
              const di = (dy * w + dx) * 4;
              const lum = dd[di] * 0.299 + dd[di + 1] * 0.587 + dd[di + 2] * 0.114;
              const threshold = (bayer8[(dy & 7) * 8 + (dx & 7)] / 63) * 255 * ditherScale;
              // Preserve mid-tones: blend between dithered and original instead of hard crush
              const dithered = lum > threshold ? Math.min(255, lum * 1.2) : lum * 0.35;
              const val = lum * 0.3 + dithered * 0.7;
              dd[di] = val; dd[di + 1] = val; dd[di + 2] = val;
              if (step > 1) {
                for (let sy = 0; sy < step && dy + sy < h; sy++) {
                  for (let sx = 0; sx < step && dx + sx < w; sx++) {
                    if (sy === 0 && sx === 0) continue;
                    const si = ((dy + sy) * w + dx + sx) * 4;
                    dd[si] = val; dd[si + 1] = val; dd[si + 2] = val;
                  }
                }
              }
            }
          }
          ctx.putImageData(ditherData, 0, 0);
        } catch(e) {}
      }

      // --- DITHERED PORTRAIT FLASH — rare, ghostly appearance ---
      if (portraitReady && portraitCanvas) {
        if (time >= nextPortraitFlash && portraitFlashUntil === 0) {
          // Start a flash: sustain for 1.5-3.5s
          portraitFlashUntil = time + 1500 + Math.random() * 2000;
        }
        if (time < portraitFlashUntil) {
          ctx.save();
          // Fade in/out at edges of the flash window
          const remaining = portraitFlashUntil - time;
          const totalDur = portraitFlashUntil - nextPortraitFlash;
          const elapsed2 = totalDur - remaining;
          const fadeIn = Math.min(1, elapsed2 / 400);
          const fadeOut = Math.min(1, remaining / 400);
          ctx.globalAlpha = Math.min(fadeIn, fadeOut) * 0.35;
          // Center the portrait within the left half of the canvas
          const halfW = Math.floor(w / 2);
          const px = Math.floor((halfW - portraitCanvas.width) / 2);
          const py = Math.floor((h - portraitCanvas.height) / 2);
          ctx.drawImage(portraitCanvas, px, py);
          ctx.restore();
        } else if (portraitFlashUntil > 0 && time >= portraitFlashUntil) {
          // Flash ended — schedule next one (20-50s from now)
          portraitFlashUntil = 0;
          nextPortraitFlash = time + 20000 + Math.random() * 30000;
        }
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
      // Disconnect waveform recorder
      try { recorderNode.disconnect(); } catch(e) {}
      window.__glitchWaveform = null;
      window.__glitchMaster = null;
      window.__glitchSynth = null;
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
  const [projectFilter, setProjectFilter] = useState('all');
  const [transitioning, setTransitioning] = useState(false);
  const [vizIndex, setVizIndex] = useState(initialViz);
  const [glitchMode, setGlitchMode] = useState(false);
  const [nameFallen, setNameFallen] = useState(false);
  const [nameHovered, setNameHovered] = useState(false);
  const [audioMuted, setAudioMuted] = useState(() => localStorage.getItem('audio-muted') === 'true');
  const initialLoadRef = useRef(true);
  const leftPanelRef = useRef(null);

  const isMobile = window.innerWidth <= 768;

  // Keep sound engine in sync with current viz
  useEffect(() => { SoundEngine.setVizIndex(vizIndex); }, [vizIndex]);

  // Auto-trigger glitch intro only on first visit this session (desktop only)
  useEffect(() => {
    if (isMobile) return;
    if (sessionStorage.getItem('glitch-seen')) return;
    const timer = setTimeout(() => {
      setGlitchMode(true);
      sessionStorage.setItem('glitch-seen', '1');
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Cascading text melt effect in glitch mode
  useGlitchMelt(glitchMode, leftPanelRef);


  const filteredProjects = projectFilter === 'all'
    ? allProjects
    : allProjects.filter(p => projectFilter === 'professional' ? p.type === 'client' : p.type === 'personal');

  const selected = selectedId
    ? allProjects.find((p) => p.id === selectedId)
    : null;

  // Clear selection if filtered tab doesn't include it
  useEffect(() => {
    if (selectedId && !filteredProjects.find(p => p.id === selectedId)) {
      setSelectedId(null);
    }
  }, [projectFilter]);

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
    <div className={`split-layout${glitchMode && !isMobile ? ' glitch-mode' : ''}`}>
      {glitchMode && !isMobile && <GlitchOverlay />}
      {glitchMode && !isMobile && <FrameFX />}
      {glitchMode && !isMobile && <GlitchWaveform />}
      {/* LEFT PANEL */}
      <div className="left-panel" ref={leftPanelRef} onClick={glitchMode && !isMobile ? () => { initialLoadRef.current = false; setGlitchMode(false); setNameFallen(false); } : undefined}>
        <nav className="nav">
          <span className="nav__name" style={{ cursor: !isMobile && !glitchMode ? 'pointer' : 'default' }} onClick={!isMobile && !glitchMode ? () => setGlitchMode(true) : undefined} onMouseEnter={() => !glitchMode && !isMobile && setNameHovered(true)} onMouseLeave={() => setNameHovered(false)}>
            <FallingName active={glitchMode} onAllFallen={() => setNameFallen(true)} hovered={nameHovered} />
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
          <SuctionHeadline scrollRef={leftPanelRef} glitchMode={glitchMode && !isMobile} />
          <div className="hero-label">
            <span className="hero-label__title"><AccentMark index={0} />Selected Work</span>
            <span className="hero-label__years">2016 - Present Day</span>
          </div>
        </div>

        <div className="project-index">
          <div className="project-tabs">
            {['all', 'professional', 'personal'].map(tab => (
              <span
                key={tab}
                className={`project-tab${projectFilter === tab ? ' project-tab--active' : ''}`}
                onClick={() => setProjectFilter(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </span>
            ))}
          </div>
          {filteredProjects.map((project) => (
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
        {glitchMode && !isMobile && nameFallen && <GlitchCenterName onExit={() => { initialLoadRef.current = false; setGlitchMode(false); setNameFallen(false); }} />}
      </div>

      {/* RIGHT PANEL */}
      <div className="right-panel">
        {selected ? (
          <>
            <DisengageButton onClick={() => { setSelectedId(null); SoundEngine.uiClick(); }} onHover={() => SoundEngine.play(vizIndex, 'hover-button')} projectId={selectedId} />
            <ProjectView project={selected} transitioning={transitioning} />
          </>
        ) : glitchMode && !isMobile ? (
          <GlitchCaptureGrid />
        ) : (
          <>
            <AudioToggle muted={audioMuted} onToggle={() => { SoundEngine.init(); const next = !audioMuted; setAudioMuted(next); SoundEngine.setMute(next); if (!next) SoundEngine.uiClick(); }} />
            <CycleVizButton onClick={() => { setVizIndex((i) => (i + 1) % visualizations.length); SoundEngine.uiClick(); }} onHover={() => SoundEngine.play(vizIndex, 'hover-button')} index={vizIndex} />
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

function CycleVizButton({ onClick, onHover, index }) {
  const total = visualizations.length;
  const label = String(index + 1).padStart(2, '0') + '/' + String(total).padStart(2, '0');

  return (
    <button className="viz-cycle" onClick={onClick} onMouseEnter={onHover} aria-label="Next visualization">
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
// AUDIO TOGGLE
// ========================

function AudioToggle({ muted, onToggle }) {
  return (
    <button className="audio-toggle" onClick={onToggle} aria-label={muted ? 'Unmute audio' : 'Mute audio'}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 6h2.5L8 3v10L4.5 10H2V6z" stroke="currentColor" strokeWidth="0.75" fill="none" />
        {muted ? (
          <>
            <line x1="11" y1="5" x2="15" y2="11" stroke="currentColor" strokeWidth="0.75" />
            <line x1="15" y1="5" x2="11" y2="11" stroke="currentColor" strokeWidth="0.75" />
          </>
        ) : (
          <>
            <path d="M10.5 5.5C11.5 6.5 11.5 9.5 10.5 10.5" stroke="currentColor" strokeWidth="0.75" fill="none" />
            <path d="M12.5 3.5C14.5 5.5 14.5 10.5 12.5 12.5" stroke="currentColor" strokeWidth="0.75" fill="none" />
          </>
        )}
      </svg>
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
  const lastZoneRef = useRef(null);

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
      lastZoneRef.current = null;
    }

    resize();
    window.addEventListener('resize', resize);

    function handleMouseMove(e) {
      const rect = canvas.parentElement.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left) / rect.width;
      mouseRef.current.y = (e.clientY - rect.top) / rect.height;
    }

    function handleMouseDown(e) {
      if (e.button === 2) return; // right-click handled by contextmenu
      if (e.target !== canvas) return; // only fire on canvas, not UI buttons
      SoundEngine.startRoll(vizIndex, 'click', mouseRef.current.x, mouseRef.current.y);
    }

    function handleMouseUp(e) {
      if (e.button === 2) return;
      SoundEngine.stopRoll();
    }

    function handleContextMenu(e) {
      e.preventDefault();
      if (e.target !== canvas) return;
      SoundEngine.startRoll(vizIndex, 'rightclick', mouseRef.current.x, mouseRef.current.y);
    }

    function handleContextMenuUp(e) {
      SoundEngine.stopRoll();
    }

    canvas.parentElement.addEventListener('mousemove', handleMouseMove);
    canvas.parentElement.addEventListener('mousedown', handleMouseDown);
    canvas.parentElement.addEventListener('mouseup', handleMouseUp);
    canvas.parentElement.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('mouseup', handleContextMenuUp);

    function animate(time) {
      const t = time * 0.001;
      const cw = canvas.width / dpr;
      const ch = canvas.height / dpr;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      viz.render(ctx, cw, ch, t, mx, my, stateRef.current);
      // Detect zone changes for sound triggers
      const zone = stateRef.current.soundZone;
      if (zone !== undefined && zone !== lastZoneRef.current) {
        lastZoneRef.current = zone;
        SoundEngine.play(vizIndex, 'mouseover', mx, my);
      }
      frameRef.current = requestAnimationFrame(animate);
    }

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
      canvas.parentElement?.removeEventListener('mousemove', handleMouseMove);
      canvas.parentElement?.removeEventListener('mousedown', handleMouseDown);
      canvas.parentElement?.removeEventListener('mouseup', handleMouseUp);
      canvas.parentElement?.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('mouseup', handleContextMenuUp);
      SoundEngine.stopRoll();
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
              onClick={() => SoundEngine.trigger('click')}
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
              onClick={() => SoundEngine.trigger('click')}
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
  return <DitherAsciiImage src={src} alt={alt} className={className} delay={delay} />;
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

// ========================
// DITHER + ASCII IMAGE — dithered/ASCII default, reveals on hover
// ========================

const BAYER4 = [
   0, 8, 2,10,
  12, 4,14, 6,
   3,11, 1, 9,
  15, 7,13, 5,
];

const ASCII_RAMP = ' .:-=+*#%@';

function DitherAsciiImage({ src, alt, className }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const dimsRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    setLoaded(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      const maxW = 500;
      const scale = Math.min(1, maxW / img.width);
      const w = Math.floor(img.width * scale);
      const h = Math.floor(img.height * scale);
      canvas.width = w;
      canvas.height = h;
      dimsRef.current = { w, h };

      // Draw original to extract pixel data
      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const pixels = imageData.data;

      // Clear and draw dithered ASCII
      ctx.fillStyle = '#f5f5f4';
      ctx.fillRect(0, 0, w, h);

      const cellSize = 6;
      const cols = Math.ceil(w / cellSize);
      const rows = Math.ceil(h / cellSize);

      ctx.textBaseline = 'top';

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const px = col * cellSize;
          const py = row * cellSize;

          // Sample center pixel of cell
          const sx = Math.min(Math.floor(px + cellSize / 2), w - 1);
          const sy = Math.min(Math.floor(py + cellSize / 2), h - 1);
          const idx = (sy * w + sx) * 4;
          const lum = pixels[idx] * 0.299 + pixels[idx + 1] * 0.587 + pixels[idx + 2] * 0.114;
          const lumNorm = lum / 255;

          // Bayer dither threshold
          const threshold = (BAYER4[(row & 3) * 4 + (col & 3)] / 15);

          // Pick ASCII character based on dithered luminance
          const dithered = lumNorm + (threshold - 0.5) * 0.4;
          const charIdx = Math.max(0, Math.min(ASCII_RAMP.length - 1,
            Math.floor((1 - dithered) * ASCII_RAMP.length)));
          const ch = ASCII_RAMP[charIdx];

          if (ch === ' ') continue;

          // Darker characters for darker regions
          const alpha = 0.3 + (1 - lumNorm) * 0.5;
          ctx.fillStyle = `rgba(26,26,26,${alpha})`;
          ctx.font = `${cellSize + 1}px 'ISO', monospace`;
          ctx.fillText(ch, px, py);
        }
      }

      setLoaded(true);
    };

    img.src = src;
  }, [src]);

  return (
    <div
      ref={containerRef}
      className="pixel-sort-container"
      onMouseEnter={() => { setHovered(true); SoundEngine.trigger('hover-image'); }}
      onMouseLeave={() => setHovered(false)}
    >
      <canvas
        ref={canvasRef}
        className="pixel-sort-canvas"
        style={{
          opacity: loaded ? (hovered ? 0 : 1) : 0,
          transition: 'opacity 0.5s ease',
        }}
      />
      <img
        src={src}
        alt={alt}
        className={className}
        style={{
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      />
    </div>
  );
}

export default App;
