"use client";

import type { ReactNode } from "react";

export default function ClientOnly({ children }: { children: ReactNode }) {
  return <>{children}</>;
}