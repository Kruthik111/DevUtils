"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

export default function Home() {
  const router = useRouter();
  const { authState } = useAuth();

  useEffect(() => {
    if (authState.isAuthenticated) {
      router.push("/notes");
    } else {
      router.push("/sign-in");
    }
  }, [authState.isAuthenticated, router]);

  return null;
}
