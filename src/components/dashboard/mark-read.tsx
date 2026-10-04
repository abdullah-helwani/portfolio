"use client";

import { useEffect } from "react";
import { setMessageRead } from "@/app/dashboard/actions";

export function MarkRead({ id }: { id: string }) {
  useEffect(() => {
    const t = window.setTimeout(() => void setMessageRead(id, true), 800);
    return () => window.clearTimeout(t);
  }, [id]);
  return null;
}
