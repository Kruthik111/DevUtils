"use client";

import { motion } from "framer-motion";
import {
  StickyNote,
  Code,
  Users,
  Zap,
  Shield,
  Cloud,
  Database,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StaggerContainer, StaggerItem } from "./scroll-animations";

const features = [
  {
    icon: StickyNote,
    title: "Searchable Clipboard Vault",
    description:
      "Centralize frequently used developer commands, snippets, links, and notes into a single, searchable clipboard vault with instant copy and click-to-copy access.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Code,
    title: "Mobile API Testing",
    description:
      "Store, configure, and trigger APIs (headers, params, environments) directly from mobile, eliminating dependency on laptops for routine API checks.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Zap,
    title: "Reduce Context Switching",
    description:
      "Reduce repetitive setup and context switching by providing ready-to-run API configurations and reusable technical references in one place.",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: Shield,
    title: "Secure Access",
    description:
      "Secure access via Google authentication with role-based controls, ensuring user-level isolation and admin-managed access.",
    color: "from-red-500 to-rose-500",
  },
  {
    icon: Sparkles,
    title: "Customizable Interface",
    description:
      "Improve daily developer efficiency through a customizable, dark-mode–optimized interface with themes and background personalization for long-term use.",
    color: "from-indigo-500 to-blue-500",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 md:py-32 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <StaggerContainer className="text-center mb-16">
          <StaggerItem>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold mb-4 text-black"
            >
              Everything You Need to{" "}
              <span className="text-gray-600">
                Succeed
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
              Everything you need to centralize your developer tools, reduce context switching, and boost daily productivity.
            </motion.p>
          </StaggerItem>
        </StaggerContainer>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <StaggerItem key={index}>
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "group relative p-8 rounded-2xl",
                  "bg-gray-50 border border-gray-200",
                  "hover:border-purple-300 transition-all duration-300",
                  "hover:shadow-xl hover:shadow-purple-100"
                )}
              >
                <div
                  className={cn(
                    "w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700",
                    "flex items-center justify-center mb-6",
                    "group-hover:scale-110 transition-transform duration-300"
                  )}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-black group-hover:text-purple-700 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
