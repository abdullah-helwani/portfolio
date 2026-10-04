import { CheckCircle, Hammer, Compass } from "@phosphor-icons/react/dist/ssr";
import type { PostStatus } from "@/lib/site";
import { cn } from "@/lib/utils";

export const statusMeta: Record<PostStatus, { label: string; column: string; className: string; dot: string; Icon: typeof CheckCircle }> = {
  shipped: { label: "Shipped", column: "Done", className: "text-accent border-accent/40 bg-accent/10", dot: "bg-accent", Icon: CheckCircle },
  building: { label: "Building", column: "In progress", className: "text-[#f6c177] border-[#f6c177]/40 bg-[#f6c177]/10", dot: "bg-[#f6c177]", Icon: Hammer },
  planned: { label: "Planned", column: "Up next", className: "text-[#a9b8ff] border-[#a9b8ff]/40 bg-[#a9b8ff]/10", dot: "bg-[#a9b8ff]", Icon: Compass },
};

export function StatusPill({ status, className }: { status: PostStatus; className?: string }) {
  const m = statusMeta[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", m.className, className)}>
      <m.Icon size={12} weight="fill" />
      {m.label}
    </span>
  );
}

export function formatDate(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
