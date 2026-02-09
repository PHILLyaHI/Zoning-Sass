# DESIGN_RULES.md — Zoning App UI System (Derived from References)



## A) Overall Look & Feel

Modern, “Apple-like”, premium SaaS.

Clean layout, lots of whitespace, soft borders, smooth radius.

Two visual modes:

Landing page = dark-ish glassmorphism over a full-bleed photo background (house in snow).

App pages = light, clean dashboard style with rounded container, sidebar, top search, card-based content.



## B) Landing Page Style (Image #1 reference)

Must replicate these characteristics:

Full-screen hero with the existing house background image (cover, center, no tiling).

Overlay UI uses glass panels:

Semi-transparent dark background (not solid)

Blur behind (backdrop blur)

Soft border (1px, subtle)

Large rounded corners (≈ 24–32px)

Top center: a pill search bar with rounded edges and subtle blur.

Top left: circular icon button (hamburger).

Top right: 2 circular icon buttons (settings + user).

Floating stat cards on the right:

Big number (ex: “23M”, “200+”)

Small label below

Icon in a colored circle inside card (accent colors allowed but minimal)

Big headline panel bottom-left (glass) with:

Large title text

Short paragraph text

One circular accent button

Landing page animation behavior

Subtle fade/slide in for cards on load (fast, premium).

Hover on glass cards: slightly lift + stronger border.



## C) App Dashboard Style (Image #2 reference)

Must replicate these characteristics:

Main app layout: a soft light background with a centered “app frame” feeling:

Large rounding on outer container (≈ 28–40px)

Inside: sidebar + content panel

Left sidebar:

Icons + labels

Active item has a filled pill highlight (blue accent in reference)

Sidebar background is slightly tinted / elevated from main background

Top bar:

Search input left side (rounded)

Right side has notification icons and user profile/avatar

Content area:

Card-based lists and panels

Cards have subtle shadow or border, rounded corners (≈ 16–24px)

Primary button is a strong accent color (blue-like)

Secondary buttons are outline or light fill

Typography:

Big page title (like “Schedule”)

Small muted labels

Clear hierarchy



## D) UI Components Rules (Use Everywhere)

Buttons

Primary: filled accent

Secondary: outline / light fill

Icon buttons: circular, subtle background, hover states

Cards

Always rounded

Always padded

Always consistent spacing

Inputs

Rounded

Subtle borders

Focus ring visible but not aggressive

Chips/Badges

Use for statuses: “High risk”, “Low risk”, “Unknown”, “Needs verification”

Tables

Only when necessary; prefer cards for readability



## E) Spacing & Layout

Use an 8px spacing grid.

Generous padding inside cards.

Never cram content. Prefer stacking and progressive disclosure.



## F) Responsiveness Rules

Desktop

Sidebar visible

Content uses 2–3 column layouts where appropriate

Tablet

Sidebar collapses to icon-only OR becomes a drawer

Map + panels become stacked or split 50/50

Mobile

Sidebar becomes a bottom nav OR hamburger drawer

Map becomes full-width with bottom sheet drawers for:

Layers

AI chat

Property details

Cards stack vertically

Minimum tap target size: 44px



## G) “Do Not” List

No harsh borders

No tiny text

No cluttered dense tables

No random colors everywhere

No inconsistent border radius

No breaking existing business logic
# DESIGN_RULES.md — Zoning App UI System (Derived from References)



## A) Overall Look & Feel

- Modern, premium SaaS (“Apple-like”)

- Clean layout, generous whitespace, soft borders, smooth radius

- Two visual modes:

  1) Landing page = dark glassmorphism over full-bleed house photo background

  2) App pages = light, clean dashboard style with sidebar + top search + card-based content

## B) Landing Page Style (Reference #1)

### Must match these characteristics

- Full-screen hero uses the existing house background image (cover, centered, no tiling). Do not replace or generate a new image.

- Overlay UI uses glass panels:

  - Semi-transparent dark surface (not solid)

  - Backdrop blur (glass effect)

  - Subtle 1px border

  - Large rounded corners (~24–32px)

- Top center: pill search bar (rounded ends, subtle blur)

- Top left: circular icon button (hamburger)

- Top right: two circular icon buttons (settings + user/profile)

- Floating stat cards on right:

  - Large metric number

  - Small label below

  - Icon in a colored circle inside the card (minimal accent)

- Bottom-left: large glass hero card:

  - Big headline

  - Short description

  - One circular accent button

### Motion + interactions

- On load: subtle fade/slide-in for cards (fast, premium)

- Hover on glass cards: slight lift + slightly stronger border

## C) App Dashboard Style (Reference #2)

### Layout

- Soft light background with a centered “app frame” feel

- Outer container with large rounding (~28–40px)

- Inside: left sidebar + main content panel

### Sidebar

- Icons + labels

- Active item uses a filled pill highlight (accent color)

- Sidebar background is slightly tinted/elevated from main background

