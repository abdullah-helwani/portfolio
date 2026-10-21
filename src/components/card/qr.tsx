import qrcode from "qrcode-generator";

// encode text as UTF-8 so names with accents or Arabic survive the scan
qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];

/** Server- or client-rendered QR code as a single SVG path. */
export function QrCode({ value, className, fg = "currentColor" }: { value: string; className?: string; fg?: string }) {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();
  const n = qr.getModuleCount();
  let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
  return (
    <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} className={className} role="img" aria-label="QR code" shapeRendering="crispEdges">
      <path d={d} fill={fg} />
    </svg>
  );
}
