// Uploaded files live in DATA_DIR/uploads and are served by /api/media/[file].

export const mediaTypes: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

export const mediaPrefixes = ["logo", "cv", "img", "doc", "portrait", "card", "mark", "video", "raw", "poster"] as const;
export type MediaPrefix = (typeof mediaPrefixes)[number];

export const mediaNamePattern = new RegExp(`^(${mediaPrefixes.join("|")})-[a-f0-9]{8}\\.(${Object.keys(mediaTypes).join("|")})$`);

export function extFor(type: string, filename = "") {
  const byType = Object.entries(mediaTypes).find(([, t]) => t === type)?.[0];
  if (byType) return byType;
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return ext === "jpeg" ? "jpg" : ext in mediaTypes ? ext : "";
}

export const mediaUrl = (name: string) => `/api/media/${name}`;
export const mediaNameFromUrl = (url: string) => (url.startsWith("/api/media/") ? url.slice("/api/media/".length) : "");
