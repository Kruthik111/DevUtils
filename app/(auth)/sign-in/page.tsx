"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Chrome } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const [isLoading, setIsLoading] = useState(false);
  const { authState, signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");
  const errorMessage = authError
    ? "Sign-in failed because Google isn’t configured for this site. Please contact your admin or try again later."
    : null;

  useEffect(() => {
    // If already authenticated, redirect to notes
    if (authState.isAuthenticated) {
      router.push("/notes");
    }
  }, [authState.isAuthenticated, router]);

  const handleGoogleSignIn = () => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      toast.error("Google sign-in isn’t configured. Add your NEXT_PUBLIC_GOOGLE_CLIENT_ID to .env.local.");
      return;
    }

    setIsLoading(true);
    signIn("google", { callbackUrl: "/notes" }).catch(() => {
      toast.error("Google sign-in failed. Please try again.");
      setIsLoading(false);
    });
  };

  // Don't show sign-in if already authenticated
  if (authState.isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center from-background via-background to-primary/5 p-4">
      {/* Title at top */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2">
        <h1 className="text-4xl font-bold from-primary to-primary/60 bg-clip-text text-foreground">
          DevUtils
        </h1>
      </div>

      {/* Sign-in form */}
      <div className="w-full max-w-md mt-20">
        <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-foreground/60 text-sm">
              Sign in to access your developer tools
            </p>
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm p-3">
              {errorMessage}
            </div>
          )}

          {/* Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className={cn(
              "w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl",
              "bg-background border-2 border-border/50",
              "hover:bg-primary/10 hover:border-primary/50",
              "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "shadow-lg hover:shadow-xl"
            )}
          >
            <Chrome className="w-5 h-5" />
            <span className="font-medium">
              {isLoading ? "Signing in..." : "Sign in with Google"}
            </span>
          </button>

          {/* Info */}
          <p className="text-center text-xs text-foreground/40">
            This is a dummy sign-in page. Google OAuth will be implemented later.
          </p>
        </div>
      </div>
    </div>
  );
}