### Top bar

- Search input on the left (rounded)

- Right side: notification icons + user avatar/profile

### Content area

- Card-based panels and lists

- Cards: subtle shadow OR border, rounded corners (~16–24px)

- Primary button: filled accent

- Secondary: outline or light fill

### Typography

- Clear hierarchy:

  - Page title large

  - Labels muted/smaller

  - Body readable, not cramped

## D) Components Rules (Use Everywhere)

- Buttons:

  - Primary = filled accent

  - Secondary = outline/light

  - Icon buttons = circular, subtle bg, hover states

- Cards:

  - Always rounded

  - Consistent padding

  - Consistent spacing

- Inputs:

  - Rounded, subtle borders

  - Visible focus ring (not aggressive)

- Badges/Chips:

  - For statuses: High risk / Low risk / Unknown / Needs verification

- Tables:

  - Only if needed; prefer cards for readability

## E) Spacing & Layout

- Use an 8px spacing grid

- Generous padding inside cards

- Avoid dense UI; prefer progressive disclosure

## F) Responsiveness Rules

### Desktop

- Sidebar visible

- 2–3 column layouts when appropriate

### Tablet

- Sidebar collapses to icon-only OR becomes a drawer

- Map + panels stack or split 50/50

### Mobile

- Sidebar becomes bottom nav OR hamburger drawer

- Map full-width with bottom-sheet drawers for:

  - Layers

  - AI chat

  - Property details

- Cards stack vertically

- Minimum tap target: 44px

## G) Do-Not List

- No harsh borders

- No tiny text

- No cluttered dense tables

- No random colors everywhere

- No inconsistent border radius

- Do not break existing business logic or remove features










---

# DESIGN_RULES.md — Zoning App UI System (Derived from References)



## 1) Overall Look & Feel

- Modern, premium SaaS (“Apple-like” / “Squarespace clean”)

- Clean layout, generous whitespace, soft borders, smooth shadows

- Consistent rounding across the app (no sharp corners)

- Two visual modes:

  1) Landing page = dark glassmorphism over full-bleed house photo background

  2) Authenticated app = light, clean dashboard with sidebar + top search + card-based content

## 2) Landing Page Style (Reference #1: house background + glass cards)

### Must match these characteristics

- Use the EXISTING house background image asset already in the project:

  - Full screen

  - `background-size: cover`

  - `background-position: center`

  - Do NOT replace or generate a new image

- Overlay UI uses glass panels:

  - Semi-transparent dark surface (not solid)

  - Backdrop blur (glass effect)

  - Subtle 1px border

  - Large rounded corners (~24–32px)

- Top center: pill search bar (rounded ends, subtle blur)

- Top left: circular icon button (hamburger/menu)

- Top right: two circular icon buttons (filters/settings + user/profile)

- Floating stat cards on right:

  - Large metric number (bold)

  - Small label text below (muted)

  - Small icon in a colored circle inside the card (minimal accent only)

- Bottom-left: large glass hero card:

  - Big headline

  - Short description

  - One circular accent button

### Motion + interactions

- On load: subtle fade/slide-in for hero + stat cards (fast, premium)

- Hover on glass cards: slight lift + slightly stronger border + subtle shadow

## 3) Authenticated App Style (Reference #2: clean dashboard)

### Layout

- Soft light background with a centered “app frame” feel

- Outer container with large rounding (~28–40px)

- Inside: left sidebar + top bar + content area

### Sidebar

- Icons + labels

- Active item uses a filled pill highlight (accent color)

- Sidebar background is slightly tinted/elevated from main background

- Keep sidebar simple (no clutter)

### Top bar

- Search input on the left (rounded)

- Right side: notification icons + user avatar/profile

- Top bar stays consistent across all /app routes

### Content area

- Card-based panels and lists

- Cards have:

  - rounded corners (~16–24px)

  - subtle shadow OR subtle border (not both heavy)

  - consistent padding and spacing

- Buttons:

  - Primary = filled accent

  - Secondary = outline or light fill

  - Icon buttons = circular, subtle bg, clear hover state

### Typography

- Clear hierarchy:

  - Page title large and bold

  - Section headers medium

  - Labels small and muted

  - Body text readable, not cramped

## 4) Shared Component Rules (Use Everywhere)

- Use an 8px spacing grid

- Consistent radii:

  - cards ~16–24px

  - large containers ~28–40px

  - pills fully rounded

- Inputs:

  - Rounded, subtle border

  - Visible focus ring (not aggressive)

- Badges/Chips:

  - For statuses: High risk / Low risk / Unknown / Needs verification

- Tables:

  - Only if needed; prefer cards for readability

- Empty states:

  - Friendly message + single clear CTA (e.g., “Search an address”)

## 5) Do-Not List

- No harsh borders

- No tiny text

- No dense, cramped layouts

- No random colors everywhere

- No inconsistent rounding

- Do not break existing business logic or remove features

