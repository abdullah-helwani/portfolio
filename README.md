# Abdullah Helwani — portfolio

A gamified, animated personal site with its own owner dashboard. Built with Next.js 16 (App Router),
Tailwind CSS v4 and Motion.

## What's inside

**The site**

- **Hero:** WebGL aurora shader (adapted from 21st.dev `isaiahbjork/shader-aurora-veil`), per-letter name reveal,
  rotating "currently into" line, scroll parallax.
- **Skills character sheet:** your classes (AI & ML, Data Science, Software, Front-end, Back-end, Full-stack) with
  levels, XP bars, an animated radar chart, an inspectable class detail and a hoverable skill inventory.
- **Journey:** a timeline whose rail draws itself as you scroll.
- **Work:** bento grid whose tiles tip into place on scroll, tilt on hover and carry a cursor spotlight
  (adapted from 21st.dev `ibelick/spotlight`).
- **Playground:** a CSS-3D retro computer that turns as you scroll, tilts toward the mouse and runs a playable
  Snake game. The keyboard keys light up as you play.
- **Build log:** "Done / In progress / Up next" board on the homepage, plus `/log` and `/log/[slug]` pages.
- **Services:** cards that stack as you scroll.
- **Contact:** a real form that delivers messages to the dashboard, plus all your contact links.
- **The World (`/world`):** create a character and walk through the portfolio as a side-scroller: About house,
  skill orbs, journey signposts, project kiosks, log board, arcade and a mailbox that opens the contact form.
  It has quests, collectibles, a minimap and touch controls.
- **Gamification everywhere:** visitor XP and levels, 17 achievements (some secret), toasts, and a
  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd> command palette.

**The dashboard (`/dashboard`)**

Password-protected. You can:

- see page views for the last 30 days and the latest messages
- toggle your availability
- read, archive, search and delete messages
- add, edit, reorder, feature and hide projects
- publish log entries as shipped, building or planned (drafts and pinning included)
- edit skill classes and skill levels
- edit the journey, services and tool marquee
- edit your profile and contact links, and upload your **logo** and **CV**

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
Fly.io with a volume. Set `ADMIN_PASSWORD`, `SESSION_SECRET` and (optionally) `DATA_DIR` there.

Serverless hosts such as Vercel have a read-only filesystem. The public site would work there, but dashboard
edits and contact messages would fail until `src/lib/store.ts` is swapped for a database (only `getDb` and
`updateDb` need to change).

Design notes and references: [`.design/inspiration.md`](.design/inspiration.md).
