"use client";

import { useRef, useState } from "react";
import { CircleNotch, UploadSimple } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

export type UploadKind = "image" | "logo" | "portrait" | "card" | "mark" | "pdf" | "cv" | "media" | "video";

const accepts: Record<UploadKind, string> = {
  image: "image/png,image/jpeg,image/webp,image/gif",
  logo: "image/png,image/jpeg,image/webp,image/gif",
  portrait: "image/png,image/jpeg,image/webp",
  card: "image/png",
  mark: "image/png",
  pdf: "application/pdf",
  cv: "application/pdf",
  media: "image/png,image/jpeg,image/webp,image/gif,application/pdf",
  video: "video/mp4,video/webm,video/quicktime",
};

/** Sends a File or Blob straight to /api/admin/upload, reporting progress. */
export function uploadBlob(
  blob: Blob,
  kind: UploadKind,
  opts: { name?: string; title?: string; onProgress?: (p: number) => void } = {},
): Promise<{ url: string; id?: string }> {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({ kind, name: opts.name ?? (blob instanceof File ? blob.name : "upload") });
    if (opts.title) params.set("title", opts.title);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/admin/upload?${params}`);
    xhr.setRequestHeader("Content-Type", blob.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => e.lengthComputable && opts.onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      let body: { url?: string; id?: string; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && body.url) resolve({ url: body.url, id: body.id });
      else reject(new Error(body.error || "The upload failed. Try again."));
    };
    xhr.onerror = () => reject(new Error("The connection dropped during the upload."));
    xhr.send(blob);
  });
}

export function UploadButton({
  kind,
  onUploaded,
  label = "Upload",
  className,
}: {
  kind: UploadKind;
  onUploaded: (url: string, id?: string) => void;
  label?: string;
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={progress !== null}
        className={cn(
          "press inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-line-strong px-3.5 text-sm text-fg transition-colors duration-150 hover:border-fg/30 disabled:cursor-wait",
          className,
        )}
      >
        {progress !== null ? <CircleNotch size={15} className="animate-spin" /> : <UploadSimple size={15} />}
        {progress !== null ? `${Math.round(progress * 100)}%` : label}
      </button>
      <input
        ref={input}
        type="file"
        accept={accepts[kind]}
        className="sr-only"
        tabIndex={-1}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setError("");
          setProgress(0);
          try {
            const { url, id } = await uploadBlob(file, kind, { onProgress: setProgress });
            onUploaded(url, id);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed.");
          } finally {
            setProgress(null);
          }
        }}
      />
      {error ? <span className="text-xs text-ember">{error}</span> : null}
    </span>
  );
}
