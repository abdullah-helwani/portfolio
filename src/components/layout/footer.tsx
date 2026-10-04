import Link from "next/link";
import { ArrowUp } from "@phosphor-icons/react/dist/ssr";
import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="relative overflow-hidden">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-5 pt-16 text-sm text-muted md:flex-row md:items-center md:justify-between md:px-10">
        <p>
          &copy; {new Date().getFullYear()} {site.name}. Designed and built in the open.
        </p>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-6">
          <a href={site.github} target="_blank" rel="noreferrer" className="transition-colors duration-200 hover:text-fg">
            GitHub
          </a>
          <a href={site.url} target="_blank" rel="noreferrer" className="transition-colors duration-200 hover:text-fg">
            Source
          </a>
          <Link href="/#top" className="group inline-flex items-center gap-1.5 transition-colors duration-200 hover:text-fg">
            Back to top
            <ArrowUp size={14} className="transition-transform duration-300 group-hover:-translate-y-0.5" />
          </Link>
        </nav>
      </div>
      <p
        aria-hidden="true"
        className="pointer-events-none mt-8 select-none whitespace-nowrap text-center font-serif text-[clamp(5rem,24vw,24rem)] italic leading-[0.75] tracking-[-0.04em] text-transparent [-webkit-text-stroke:1px_rgb(214_232_228/0.22)] translate-y-[18%]"
      >
        {site.lastName}
      </p>
    </footer>
  );
}
