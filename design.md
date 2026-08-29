# Design Specification: Mistral AI & Orangely Agency Styles

This document provides a highly detailed design specification based on the provided screenshots. It is structured to be fully understandable and actionable by any AI coding agent or developer implementing these interfaces.

---

## Part 1: Global Design Tokens & Setup

### 1.1 Typography
To match the modern, premium aesthetic of both designs, use high-quality sans-serif fonts:
- **Heading Font**: `Figtree` or `Syne` (for Orangely) / `Geist Sans` or `Inter` (for Mistral AI).
- **Body Font**: `Geist Sans`, `Inter`, or `Figtree`.
- **Mono Font**: `Geist Mono` or `JetBrains Mono` (for code blocks and small technical labels).

### 1.2 Color Palettes

#### A. Mistral AI Style (Minimalist, High-Tech, High-Contrast)
- **Light Background**: `oklch(0.99 0.005 240)` or `#f0f7fc` (cool, soft off-white).
- **Dark Background**: `oklch(0.145 0 0)` or `#0a0a0a` (deep matte black).
- **Primary Accent (Blue)**: `oklch(0.58 0.20 250)` or `#0084ff` (vibrant, high-saturation corporate blue).
- **Secondary Accent (Cyan)**: `oklch(0.78 0.12 205)` or `#4dd0e1`.
- **Text Primary**: `oklch(0.145 0 0)` (black) on light / `oklch(0.985 0 0)` (white) on dark.
- **Borders**: Fine, thin lines using `oklch(0.922 0 0)` or `#e5e5e0` (light gray) on light / `oklch(1 0 0 / 10%)` on dark.

#### B. Orangely Agency Style (Warm, Creative, Organic)
- **Primary Background**: `oklch(0.97 0.015 240)` or `#e8f4fc` (pale, icy blue off-white).
- **Accent Glow (Grainy Gradient)**: Radial gradient transitioning from vibrant blue `oklch(0.58 0.20 250)` (`#0084ff`) to soft cyan `oklch(0.85 0.06 230)` (`#a8d8f0`) with a noise/grain overlay.
- **Text Primary**: `oklch(0.12 0.005 70)` or `#111111` (deep charcoal black).
- **Text Muted**: `oklch(0.55 0.01 240)` or `#6b7a8a` (cool muted gray).
- **Card Background**: `oklch(1 0 0)` or `#ffffff` (pure white) with a very soft, cool shadow.
- **Dark Navy (Logo/Depth)**: `oklch(0.35 0.15 260)` or `#003da5`.

---

## Part 2: Mistral AI Style Design Specification

### 2.1 Navigation Header (Global)
- **Layout**: Full-width, flex row, items-center, justify-between. Height: `64px` (h-16). Thin border-b.
- **Left Section**:
  - Logo: Blocky, geometric "M" icon composed of blue/cyan pixel blocks (Mistral-style logo).
  - Navigation Links (Desktop): "Products", "Solutions", "Research", "Developers", "Blog", "Customers", "Company".
    - Font: Medium weight, small size (`14px`), dark gray/black. Hover: Accent blue.
- **Right Section**:
  - Theme Toggle Button: Circular button with a split half-moon/sun icon representing light/dark mode.
  - "Start building" Dropdown: Text link with a small down chevron.
  - "Contact sales >" Button: Solid black background, white text, sharp or slightly rounded corners (`rounded-sm`), padding `px-4 py-2`. Features a right chevron (`>`) at the end.

### 2.2 Hero Section (Image 1)
- **Layout**: Two-column grid on desktop, stacking vertically on mobile.
- **Left Column**:
  - Heading: `"Frontier AI. In your hands."`
    - Font: Extra bold, very large (`text-5xl` to `text-7xl`), tight letter-spacing (`tracking-tight`), black.
- **Right Column**:
  - Description: `"We help organizations build tailored AI systems to solve the world's hardest problems."`
    - Font: Regular, medium size (`text-lg` to `text-xl`), leading-relaxed, dark gray.
