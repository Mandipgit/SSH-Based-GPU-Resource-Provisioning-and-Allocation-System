# UI/UX Analysis: vast.ai

## Checklist
- [x] Section 1: Color Hierarchy
- [x] Section 2: Typography
- [x] Section 3: Animations & Interactions
- [x] Section 4: Layout & Components

## Details
### 1. Color Hierarchy
* Primary Brand Color: Bright Blue / Azure (e.g. `#2B55E8` for quick help button, `#315FFF` for links/accents, `#a8bbff` for hover links/secondary accents)
* Secondary/Accent Colors: Light blue/lavender (`#a8bbff`), Gray (`#6b7280` / `#d4d4d4`), Off-black/Charcoal (`#0a0a0a`, `#1A1A1A`)
* Backgrounds (Hero, Content, Footer): Dark/Black (implied by white/light gray text on backgrounds, code block uses `#0d1117`)
* Text Colors (Headings, Body, Captions, Accents):
  - Headings/Labels: White (`text-white`)
  - Body Text: Light Gray (`text-[#d4d4d4]`, `text-white/70`, `text-white/60`)
  - Accent Text: Blue (`#315fff`), Pale Blue (`#a8bbff`)
  - Input/Top Banner Text: Dark Gray/Black (`text-[#0a0a0a]`, `text-[#1A1A1A]`)
  - Placeholders: Gray (`text-[#6b7280]`, `text-white/50`)
* Gradients: Glowing dark-mode styles with subtle blue/purple accent glow (visible in hero and section backgrounds)

### 2. Typography
* Headings Font: `font-heading` (Custom heading font, likely sans-serif or display sans)
* Body/Sans Font: `sans-font` (Standard sans-serif font family), custom `font-['Roboto',sans-serif]` for docs links, `font-mono` for terminal/code blocks
* Heading Sizes & Weights:
  - Section Headings: Bold/Semibold, e.g. H3 for GPU cards
  - Font weights: `font-semibold`
* Body Sizes & Weights:
  - Font sizes: `text-[13px]`, `text-[15px]`, `text-[16px]`, `text-[17px]`, `text-[18px]`
  - Font weights: `font-medium`, `font-normal`

### 3. Animations & Interactions
* Hover states:
  - Navbar links: `transition-colors duration-150 text-[#d4d4d4] hover:text-white`
  - Case study buttons: `transition-colors duration-150 border-line text-white hover:bg-white hover:text-[#0a0a0a]`
  - Help button: `transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(43,85,232,0.24)]`
  - Footer links: `hover:text-[#a8bbff] transition-colors duration-150`
* Transition properties (durations, easing): `duration-150`, `duration-200`, `transition-colors`, `transition-all`
* Floating/Sticky elements: Quick Help button floating at bottom-right (`h-[50px] w-[50px] rounded-full bg-[#2B55E8] shadow-...`)
* Scroll-based effects: Standard modern scrolling, sticky navbar (implied by navbar coordinates remaining near Y: 100/104 across scroll heights)

### 4. Layout & Components
* Navbar layout & behavior: Left-aligned logo, center-aligned links (Developers, Pricing, Products, Hosting, Use Cases, Company), right-aligned CTA buttons (Contact Sales, Console)
* Button styles:
  - Primary (Get Started / Rent): Rounded buttons, blue backgrounds/text
  - Secondary/Outline: Transparent with border, white text, switches to dark text on white background on hover (`border border-line text-white hover:bg-white hover:text-[#0a0a0a]`)
* Input fields & forms:
  - Email input: Rounded-full, light background (`text-[#0a0a0a]`), white/gray placeholder
  - Newsletter input: Transparent with line, bottom border/underline, inline submit arrow (`→`)
* Content cards & grid systems:
  - GPU Grid: 3-column layout (RTX 5090, 4090, 3090 on one row; B200, H100 SXM, H200 on another row) with charts, specifications, and "Rent" buttons
  - Use Cases: Flowing grid of tags/chips representing categories (AI Text Gen, AI Agents, virtual computing, graphics rendering, etc.)
  - Popular Models: 4-column layout of template cards (Kimi K3, Krea 2 Turbo, GLM 5.2, Qwen3.6) with direct "Deploy" CTAs
  - Case Studies: alternating full-width/half-width cards with large images and "View Case Study" buttons
* Spacing & padding: Consistent spacing, standard Tailwind paddings (`px-4`, `py-3`, `gap-[10px]`, etc.)