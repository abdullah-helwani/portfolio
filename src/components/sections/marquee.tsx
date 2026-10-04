"use client";

import { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { Asterisk } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

const wrap = (min: number, max: number, v: number) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

function VelocityRow({
  items,
  baseVelocity,
  outlined = false,
}: {
  items: string[];
  baseVelocity: number;
  outlined?: boolean;
}) {
  const reduce = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 4], { clamp: false });
  const skew = useTransform(smoothVelocity, [-2500, 0, 2500], [10, 0, -10]);
  const transform = useTransform(
    [baseX, skew],
    ([x, s]: number[]) => `translate3d(${wrap(-25, 0, x)}%, 0, 0) skewX(${s}deg)`,
  );
  const direction = useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    let moveBy = direction.current * baseVelocity * (delta / 1000);
    const factor = velocityFactor.get();
    if (factor < 0) direction.current = -1;
    else if (factor > 0) direction.current = 1;
    moveBy += direction.current * moveBy * factor;
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="mask-fade-x overflow-hidden">
      <motion.ul className="flex w-max items-center will-change-transform" style={{ transform }}>
        {[0, 1, 2, 3].map((copy) =>
          items.map((item) => (
            <li
              key={`${copy}-${item}`}
              aria-hidden={copy > 0}
              className={cn(
                "flex items-center gap-8 whitespace-nowrap pr-8 text-4xl font-semibold tracking-[-0.04em] md:text-7xl",
                outlined
                  ? "font-serif font-normal italic text-transparent [-webkit-text-stroke:1px_rgb(214_232_228/0.35)]"
                  : "text-fg/85",
              )}
            >
              {item}
              <Asterisk size={28} weight="bold" className={outlined ? "text-ember/70" : "text-accent"} />
            </li>
          )),
        )}
      </motion.ul>
    </div>
  );
}

export function StackMarquee({ stack }: { stack: string[] }) {
  if (!stack.length) return null;
  const half = Math.ceil(stack.length / 2);
  return (
    <section aria-label="Tools I work with" className="relative space-y-3 overflow-hidden border-y border-line py-10 md:py-14">
      <VelocityRow items={stack.slice(0, half)} baseVelocity={-2.2} />
      <VelocityRow items={stack.slice(half).length ? stack.slice(half) : stack} baseVelocity={2.2} outlined />
    </section>
  );
}
