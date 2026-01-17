"use client";

import { motion } from "framer-motion";
import { MessageSquare, Send, Mail } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { StaggerContainer, StaggerItem } from "./scroll-animations";
import { useSession } from "next-auth/react";

export function FeedbackSection() {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

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
    <section id="feedback" className="py-24 md:py-32 bg-gray-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-400 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <StaggerContainer className="text-center mb-12">
          <StaggerItem>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 mb-6"
            >
              <MessageSquare className="w-8 h-8 text-white" />
            </motion.div>
          </StaggerItem>
          <StaggerItem>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold mb-4 text-black"
            >
              Share Your{" "}
              <span className="text-gray-600">Feedback</span>
            </motion.h2>
          </StaggerItem>
          <StaggerItem>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xl text-gray-600 max-w-2xl mx-auto"
            >
              We'd love to hear from you! Your feedback helps us improve DevUtils.
            </motion.p>
          </StaggerItem>
        </StaggerContainer>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-10"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Display user info */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-2">Submitting as:</p>
              <p className="font-medium text-black">
                {session?.user?.name || "User"}
              </p>
              <p className="text-sm text-gray-600">
                {session?.user?.email}
              </p>
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Your Feedback
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                className={cn(
                  "w-full px-4 py-3 rounded-xl border border-gray-300",
                  "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent",
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
                  "bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold",
                  "hover:from-purple-700 hover:to-purple-800 transition-all duration-200",
                  "hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                  "shadow-lg hover:shadow-xl shadow-purple-500/30"
                )}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
    </section>
  );
}
