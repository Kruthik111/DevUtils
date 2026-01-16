"use client";

import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { StaggerContainer, StaggerItem } from "./scroll-animations";

const steps = [
  {
    number: "01",
    title: "Sign In with Google",
    description:
      "Get started instantly with secure Google authentication. Your account is created automatically with role-based access controls.",
    icon: CheckCircle,
  },
  {
    number: "02",
    title: "Build Your Vault",
    description:
      "Add commands, snippets, links, and notes to your searchable clipboard vault. Organize everything in one place.",
    icon: CheckCircle,
  },
  {
    number: "03",
    title: "Configure APIs",
    description:
      "Store API configurations with headers, params, and environments. Test APIs directly from mobile without needing a laptop.",
    icon: CheckCircle,
  },
  {
    number: "04",
    title: "Customize & Use",
    description:
      "Personalize your interface with themes and dark mode. Access your vault instantly with click-to-copy functionality.",
    icon: CheckCircle,
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <StaggerContainer className="text-center mb-16">
          <StaggerItem>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold mb-4 text-black"
            >
              How It{" "}
              <span className="text-gray-600">
                Works
              </span>
            </motion.h2>
          </StaggerItem>
          <StaggerItem>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xl text-gray-600 max-w-2xl mx-auto"
            >
              Get started in minutes and transform your development workflow
            </motion.p>
          </StaggerItem>
        </StaggerContainer>

        <div className="relative">
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            {steps.map((step, index) => (
              <StaggerItem key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  {/* Step number badge - positioned above and slightly to the left */}
                  <div className="relative mb-6 flex items-center">
                    <div
                      className={cn(
                        "w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-purple-700",
                        "flex items-center justify-center text-xl font-bold text-white",
                        "shadow-lg z-10 relative -ml-2"
                      )}
                    >
                      {step.number}
                    </div>
                    {/* Progress arrow between badges */}
                    {index < steps.length - 1 && (
                      <ArrowRight className="hidden lg:block w-5 h-5 text-purple-600 ml-2" />
                    )}
                  </div>

                  {/* Step content card */}
                  <div
                    className={cn(
                      "relative p-6 rounded-xl bg-white",
                      "border border-gray-200 shadow-md",
                      "hover:shadow-xl transition-all duration-300"
                    )}
                  >
                    {/* Purple line along top edge */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-purple-600 rounded-t-xl" />
                    
                    {/* Checkmark icon at top-left of content */}
                    <div className="mb-4">
                      <step.icon className="w-6 h-6 text-purple-600" />
                    </div>
                    
                    {/* Step title */}
                    <h3 className="text-lg font-bold mb-3 text-black">{step.title}</h3>
                    
                    {/* Step description */}
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}
