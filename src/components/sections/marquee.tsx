import { Asterisk } from "@phosphor-icons/react/dist/ssr";
import { stack } from "@/lib/site";

export function StackMarquee() {
  const items = [...stack, ...stack];
  return (
    <section aria-label="Tools I work with" className="border-y border-line py-6">
      <div className="mask-fade-x overflow-hidden">
        <ul className="flex w-max animate-marquee items-center gap-10 hover:[animation-play-state:paused]">
          {items.map((item, i) => (
            <li
              key={`${item}-${i}`}
              aria-hidden={i >= stack.length}
              className="flex items-center gap-10 whitespace-nowrap text-2xl font-medium tracking-tight text-fg/70 md:text-3xl"
            >
              {item}
              <Asterisk size={18} weight="bold" className="text-accent/70" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
