"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Chrome, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
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
    ? "Sign-in failed because Google isn't configured for this site. Please contact your admin or try again later."
    : null;

  useEffect(() => {
    // If already authenticated, redirect to notes
    if (authState.isAuthenticated) {
      router.push("/notes");
    }
  }, [authState.isAuthenticated, router]);

  const handleGoogleSignIn = () => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      toast.error("Google sign-in isn't configured. Add your NEXT_PUBLIC_GOOGLE_CLIENT_ID to .env.local.");
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
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Left Section - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-linear-to-br from-secondary to-accent">
        {/* Animated background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
            animate={{
              x: [0, -50, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-8"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              Developer Tools Reimagined
            </motion.span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="text-foreground">DevUtils</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-xl md:text-2xl text-foreground/70 max-w-md"
          >
            Centralize frequently used developer commands, snippets, links, and notes into a single, searchable clipboard vault with instant copy and click-to-copy access.
          </motion.p>
        </div>
      </div>

      {/* Right Section - Sign In */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 bg-background relative overflow-hidden">
        {/* Gradient background in corners - right section only */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-size-[40px_40px] bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)]" />
          <div className="absolute inset-0 mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] bg-primary/5" />
          {/* Top-right corner gradient */}
          <motion.div
            className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
            animate={{
              x: [0, -30, 0],
              y: [0, 30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Bottom-left corner gradient (of right section) */}
          <motion.div
            className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
            animate={{
              x: [0, 30, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">DevUtils</h1>
            <p className="text-foreground/60 text-sm">
              Developer Tools Reimagined
            </p>
          </div>

          {/* Sign In Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-secondary border-2 border-border rounded-2xl shadow-xl p-8 md:p-10 space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Welcome Back</h2>
              <p className="text-foreground/60 text-sm">
                Sign in to access your developer tools
              </p>
            </div>

            {errorMessage && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-500 text-sm p-3">
                {errorMessage}
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className={cn(
                "w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl",
                "bg-primary text-primary-foreground font-semibold",
                "hover:opacity-90 transition-all duration-200",
                "hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                "shadow-lg hover:shadow-xl shadow-primary/30"
              )}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <Chrome className="w-5 h-5" />
                  <span>Sign in with Google</span>
                </>
              )}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