- **Below Content (Visual Grid & News)**:
  - **Left Visual**: A decorative, low-res pixel art grid composed of blue, navy, and cyan squares.
    - Overlay Text: Technical labels in small, uppercase mono font: `"FRONTIER AI"` (top-left) and `"IN YOUR HANDS"` (mid-right).
    - Cat Icon: A small, blocky black cat icon positioned at the bottom-right corner of the pixel grid.
  - **Center Column**: Three downward-pointing chevrons (`↓`) stacked vertically, serving as a scroll indicator.
  - **Right Visual (Featured News Card)**:
    - Positioned at the bottom right.
    - Content: A compact card with a blue server/lock illustration on the left, and text `"In-region inference, open models, and new European..."` on the right.
    - Navigation: Small `<` and `>` arrow buttons on the right edge of the card for cycling news.

### 2.3 Interactive Tabs Section (Image 5)
- **Layout**: Left-hand sidebar tab selector, right-hand dynamic content area.
- **Left Sidebar Tab Selector**:
  - Vertical stack of tabs with thin borders.
  - Tabs:
    - `"By industry"`
    - `"By team"` (includes a small right chevron `→` on hover/active)
    - `"By capability"` (active tab, highlighted with a solid black border wrapper).
- **Right Content Area (Active: "By capability")**:
  - Title: `"Trusted across every function."` (Large, bold, `text-3xl` to `text-4xl`).
  - Two-Column Grid:
    - **Column 1: Sales and marketing**:
      - Paragraph: `"Enhance your marketing ROI with AI-powered content creation and campaign optimization. Generate compelling copy, analyze market trends, and identify high-value leads while maintaining brand consistency..."`
      - Visual Block: A large, solid blue block. In the center is a perfect white square containing a clean, black up-right arrow icon (`↗`).
    - **Column 2: Product and engineering**:
      - Paragraph: `"Supercharge development with AI-assisted coding and testing. From intelligent code completion to automated documentation, our solutions help engineering teams write better code faster..."`
      - Visual Block: A large, solid blue block. In the center is a perfect white square containing a clean, black computer screen icon.

---

## Part 3: Orangely Agency Style Design Specification

### 3.1 Navigation Header (Global)
- **Layout**: Max-width container, flex row, items-center, justify-between, height `80px`.
- **Left Section**:
  - Logo: Blue crescent/circle icon (open circle with a small gap) followed by the text `"Orangely"` in a bold, clean sans-serif font.
- **Center Section**:
  - Navigation Links: "Home", "Work", "Service" (with a small down chevron), "About".
    - Font: Medium weight, `15px`, dark charcoal. Hover: Soft blue.
- **Right Section**:
  - "Contact Us" Button: Pill-shaped (`rounded-full`), solid black background, white text, padding `px-6 py-2.5`, hover: bg-accent/blue.

### 3.2 Hero Section (Image 3)
- **Background**: A large, soft, grainy radial gradient circle (blue-to-cyan) centered behind the text, creating a glowing cool orb effect.
- **Layout**: Two-column layout with high visual asymmetry.
- **Left Side**:
  - Heading: `"Connect with a first touch to awesome"`
    - Font: Elegant, high-contrast sans-serif, large (`text-5xl` to `text-6xl`), bold.
    - Underline: A thin, elegant black horizontal line directly underneath the words `"first touch to"`.
  - Subtitle: `"Lorem Ipsum is simply dummy text of the printing and typesetting industry"`
    - Font: Regular, muted gray, `text-base` or `text-lg`.
  - Circular Badge: A rotating circular badge.
    - Visual: A solid black circle. Inside, white text `"get started • get started •"` rotates continuously around a central white down arrow (`↓`).
  - Social Icons: Small, clean inline icons for Instagram, YouTube, and Dribbble/Globe at the bottom left.
- **Right Side**:
  - Stats Stack:
    - `"50M+ Happy client's"` (Large bold number, small muted label below).
    - `"900+ Big Project"` (Large bold number, small muted label below).
  - Testimonial Quote:
    - Text: `"Very good performance from the Orangely team. They really prioritize quality with their cooperation. Complete work structure from start to finish."`
    - Font: Italicized or clean serif/sans-serif, medium size, leading-relaxed.
    - Author: `"Paul Yayuk Reyhan, CEO of Google"`
    - Styling: A thin, horizontal divider line sits directly above the author's name.

