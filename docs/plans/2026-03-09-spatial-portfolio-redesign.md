# Spatial Portfolio Redesign

## Positioning
Design Engineer portfolio. The site itself is the proof of craft. Primary goal: get hired by demonstrating skill in the medium.

## Core Concept
A spatial canvas, not a scrolling page. Dark, dimensional environment with CSS `perspective` and `translate3d`. Content exists as layers at different depths. Navigation is spatial — zone hints at viewport edges, keyboard arrows, and a `Cmd+K` command palette. No traditional menu bar.

## Zones
Four zones radiate from a center hub (name + positioning line):

- **WORK** (left) — 2-3 professional projects as depth cards. Click zooms into the layer. Tight case narratives: problem, what you did, outcome. 3-4 images max per project.
- **CRAFT** (right) — React Six Pack tools as live interactive thumbnails. Hover scales up. Click expands. The wow moment.
- **NOW** (top) — Short, updatable text. What you're working on, thinking about, reading. Low maintenance, high signal.
- **CONNECT** (bottom) — Email (copy-to-clipboard), GitHub, LinkedIn, resume PDF. One-line bio.

## Visual Identity

### Typography
- Display: Instrument Serif or Space Grotesk (name, zone labels, 4-6rem, light weight)
- Body: Inter (clean, legible)
- Tension between serif display and sans body

### Color
- Background: `#0a0a0a` (near black)
- Text: white
- One accent color used sparingly (warm amber `#E8A838` or cool blue-white glow)
- Monochrome restraint — accent means something when it appears

### Signature Interactions
- **Cursor glow**: Radial gradient follows mouse via `mousemove`. Illuminates nearby content like a flashlight. CSS `radial-gradient` on a pseudo-element.
- **Zone transitions**: CSS `perspective: 1200px`, `transform-style: preserve-3d`. Zones positioned with `translate3d`. Navigate via transform + opacity over ~500ms with cubic-bezier easing.
- **Noise grain**: SVG `feTurbulence` filter composited at low opacity over background. Texture and warmth.
- **Parallax depth cards**: Mouse position shifts card transforms slightly. Different cards at different z-depths.

## Tech Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- View Transitions API (native browser, no library)
- `next/font` for optimized loading
- `cmdk` library for Cmd+K palette (by Paco Coursey)
- React Six Pack apps embedded via iframe
- No animation library — CSS transforms + transitions only

## Architecture
```
app/
  layout.tsx          # Root layout, fonts, metadata, cursor glow provider
  page.tsx            # Center hub — name, tagline, spatial zone hints
  work/
    [slug]/page.tsx   # Individual project deep-dives
  craft/
    page.tsx          # React Six Pack tools grid
  now/
    page.tsx          # Current status/thinking
  connect/
    page.tsx          # Links, bio, resume
components/
  SpatialCanvas.tsx   # Perspective container, zone positioning
  CursorGlow.tsx      # Mouse-following radial gradient
  ZoneHint.tsx        # Edge labels that preview zone content
  DepthCard.tsx       # Parallax project/craft cards
  CommandPalette.tsx  # Cmd+K quick navigation
  NoiseOverlay.tsx    # SVG feTurbulence grain texture
  ZoneTransition.tsx  # Shared transition wrapper
data/
  projects.ts         # 2-3 curated professional projects
  craft.ts            # React Six Pack tool definitions
```

## Content Curation

### WORK (3 projects)
1. Radius — design system unification, front-end engineering
2. Best of Textline/Mozeo/Textedly — whichever has strongest visuals
3. One more if a strong third exists, otherwise ship with 2

### CRAFT (6 tools)
BrewDial, TypeScale, PalettePop, Atlas, PlateMath, MacroMini — all live embeds with one-liner descriptions

### NOW
Seed with 3-5 lines about current focus (context engineering, AI interfaces, what you're building/reading)

### CONNECT
Email (copy-to-clipboard), GitHub, LinkedIn, resume PDF. "Design Engineer in Austin, TX."

### Deliberately excluded
- No blog at launch (add `/writing` zone later)
- No scrolling galleries
- No case study format — tight narratives only
- No more than 3-4 images per project

## Constraints
- Ship ASAP — CSS-driven spatial effects, no WebGL
- All transitions via CSS transforms, no animation libraries
- Performance is a credibility signal — keep it fast
