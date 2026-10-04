import { GameProvider } from "@/components/game/game-provider";
import { AchievementsPanel, CommandPalette } from "@/components/game/quest-ui";
import { Footer } from "@/components/layout/footer";
import { Nav } from "@/components/layout/nav";
import { ViewBeacon } from "@/components/layout/view-beacon";
import { getContent } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const { profile } = await getContent();
  return (
    <GameProvider>
      <Nav name={profile.name} github={profile.github} logoUrl={profile.logoUrl} />
      {children}
      <Footer profile={profile} />
      <AchievementsPanel />
      <CommandPalette github={profile.github} email={profile.email} />
      <ViewBeacon />
    </GameProvider>
  );
}
