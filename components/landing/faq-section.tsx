"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StaggerContainer, StaggerItem } from "./scroll-animations";

const faqs = [
  {
    question: "Is DevUtils free to use?",
    answer:
      "Yes! DevUtils is free to use with access to all core features including notes, API testing, and team collaboration.",
  },
  {
    question: "How secure is my data?",
    answer:
      "Security is our top priority. All data is encrypted in transit and at rest. We use industry-standard security practices and never share your data with third parties.",
  },
  {
    question: "Can I use DevUtils offline?",
    answer:
      "DevUtils works best with an internet connection for real-time sync. However, you can access cached data offline, and changes will sync when you're back online.",
  },
  {
    question: "Can I export my data?",
    answer:
      "Yes! You can export all your notes, configurations, and data at any time. We believe in data portability and make it easy to take your data with you.",
  },
  {
    question: "What browsers are supported?",
    answer:
      "DevUtils works on all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version for the best experience.",
  },
  {
    question: "How do I get started?",
    answer:
      "Simply sign up with your Google account or email address. No credit card required. You'll be up and running in less than a minute!",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 md:py-32 bg-gray-50 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <StaggerContainer className="text-center mb-16">
          <StaggerItem>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold mb-4 text-black"
            >
              Frequently Asked{" "}
              <span className="text-gray-600">
                Questions
              </span>
            </motion.h2>
          </StaggerItem>
          <StaggerItem>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xl text-gray-600"
            >
              Everything you need to know about DevUtils
            </motion.p>
          </StaggerItem>
        </StaggerContainer>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "rounded-2xl bg-white",
                "border border-gray-200 overflow-hidden",
                "hover:border-purple-300 transition-all duration-300"
              )}
            >
              <Button
                variant="ghost"
                onClick={() => toggleFAQ(index)}
                className="w-full p-6 flex items-center justify-between text-left h-auto hover:bg-transparent"
              >
                <span className="text-lg font-semibold pr-8 text-black">{faq.question}</span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-5 h-5 text-purple-600 shrink-0" />
                </motion.div>
              </Button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
