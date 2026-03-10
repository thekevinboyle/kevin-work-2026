# Editorial Split-Screen Redesign

## Concept
50/50 split-screen layout inspired by Hélio Teles. Left panel fixed (identity + project index table), right panel scrollable (project content). Light editorial aesthetic.

## Left Panel (fixed)
- Header: "Kevin Boyle" left, "Information" right
- Bio: "Kevin Boyle is an Austin-based design engineer bridging design systems and front-end development."
- Contact: email, LinkedIn
- Project index: numbered table (001-012), columns: index, name, category, year
- All projects in one flat list sorted by year descending, no client/personal separation
- Clicking a row bolds it and loads content on right

## Right Panel (scrollable)
- Default: scattered preview thumbnails at asymmetric positions with index numbers
- Selected: scrollable column of project images + description + role + skills
- SEG_F4ULT: screenshot + "Visit Site →" link
- React Six Pack tools: thumbnails + "Launch App →" link

## Visual Identity
- White/near-white background
- Text: #1a1a1a primary, #888 secondary, #e0e0e0 dividers
- ISO font throughout, one typeface, different weights
- ~14px body/table size, no hero-sized type
- 1px vertical divider between halves
- No custom cursor, parallax, noise, or animations beyond simple fades

## Technical
- Keep React + Vite stack
- No React Router — single view, state-driven
- State: selectedProject: string | null
- CSS Grid: 1fr 1fr split
- Reuse existing projects.js data, flattened into one sorted list
- Mobile: collapses to single column
