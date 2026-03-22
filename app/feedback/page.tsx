"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MessageSquare, Send, Mail, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loading } from "@/components/ui/loading";

export default function FeedbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  if (status === "loading") {
    return <Loading fullScreen />;
  }

  if (status === "unauthenticated") {
    router.push("/signin");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      setSubmitStatus("success");
      setMessage("");
      
      // Reset success message after 3 seconds
      setTimeout(() => setSubmitStatus("idle"), 3000);
    } catch (error) {
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus("idle"), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-6 shadow-lg shadow-primary/20">
            <MessageSquare className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Share Your{" "}
            <span className="text-gray-600 dark:text-gray-400">Feedback</span>
          </h1>
          <p className="text-xl text-foreground/60 max-w-2xl mx-auto">
            We'd love to hear from you! Your feedback helps us improve DevUtils.
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl p-8 md:p-10"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Display user info */}
            <div className="bg-foreground/5 border border-border rounded-xl p-4">
              <p className="text-sm text-foreground/60 mb-2">Submitting as:</p>
              <p className="font-medium text-foreground">
                {session?.user?.name || "User"}
              </p>
              <p className="text-sm text-foreground/60">
                {session?.user?.email}
              </p>
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Your Feedback *
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                className={cn(
                  "w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                  "transition-all duration-200 resize-none"
                )}
                placeholder="Tell us what you think..."
              />
            </div>
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "flex items-center gap-2 px-8 py-3 rounded-xl",
                  "bg-primary text-primary-foreground font-semibold",
                  "hover:bg-primary/90 transition-all duration-200",
                  "hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                  "shadow-lg hover:shadow-xl shadow-primary/30"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Feedback
                  </>
                )}
              </button>
              {submitStatus === "success" && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-green-600 text-sm"
                >
                  <Mail className="w-4 h-4" />
                  Thank you! Your feedback has been sent.
                </motion.div>
              )}
              {submitStatus === "error" && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-red-600 text-sm"
                >
                  Something went wrong. Please try again.
                </motion.div>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
