import { SiteBackground } from "@/components/fx/background";
import { Intro } from "@/components/fx/intro";
import { GameProvider } from "@/components/game/game-provider";
import { AchievementsPanel, CommandPalette } from "@/components/game/quest-ui";
import { Footer } from "@/components/layout/footer";
import { Nav } from "@/components/layout/nav";
import { ViewBeacon } from "@/components/layout/view-beacon";
import { publicVideos } from "@/components/sections/videos";
import { getContent } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const { profile, copy, sections, card, game, videos, demos } = await getContent();
  const hide = [...(publicVideos(videos).length ? [] : (["videos"] as const)), ...(demos.some((d) => d.visible) ? [] : (["lab"] as const))];
  return (
    <GameProvider config={game}>
      <SiteBackground rain={copy.rainEnabled} />
      <Intro name={profile.name} line={copy.introLine} enabled={copy.introEnabled} />
      <Nav name={profile.name} github={profile.github} logoUrl={profile.logoUrl} sections={sections} card={card.enabled && card.showInNav} />
      {children}
      <Footer profile={profile} copy={copy} sections={sections} card={card} hide={hide} />
      <AchievementsPanel />
      <CommandPalette github={profile.github} email={profile.email} />
      <ViewBeacon />
    </GameProvider>
  );
}