### 3.3 Collaboration Structure Section (Image 2)
- **Header**:
  - Title: `"Establish our collaboration structure"` (Bold, centered or left-aligned, `text-3xl`).
  - Subtitle: `"We prioritize structured cooperation and aim to create maximum results reaching the point of perfection. There is always complete documentation"` (Muted gray, max-w-2xl).
- **Cards Grid**: 4-column grid (desktop) or 1-column (mobile).
- **Card Design**:
  - Background: Pure white, rounded corners (`rounded-2xl`), very soft cool shadow.
  - Padding: `p-6` or `p-8`.
  - Content:
    - **Card 1**: Icon: Blue hand-clicking/pointer. Text: `"Provide several touches that make the result perfect"`
    - **Card 2**: Icon: Blue pencil/ruler. Text: `"Efficient and effective work by prioritizing quality"`
    - **Card 3**: Icon: Blue stacked layers. Text: `"Complete documentation of every progress"`
    - **Card 4**: Icon: Blue lightning bolt. Text: `"Fast work and still provides quality results"`

### 3.4 Services Grid (Image 2 - Mobile view)
- **Header**: `"Providing the best service for you"`
- **Grid Layout**: 2x2 grid or vertical stack.
- **Service Item**:
  - Number & Title: `"01 UI/UX Design"`, `"02 Illustration"`, `"03 3D Animation"`, `"04 Development"`.
  - Description: Short, descriptive text.
  - Image: A high-quality, high-contrast, cool-toned contextual image (e.g., hands holding a phone, drawing on an iPad, abstract 3D shapes).

### 3.5 Process Steps Section (Image 2 - Mobile view)
- **Header**: `"How do we work to help you"`
- **Steps Stack**:
  1. **Research**: `"To start the work, we carry out research as needed"`
  2. **Sketching**: `"The design process before execution makes it clear"`
  3. **Execution**: `"The core stage of all optimal work"`
  4. **Finishing**: `"Ensure that the final stage produces perfection"`

### 3.6 Creative Capsule Section (Image 4)
- **Layout**: A horizontal row of oversized, pill-shaped capsule buttons/shapes that stack or wrap beautifully.
- **Capsule 1**: Text `"Create"` + a small blue star/magic wand icon enclosed in a thin circle.
- **Capsule 2**: Text `"Something"` + a small blue star icon enclosed in a thin circle.
- **Capsule 3**: Text `"awesome"` + a small blue clapping hand icon enclosed in a thin circle.
- **Text Block**: A clean, small text block next to or below the capsules: `"The results must be satisfactory so that a product or brand can be well known"`.

### 3.7 "Let's Talk" CTA Section (Image 4)
- **Layout**: Centered, high-impact block.
- **Background**: Soft, cool blue grainy gradient glow.
- **Title**: `"Let's talk together now!"` (Bold, `text-4xl` to `text-5xl`).
- **Button**: Pill-shaped (`rounded-full`), solid black, white text, reading `"Contact Us →"` with a right arrow.

### 3.8 Footer (Image 4)
- **Layout**: 4-column grid, clean spacing, thin border-t.
- **Column 1 (Services)**:
  - Header: `"SERVICES"` (Uppercase, bold, small, muted).
  - Links: UI/UX Design, Illustration, 3D Design, Animation.
- **Column 2 (Company)**:
  - Header: `"COMPANY"`
  - Links: About, Press, Careers, Contact.
- **Column 3 (Connect)**:
  - Header: `"CONNECT"`
  - Links: Instagram, LinkedIn, Twitter.
- **Column 4 (Stay Updated)**:
  - Header: `"STAY UPDATED"`
  - Input Field: `"Email Address.."` (Rounded pill input with a light border).
  - Button: `"Subscribe →"` (Pill-shaped, black background, nested inside or next to the input).
  - Disclaimer: Small, muted text below: `"You'll receive occasional emails from Zenen. You always have the choice to unsubscribe within every email."`

