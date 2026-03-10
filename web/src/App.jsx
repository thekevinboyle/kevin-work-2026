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
// APP
// ========================

const initialViz = Math.floor(Math.random() * visualizations.length);

function App() {
  const [selectedId, setSelectedId] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [vizIndex, setVizIndex] = useState(initialViz);
  const leftPanelRef = useRef(null);

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
    <div className="split-layout">
      {/* LEFT PANEL */}
      <div className="left-panel" ref={leftPanelRef}>
        <nav className="nav">
          <span className="nav__name">Kevin Boyle</span>
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
