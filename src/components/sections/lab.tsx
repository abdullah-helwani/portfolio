import { LabStage } from "@/components/lab/lab";
import type { AiDemo } from "@/lib/site";
import { SectionHeader, type SectionProps } from "./section-header";

export function Lab({ demos, section, index }: { demos: AiDemo[] } & SectionProps) {
  const visible = demos.filter((d) => d.visible);
  if (!visible.length) return null;
  return (
    <section id="lab" className="mx-auto max-w-[1400px] px-5 py-28 md:px-10 md:py-36">
      <SectionHeader section={section} index={index} />
      <LabStage demos={visible} />
    </section>
  );
}