---

## Part 4: Technical Implementation Guide for Agents

When implementing these designs, follow these precise guidelines to match the visual fidelity:

### 4.1 Achieving the Grainy Gradient Background (Orangely)
To create the cool, organic glowing circle with a grainy/noisy texture:
1. **CSS Glow**: Use a radial gradient centered in the container.
2. **SVG Noise Filter**: Apply an SVG filter for the grain effect to avoid heavy image assets.

```html
<!-- SVG Noise Filter Definition (Place in root layout or top of page) -->
<svg className="hidden">
  <filter id="grainy-noise">
    <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves="4" stitchTiles="stitch" />
    <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.07 0" />
  </filter>
</svg>
```

Apply it in Tailwind:
```tsx
// Example glowing background container
<div className="relative overflow-hidden bg-[#e8f4fc]">
  {/* Glowing Orb */}
  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#0084ff] to-[#a8d8f0] blur-[120px] opacity-40 pointer-events-none" />
  
  {/* Grain Overlay */}
  <div 
    className="absolute inset-0 pointer-events-none opacity-50 mix-blend-overlay" 
    style={{ filter: "url(#grainy-noise)" }} 
  />
</div>
```

### 4.2 Rotating Circular Badge (Orangely)
To build the rotating "get started" circular text badge:
1. Use SVG `<textPath>` to render text along a circular path.
2. Use Framer Motion or standard CSS keyframes to rotate the SVG infinitely.

```tsx
import { motion } from "motion/react"

export function RotatingBadge() {
  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      {/* Rotating Text */}
      <motion.svg
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="w-full h-full"
        viewBox="0 0 100 100"
      >
        <path
          id="circlePath"
          d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
          fill="none"
        />
        <text className="text-[8px] font-semibold uppercase fill-white tracking-[2px]">
          <textPath href="#circlePath" startOffset="0%">
            get started • get started •
          </textPath>
        </text>
      </motion.svg>
      
      {/* Center Arrow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white text-lg">↓</span>
      </div>
    </div>
  )
}
```

### 4.3 Interactive Tabs (Mistral AI)
Manage the active tab state using React `useState`. Animate the active tab indicator border or background using Framer Motion's `layoutId` for a smooth transition.

```tsx
import { useState } from "react"
import { motion } from "motion/react"

const tabs = ["By industry", "By team", "By capability"]

export function VerticalTabs() {
  const [activeTab, setActiveTab] = useState("By capability")

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <div className="flex flex-col border-l border-border">
        {tabs.map((tab) => {
          const isActive = tab === activeTab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative px-6 py-4 text-left text-sm font-medium transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 border-l-2 border-primary bg-accent/5"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className={isActive ? "text-primary font-bold" : "text-muted-foreground"}>
                {tab}
              </span>
            </button>
          )
        })}
      </div>
      
      {/* Content Area */}
      <div className="flex-1">
        {activeTab === "By capability" && <CapabilityContent />}
      </div>
    </div>
  )
}
```

### 4.4 Pixel Art Grid (Mistral AI)
Generate the decorative pixel art grid dynamically or using a simple static grid map:

```tsx
const gridColors = [
  "#0084ff", "#0066cc", "#4dd0e1", "#0084ff",
  "#4dd0e1", "#0084ff", "#0066cc", "#4dd0e1",
  // ... define grid pattern colors
]

export function PixelGrid() {
  return (
    <div className="relative grid grid-cols-8 gap-1 w-full max-w-md aspect-square bg-black p-4 rounded-lg overflow-hidden">
      {gridColors.map((color, idx) => (
        <div key={idx} style={{ backgroundColor: color }} className="w-full h-full" />
      ))}
      <div className="absolute top-4 left-4 font-mono text-[10px] text-white">FRONTIER AI</div>
      <div className="absolute bottom-4 right-4 font-mono text-[10px] text-white">IN YOUR HANDS</div>
    </div>
  )
}
```
