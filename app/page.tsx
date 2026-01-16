"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loading } from "@/components/ui/loading";
import { LandingPage } from "@/components/landing/landing-page";

export default function Home() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/notes");
    }
  }, [status, router]);

  // Show loading while checking auth status
  if (status === "loading") {
    return <Loading fullScreen />;
  }

  // Show landing page for unauthenticated users
  if (status === "unauthenticated") {
    return <LandingPage />;
  }

  // Fallback (shouldn't reach here)
  return <Loading fullScreen />;
}
