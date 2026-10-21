import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getContent } from "@/lib/store";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getContent();
  return {
    title: { default: `${profile.name} | ${profile.role}`, template: `%s | ${profile.name}` },
    description: profile.intro,
    openGraph: { title: profile.name, description: profile.intro, type: "website", images: profile.logoUrl ? [profile.logoUrl] : undefined },
    icons: profile.logoUrl ? { icon: profile.logoUrl, apple: profile.logoUrl } : undefined,
  };
}

export const viewport: Viewport = {
  themeColor: "#090b0c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="grain min-h-[100dvh]">{children}</body>
    </html>
  );
}
