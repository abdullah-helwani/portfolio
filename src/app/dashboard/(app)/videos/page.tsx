import { VideosManager } from "@/components/dashboard/videos-manager";
import { PageHeader } from "@/components/dashboard/ui";
import { getDb } from "@/lib/store";
import { ffmpegAvailable } from "@/lib/video";

export default async function VideosPage() {
  const db = await getDb();
  return (
    <>
      <PageHeader title="Videos" description="Upload a video and it's branded with your logo at the start, the end and in the corner. Visitors can watch and download it." />
      <VideosManager videos={db.videos} branding={db.branding} logoUrl={db.profile.logoUrl} name={db.profile.name} tagline={db.profile.tagline} ffmpeg={ffmpegAvailable()} />
    </>
  );
}
