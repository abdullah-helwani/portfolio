import Link from "next/link";
import { ArrowLeft, GithubLogo } from "@phosphor-icons/react/dist/ssr";
import { Footer } from "@/components/layout/footer";
import { Nav } from "@/components/layout/nav";
import { AuroraVeil } from "@/components/ui/shader-aurora-veil";
import { site } from "@/lib/site";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main>
        <AuroraVeil intensity={0.6} className="min-h-[100dvh]">
          <div className="mx-auto flex min-h-[100dvh] max-w-[1400px] flex-col justify-end px-5 pb-16 pt-32 md:px-10">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Error 404</p>
            <h1 className="mt-4 text-[clamp(6rem,26vw,22rem)] font-semibold leading-[0.8] tracking-[-0.06em]">
              4<span className="font-serif font-normal italic text-accent">0</span>4
            </h1>
            <p className="mt-8 max-w-[44ch] text-lg leading-relaxed text-fg/75">
              This page wandered outside the training data. The model has no idea what lives here, but it knows
              the way home.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/"
                className="press inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-accent-ink"
              >
                <ArrowLeft size={16} weight="bold" />
                Back to the homepage
              </Link>
              <a
                href={site.github}
                target="_blank"
                rel="noreferrer"
                className="press inline-flex h-12 items-center gap-2 rounded-full border border-line-strong bg-bg/30 px-6 text-sm font-medium backdrop-blur-md"
              >
                <GithubLogo size={18} weight="fill" />
                Browse my GitHub
              </a>
            </div>
          </div>
        </AuroraVeil>
      </main>
      <Footer />
    </>
  );
}
