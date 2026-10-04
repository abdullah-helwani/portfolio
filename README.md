# Abdullah Helwani — personal landing page

An animated personal site built with Next.js (App Router), Tailwind CSS v4 and Motion.

- **Hero:** per-letter mask reveal of the name over a live WebGL aurora shader
  (adapted from 21st.dev `isaiahbjork/shader-aurora-veil`), with scroll parallax on desktop.
- **Work:** asymmetric bento grid with a cursor spotlight border
  (adapted from 21st.dev `ibelick/spotlight`) and small SVG illustrations per project.
- **About:** word-by-word scroll-linked text reveal.
- **Contact:** magnetic button on a second aurora panel.
- Respects `prefers-reduced-motion`, disables parallax under 768px, and falls back
  to a CSS gradient when WebGL is unavailable.

## Edit your content

Everything personal (name, intro, projects, stack, links, email) lives in
[`src/lib/site.ts`](src/lib/site.ts). Set `email` or `linkedin` there to show them in the contact section.

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

## Deploy

Push to GitHub and import the repo on [Vercel](https://vercel.com/new); no configuration needed.

Design notes and references: [`.design/inspiration.md`](.design/inspiration.md).
