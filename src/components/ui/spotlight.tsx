"use client";

// Adapted from 21st.dev — ibelick/spotlight.
// Moves with transforms instead of left/top and removes its listeners correctly.

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform, type SpringOptions } from "motion/react";
import { cn } from "@/lib/utils";

type SpotlightProps = {
  className?: string;
  size?: number;
  springOptions?: SpringOptions;
};

export function Spotlight({
  className,
  size = 220,
  springOptions = { bounce: 0, stiffness: 260, damping: 30 },
}: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const mouseX = useSpring(0, springOptions);
  const mouseY = useSpring(0, springOptions);
  const transform = useTransform(
    [mouseX, mouseY],
    ([x, y]: number[]) => `translate3d(${x - size / 2}px, ${y - size / 2}px, 0)`,
  );

  useEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const onMove = (event: PointerEvent) => {
      const { left, top } = parent.getBoundingClientRect();
      mouseX.set(event.clientX - left);
      mouseY.set(event.clientY - top);
    };
    const onEnter = (event: PointerEvent) => {
      const { left, top } = parent.getBoundingClientRect();
      mouseX.jump(event.clientX - left);
      mouseY.jump(event.clientY - top);
      setHovered(true);
    };
    const onLeave = () => setHovered(false);

    parent.addEventListener("pointermove", onMove);
    parent.addEventListener("pointerenter", onEnter);
    parent.addEventListener("pointerleave", onLeave);
    return () => {
      parent.removeEventListener("pointermove", onMove);
      parent.removeEventListener("pointerenter", onEnter);
      parent.removeEventListener("pointerleave", onLeave);
    };
  }, [mouseX, mouseY]);

  return (
    <motion.div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute left-0 top-0 rounded-full blur-2xl transition-opacity duration-300",
        hovered ? "opacity-100" : "opacity-0",
        className,
      )}
      style={{ width: size, height: size, transform }}
    />
  );
}
