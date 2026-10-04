# Inspiration Board

**FILTER:** Ethereal Glass (restrained) · VARIANCE 8 · MOTION 8 · DENSITY 3 · dark, cool-tinted neutrals, one teal accent with an ember counter-glow taken from the shader.

## Signature moment
Hero name assembled from per-letter mask reveals sitting on a live WebGL aurora
(21st.dev — `isaiahbjork/shader-aurora-veil`). On scroll the copy lifts and fades
while the aurora scales slowly behind it (depth parallax).

## Pattern cards

| Section | Reference pattern | Steal | Leave behind |
|---|---|---|---|
| Navbar | navbar.gallery: floating pill nav | Detached rounded pill, blur only on the pill, status dot | Edge-to-edge bar, mega menus |
| Hero | unsection.com split heroes + motionsites.ai shader openers | Left-aligned oversized name, small meta column on the right, live background | Centered stack, gradient text |
| Stack marquee | unsection.com logo rows | Slow infinite marquee, edge fade mask | Logo walls with brand colours |
| About | Editorial split | Sticky label column, large statement paragraph with muted/bright word contrast | Bulleted “about me” lists |
| Work | bentogrids.com asymmetric bento | 6-column grid, one hero tile spanning 4, small tiles 2, cursor spotlight border | 3 equal cards |
| Focus | unsection.com numbered lists | `divide-y` rows, mono index numbers, hover row shift | Icon-card grid |
| CTA band | cta.gallery statement CTA | One huge line, magnetic primary button | Newsletter form |
| Footer | footer.design statement footer | Oversized wordmark clipped at the bottom, minimal links, local time | Link dump |
| 404 | 404s.design typographic 404 | Big “404”, brand-voice line, two recovery routes | “Oops!” |

## Micro-motion list
- Buttons: `scale(0.97)` on press, 160ms.
- Magnetic CTA: `useMotionValue` + `useSpring`, pointer-fine devices only.
- Project tiles: cursor-following spotlight border (21st.dev — `ibelick/spotlight`, rewritten to use transforms and to clean up its listeners).
- Section reveals: fade + 24px rise + 4px blur, once, 700ms ease-out.
- Scroll progress hairline at the top.

## Rejected
- Three.js instanced-mesh hero (too heavy for a personal page, extra dependency).
- Custom cursors, gradient text, glassmorphism on every card.
