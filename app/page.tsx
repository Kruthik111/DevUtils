"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loading } from "@/components/ui/loading";

export default function Home() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/notes");
    } else if (status === "unauthenticated") {
      router.replace("/json-tools");
    }
  }, [status, router]);

  return <Loading fullScreen />;
}
