"use server";

import { revalidatePath } from "next/cache";
import { newId, updateDb } from "@/lib/store";

export type ContactState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "body", string>>;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function sendMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // Honeypot: real people never see or fill this field.
  if (String(formData.get("company") ?? "").trim()) {
    return { status: "success", message: "Thanks, your message is on its way." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  const fieldErrors: ContactState["fieldErrors"] = {};
  if (name.length < 2) fieldErrors.name = "Tell me what to call you.";
  if (name.length > 80) fieldErrors.name = "That name is a bit long. Keep it under 80 characters.";
  if (!emailPattern.test(email)) fieldErrors.email = "That email doesn't look right. Check for typos.";
  if (body.length < 10) fieldErrors.body = "Add a little more detail (10 characters or more).";
  if (body.length > 4000) fieldErrors.body = "Keep it under 4,000 characters.";

  if (Object.keys(fieldErrors).length) {
    return { status: "error", message: "A couple of fields need another look.", fieldErrors };
  }

  try {
    await updateDb((db) => {
      db.messages.unshift({
        id: newId(),
        name,
        email,
        body,
        createdAt: new Date().toISOString(),
        read: false,
        archived: false,
      });
      // keep the inbox bounded
      db.messages = db.messages.slice(0, 1000);
    });
  } catch {
    return {
      status: "error",
      message: "Your message couldn't be saved right now. Please try again in a minute.",
    };
  }

  revalidatePath("/dashboard", "layout");
  return { status: "success", message: "Thanks! Your message landed in my inbox. I'll reply soon." };
}
