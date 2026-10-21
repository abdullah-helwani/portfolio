import type { Accessory } from "@/lib/site";

/** Flat front view of the voxel character, for previews outside the 3D scene. */
export function AvatarSvg({ shirt, pants, hair, skin, accessory, className }: { shirt: string; pants: string; hair: string; skin: string; accessory: Accessory; className?: string }) {
  return (
    <svg viewBox="0 0 40 64" className={className} role="img" aria-label="Character preview">
      <rect x="13" y="44" width="6" height="16" rx="1" fill={pants} />
      <rect x="21" y="44" width="6" height="16" rx="1" fill={pants} />
      <rect x="12" y="58" width="7" height="3" rx="1" fill="#e8eeec" />
      <rect x="21" y="58" width="7" height="3" rx="1" fill="#e8eeec" />
      <rect x="11" y="25" width="18" height="20" rx="2" fill={shirt} />
      <rect x="6" y="26" width="5" height="16" rx="2" fill={shirt} />
      <rect x="29" y="26" width="5" height="16" rx="2" fill={shirt} />
      <rect x="6" y="40" width="5" height="4" rx="1.5" fill={skin} />
      <rect x="29" y="40" width="5" height="4" rx="1.5" fill={skin} />
      <rect x="12" y="7" width="16" height="17" rx="3" fill={skin} />
      <rect x="11" y="5" width="18" height="6" rx="2.5" fill={hair} />
      <rect x="16" y="14" width="2" height="2.6" rx="0.8" fill="#101314" />
      <rect x="22" y="14" width="2" height="2.6" rx="0.8" fill="#101314" />
      <rect x="17.5" y="19.5" width="5" height="1.2" rx="0.6" fill="#7a4a35" />
      {accessory === "cap" ? (
        <>
          <rect x="10.5" y="3" width="19" height="6" rx="2.5" fill={shirt} />
          <rect x="20" y="7" width="12" height="2.2" rx="1" fill={shirt} />
        </>
      ) : null}
      {accessory === "headphones" ? (
        <>
          <path d="M10 14 C10 2, 30 2, 30 14" fill="none" stroke="#1d2226" strokeWidth="2.2" />
          <rect x="8" y="12" width="4" height="7" rx="1.5" fill="#1d2226" />
          <rect x="28" y="12" width="4" height="7" rx="1.5" fill="#1d2226" />
        </>
      ) : null}
    </svg>
  );
}
