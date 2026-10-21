# Abdullah Helwani — portfolio

A gamified, animated personal site with its own owner dashboard. Built with Next.js 16 (App Router),
Tailwind CSS v4 and Motion.

## What's inside

**The site**

- **First second:** a code-rain intro that decodes your name, then opens onto the site (once per visit, skippable).
- **Background:** falling code over slow colour fields that drift as you scroll.
- **Hero:** your name decoding out of random glyphs, a terminal that types out your profile, rotating roles.
- **Résumé:** summary, experience, education, certifications (with PDF/verify links), courses, languages,
  toolbox and a CV download.
- **Skills character sheet**, **Journey** timeline, **Services** and **Build log** (`/log`).
- **Projects:** bento grid; every project has its own page (`/work/[id]`) with the live site in a browser frame,
  GitHub, the presentation (PDF / Google Slides / Canva), a video and a try-it demo.
- **AI Lab:** working demos visitors can run: sentiment reader, fuzzy tip controller, k-means, polynomial
  regression and a handwriting reader. Add your own models as an API (the server forwards the input and keeps
  your token secret) or embed a Hugging Face Space / Gradio / Streamlit app.
- **Arcade:** a 3D retro computer with a desktop and five games (Snake, Breakout, Flappy Bit, Memory, Code Typer),
  each with a named leaderboard.
- **Videos:** uploads are branded automatically with a logo card at the start and end and a logo watermark in the
  corner, then can be watched and downloaded (`/videos`).
- **Business card** (`/card`): hidden until you switch it on; QR code and a "Save contact" vCard.
- **The City (`/world`):** a 3D open-world island city. You stand in the plaza as the guide and greet new visitors
  with your own dialogue. Districts for your projects, skills, journey, log, arcade and post office, plus your own
  buildings on Maker's Avenue: visitors ride an elevator or walk through a door and your link opens. Cars stop for
  you and are solid, citizens chat, and a map with fast travel. Graphics adapt automatically (low / balanced /
  high) to keep it smooth.
- **Points:** XP, levels, achievements and rewards (messages, links, codes, a downloadable certificate, outfits
  for the City). Progress is kept with a first-party cookie, so it survives revisits without an account.

**The dashboard (`/dashboard`)**

Password-protected. Everything on the site is editable:

- **Pages & text:** reorder or hide sections, rewrite every label, heading and intro, the hero buttons, the intro,
  the footer, the journey and the services.
- **Projects**, **Résumé**, **Skills** and toolbox, **Build log**, **AI Lab** demos.
- **Videos:** upload (up to 1 GB), branding settings, re-brand, publish, download.
- **The City:** your guide's look and dialogue, extra places with links, citizens, traffic, billboards.
- **Points & rewards:** what earns XP and how much, and what visitors unlock.
- **Arcade:** remove leaderboard entries.
- **Business card:** on/off switch and details.
- **Profile & logo:** logo, portrait photo, CV and contact links. The logo is also the favicon and the video watermark.

## Run it locally

```bash
npm install
cp .env.example .env.local   # then set ADMIN_PASSWORD and SESSION_SECRET
npm run dev                  # http://localhost:3000, dashboard at /dashboard
```

## Where content lives

On first run the site uses the defaults in [`src/lib/site.ts`](src/lib/site.ts). As soon as you save anything from
the dashboard, content, messages, page-view counts and uploads are stored in `./data/` (git-ignored; change the
location with `DATA_DIR`).

## Deploying

The content store writes to disk, so deploy to a host with a persistent disk: a VPS, Railway, Render or
Fly.io with a volume. Set `ADMIN_PASSWORD`, `SESSION_SECRET` and `DATA_DIR` (the volume's mount path) there.

Video branding uses ffmpeg. `ffmpeg-static` downloads a binary during `npm install`; set `FFMPEG_PATH` to use a
different one. Without ffmpeg, uploads are published unbranded.

Serverless hosts such as Vercel have a read-only filesystem. The public site would work there, but dashboard
edits and contact messages would fail until `src/lib/store.ts` is swapped for a database (only `getDb` and
`updateDb` need to change).

Design notes and references: [`.design/inspiration.md`](.design/inspiration.md).
