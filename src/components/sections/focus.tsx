import { Reveal } from "@/components/animations/reveal";
import { focus } from "@/lib/site";

export function Focus() {
  return (
    <section id="focus" className="mx-auto max-w-[1400px] px-5 py-28 md:px-10 md:py-36">
      <div className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-3">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted md:sticky md:top-28">
              <span className="text-accent">03</span> / Focus
            </p>
          </Reveal>
        </div>
        <h2 className="sr-only">What I focus on</h2>
        <ol className="divide-y divide-line border-y border-line md:col-span-9">
          {focus.map((item, i) => (
            <Reveal as="li" key={item.title} delay={i * 0.05}>
              <div className="group grid gap-3 py-8 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:grid-cols-[80px_1fr_1fr] md:items-baseline md:gap-8 md:py-10 [@media(hover:hover)]:hover:translate-x-2">
                <span className="font-mono text-sm tabular-nums text-muted transition-colors duration-300 group-hover:text-accent">
                  ({String(i + 1).padStart(2, "0")})
                </span>
                <h3 className="text-2xl font-medium tracking-[-0.03em] md:text-3xl">{item.title}</h3>
                <p className="max-w-[48ch] leading-relaxed text-muted">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
