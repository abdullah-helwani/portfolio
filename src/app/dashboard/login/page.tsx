import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuroraVeil } from "@/components/ui/shader-aurora-veil";
import { authConfigured, isAdmin } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  if (await isAdmin()) redirect("/dashboard");
  const configured = authConfigured();
  return (
    <AuroraVeil intensity={0.6} className="min-h-[100dvh]">
      <main className="grid min-h-[100dvh] place-items-center p-4">
        <div className="w-full max-w-[420px] rounded-[2rem] border border-line-strong bg-bg/75 p-8 shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9)] backdrop-blur-xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Owner area</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">Sign in to your dashboard</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Manage messages, projects, your build log, skills and profile.
          </p>
          {configured ? (
            <LoginForm />
          ) : (
            <div className="mt-6 rounded-2xl border border-ember/40 bg-ember/10 p-4 text-sm leading-relaxed text-fg/85">
              <p className="font-medium text-fg">The dashboard is locked</p>
              <p className="mt-1">
                Add <code className="rounded bg-bg px-1.5 py-0.5 font-mono text-xs">ADMIN_PASSWORD</code> and{" "}
                <code className="rounded bg-bg px-1.5 py-0.5 font-mono text-xs">SESSION_SECRET</code> to{" "}
                <code className="rounded bg-bg px-1.5 py-0.5 font-mono text-xs">.env.local</code>, then restart the server.
              </p>
            </div>
          )}
        </div>
      </main>
    </AuroraVeil>
  );
}
