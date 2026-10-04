import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Face = "front" | "back" | "left" | "right" | "top" | "bottom";

type BoxProps = {
  w: number;
  h: number;
  d: number;
  /** Position of the box centre relative to the parent centre, in px. */
  at?: [number, number, number];
  className?: string;
  faces?: Partial<Record<Face, string>>;
  front?: ReactNode;
  top?: ReactNode;
  style?: CSSProperties;
};

// Shading per face fakes a single light source above and to the left.
const defaultFaces: Record<Face, string> = {
  front: "bg-[#1c2326]",
  back: "bg-[#111618]",
  left: "bg-[#20282b]",
  right: "bg-[#12181a]",
  top: "bg-[#2a3337]",
  bottom: "bg-[#0b0f10]",
};

export function Box({ w, h, d, at = [0, 0, 0], className, faces, front, top, style }: BoxProps) {
  const f = { ...defaultFaces, ...faces };
  const face = "absolute left-0 top-0 [backface-visibility:hidden]";
  return (
    <div
      className={cn("absolute left-1/2 top-1/2 [transform-style:preserve-3d]", className)}
      style={{
        width: w,
        height: h,
        marginLeft: -w / 2,
        marginTop: -h / 2,
        transform: `translate3d(${at[0]}px, ${at[1]}px, ${at[2]}px)`,
        ...style,
      }}
    >
      <div className={cn(face, f.front)} style={{ width: w, height: h, transform: `translateZ(${d / 2}px)` }}>
        {front}
      </div>
      <div
        className={cn(face, f.back)}
        style={{ width: w, height: h, transform: `rotateY(180deg) translateZ(${d / 2}px)` }}
      />
      <div
        className={cn(face, f.right)}
        style={{ width: d, height: h, left: (w - d) / 2, transform: `rotateY(90deg) translateZ(${w / 2}px)` }}
      />
      <div
        className={cn(face, f.left)}
        style={{ width: d, height: h, left: (w - d) / 2, transform: `rotateY(-90deg) translateZ(${w / 2}px)` }}
      />
      <div
        className={cn(face, f.top)}
        style={{ width: w, height: d, top: (h - d) / 2, transform: `rotateX(90deg) translateZ(${h / 2}px)` }}
      >
        {top}
      </div>
      <div
        className={cn(face, f.bottom)}
        style={{ width: w, height: d, top: (h - d) / 2, transform: `rotateX(-90deg) translateZ(${h / 2}px)` }}
      />
    </div>
  );
}
