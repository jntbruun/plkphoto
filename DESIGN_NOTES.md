# DESIGN_NOTES — PLKPHOTO

Design decisions documented for handoff and future reference.
Last updated: April 2026.

---

## Typography

### Display: Fraunces (variable)
Chosen for its editorial weight and optical-range flexibility. Fraunces is a "wonky" optical serif with a variable axis — it reads large without being aggressive, which is exactly what a photography portfolio needs. The softness of the letterforms complements rather than competes with the images.

- Used for: H1, H2, site name, introductory paragraphs
- Weight: light (300) as default for large sizes; semibold (600) for logo mark only
- Case: sentence case throughout — never all-caps (too loud)

Reference: andreashemb.com uses a similar editorial serif relationship.

### Body: Inter (variable)
The most invisible good sans-serif. Used for navigation, captions, metadata, form labels, UI. High legibility at small sizes, zero personality — which is the right call here. The photographs have the personality.

---

## Palette

Off-white, not white. `#F7F6F2` has a slight warmth that keeps the site from feeling clinical. Nature photography often has warm tones — a cold white would fight the images.

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#F7F6F2` | Page background |
| `--color-fg` | `#111111` | Text, borders |
| `--color-muted` | `#6B6B6B` | Secondary text, captions, metadata |
| `--color-line` | `#E5E3DD` | Dividers, subtle borders |

No accent colour. The photographs provide all the colour the site needs. Adding a brand blue or green would compete. Typography weight and negative space carry the hierarchy instead.

---

## Spacing

Heavy use of section padding: `py-24 md:py-40`. This is intentional — images need room to breathe and the silence around them is part of the composition. Most photography sites feel cramped; this one shouldn't.

Text max-widths:
- Body / intro paragraphs: `max-w-[52ch]` — comfortable reading line
- Blog body: `max-w-[68ch]` — slightly wider for longer reading sessions

---

## Layout

### Gallery: Justified rows (react-photo-album)
Masonry was considered and rejected. Justified rows (horizontal strips of aligned heights) preserve aspect ratios while avoiding the visual jitter of masonry columns where images jump around. The result is calmer and more editorial — closer to a printed photobook layout.

Row target height: 400px on desktop. This shows detail without making images too large for context.

### Hero: CSS cross-fade (not GSAP slide)
The hero uses CSS opacity transitions between slides rather than a GSAP `xPercent` slide. This was the right call for a photography portfolio: cross-fading images feels slower, more contemplative, and respects the images more than a sliding transition that draws attention to the mechanism.

GSAP is available and registered — use it for future scroll-driven reveals if needed.

### Single image page (not modal)
Clicking a gallery image navigates to a dedicated URL rather than opening a lightbox/modal. Reasons:
1. Shareable URLs for each image (SEO + social)
2. Deeper metadata: title, location, date, description, print CTA
3. Better accessibility — no focus trapping issues
4. Cleaner on mobile

---

## Motion

Intentionally minimal. The brief said "no animation fireworks" — we followed that.

- CSS opacity transitions for hero cross-fade (1s)
- CSS scale `group-hover:scale-[1.02]` for image cards (700ms, `cubic-bezier(0.2,0.8,0.2,1)`)
- Framer Motion available for future micro-interactions
- GSAP registered but only used in HeroCarousel — no scroll triggers, no timeline complexity

All motion respects `prefers-reduced-motion`: transitions collapse to 0ms.

---

## Accessibility

- WCAG 2.1 AA target
- Skip link at top of page
- All images have localised `alt` text
- Keyboard navigation on carousel (←/→) and image pages (←/→/Esc)
- Focus rings: 2px solid `#111` offset — visible on off-white background
- `aria-roledescription="carousel"` + `role="tab"` on dot pagination

---

## References

- [andreashemb.com](https://andreashemb.com) — overall tone, serif display, restraint
- [aino.agency](https://aino.agency) — vocabulary of anti-sameness, phrasing
- [tobiasgjerde.com](https://tobiasgjerde.com) — collections structure
- [sigurdrolfsnes.no](https://sigurdrolfsnes.no) — general restraint and quiet confidence
