import { GameProvider } from "@/components/game/game-provider";
import { AchievementsPanel, CommandPalette } from "@/components/game/quest-ui";
import { Nav } from "@/components/layout/nav";
import { ViewBeacon } from "@/components/layout/view-beacon";
import { getContent } from "@/lib/store";

export const dynamic = "force-dynamic";

// Full-screen game routes: same nav and progress, no footer.
export default async function GameLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getContent();
  return (
    <GameProvider>
      <Nav name={profile.name} github={profile.github} logoUrl={profile.logoUrl} />
      {children}
      <AchievementsPanel />
      <CommandPalette github={profile.github} email={profile.email} />
      <ViewBeacon />
    </GameProvider>
  );
}
