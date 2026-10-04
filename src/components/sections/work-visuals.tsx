// Small, project-specific illustrations. Pure SVG/CSS, no images.

export function ClassroomVisual() {
  const seats = Array.from({ length: 24 }, (_, i) => i);
  const flagged = new Set([9]);
  const active = new Set([2, 5, 13, 16, 20, 22]);
  return (
    <div aria-hidden="true" className="rounded-2xl border border-line bg-bg/70 p-4 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        <span>Room 11-B · live</span>
        <span className="flex items-center gap-1.5 text-accent">
          <span className="size-1.5 rounded-full bg-accent" /> monitoring
        </span>
      </div>
      <div className="grid grid-cols-8 gap-2">
        {seats.map((i) => (
          <span
            key={i}
            className={
              flagged.has(i)
                ? "aspect-square rounded-md bg-ember/80 motion-safe:animate-pulse"
                : active.has(i)
                  ? "aspect-square rounded-md bg-accent/60"
                  : "aspect-square rounded-md bg-surface-2"
            }
            style={active.has(i) ? { animation: `pulse 2.4s ease-in-out ${i * 0.15}s infinite` } : undefined}
          />
        ))}
      </div>
      <div className="mt-4 flex items-end gap-1">
        {[38, 52, 44, 61, 57, 72, 66, 80, 74, 88, 82, 91].map((h, i) => (
          <span key={i} className="flex-1 rounded-sm bg-accent/25" style={{ height: `${h * 0.5}px` }} />
        ))}
      </div>
    </div>
  );
}

export function FuzzyVisual() {
  return (
    <svg aria-hidden="true" viewBox="0 0 240 90" className="h-auto w-full">
      <line x1="0" y1="80" x2="240" y2="80" stroke="var(--line-strong)" />
      <path d="M0 80 L0 10 L50 10 L95 80" fill="var(--accent)" fillOpacity="0.08" stroke="var(--accent)" strokeWidth="1.5" />
      <path d="M60 80 L120 10 L180 80" fill="var(--fg)" fillOpacity="0.05" stroke="var(--fg)" strokeOpacity="0.6" strokeWidth="1.5" />
      <path d="M145 80 L190 10 L240 10 L240 80" fill="var(--ember)" fillOpacity="0.08" stroke="var(--ember)" strokeWidth="1.5" />
      <line x1="132" y1="10" x2="132" y2="80" stroke="var(--fg)" strokeDasharray="3 4" strokeOpacity="0.5" />
    </svg>
  );
}

export function ScatterVisual() {
  const points: [number, number, 0 | 1][] = [
    [18, 22, 0], [34, 40, 0], [26, 58, 0], [48, 28, 0], [56, 50, 0], [40, 70, 0], [70, 34, 0],
    [130, 60, 1], [150, 30, 1], [170, 52, 1], [190, 24, 1], [160, 74, 1], [205, 62, 1], [120, 82, 1],
  ];
  return (
    <svg aria-hidden="true" viewBox="0 0 240 100" className="h-auto w-full">
      <path d="M90 0 C 110 30, 80 60, 110 100" fill="none" stroke="var(--fg)" strokeOpacity="0.35" strokeDasharray="4 5" />
      {points.map(([x, y, c], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill={c ? "var(--accent)" : "var(--ember)"} fillOpacity={c ? 0.85 : 0.7} />
      ))}
    </svg>
  );
}

export function SunVisual() {
  return (
    <div aria-hidden="true" className="relative grid aspect-square w-24 place-items-center">
      <span className="absolute inset-0 rounded-full border border-dashed border-ember/40 motion-safe:animate-[spin_24s_linear_infinite]" />
      <span className="absolute inset-3 rounded-full border border-line-strong" />
      <span className="size-9 rounded-full bg-gradient-to-br from-ember to-[#f6b26b] shadow-[0_0_40px_-4px_var(--ember)]" />
    </div>
  );
}

export function CodeVisual() {
  return (
    <pre aria-hidden="true" className="font-mono text-[11px] leading-5 text-muted">
      <span className="text-accent">&lt;h1&gt;</span>
      <span className="text-fg/80">Recipes</span>
      <span className="text-accent">&lt;/h1&gt;</span>
      {"\n"}
      <span className="text-accent">&lt;ul&gt;</span>
      {"\n  "}
      <span className="text-accent">&lt;li&gt;</span>
      <span className="text-fg/80">first commit</span>
      <span className="text-accent">&lt;/li&gt;</span>
      {"\n"}
      <span className="text-accent">&lt;/ul&gt;</span>
    </pre>
  );
}
