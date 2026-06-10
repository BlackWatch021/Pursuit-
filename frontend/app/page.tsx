"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Client-side redirect so this works on a static host (no server to issue a 307).
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return null;
}
