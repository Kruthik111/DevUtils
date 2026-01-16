"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { StaggerContainer, StaggerItem } from "./scroll-animations";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Senior Developer",
    company: "TechCorp",
    avatar: "SC",
    quote:
      "DevUtils has completely transformed how I manage my development workflow. The notes feature is incredibly intuitive, and API testing has never been easier.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "Michael Rodriguez",
    role: "Full Stack Engineer",
    company: "StartupXYZ",
    avatar: "MR",
    quote:
      "I never used this APP",
    color: "from-purple-500 to-pink-500",
  },
  {
    name: "Emily Johnson",
    role: "DevOps Lead",
    company: "CloudScale",
    avatar: "EJ",
    quote:
      "We have google notes, oneNote and other note taking app why should I use.",
    color: "from-green-500 to-emerald-500",
  },
  {
    name: "David Kim",
    role: "Product Manager",
    company: "InnovateLab",
    avatar: "DK",
    quote:
      "The speed and reliability of DevUtils is impressive. It's become an essential tool for our entire engineering team.",
    color: "from-orange-500 to-red-500",
  },
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section id="testimonials" className="py-24 md:py-32 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <StaggerContainer className="text-center mb-16">
          <StaggerItem>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold mb-4 text-black"
            >
              Loved by{" "}
              <span className="text-gray-600">
                Developers
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
              See what developers are saying about DevUtils
            </motion.p>
          </StaggerItem>
        </StaggerContainer>

        <div className="relative max-w-4xl mx-auto">
          <div className="relative">
            {/* Navigation buttons - Top right */}
            <div className="absolute top-0 right-0 flex gap-2 z-20">
              <button
                onClick={goToPrevious}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                className={cn(
                  "w-10 h-10 rounded-full bg-white border-2 border-gray-200",
                  "flex items-center justify-center text-gray-700",
                  "hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600",
                  "transition-all duration-200 shadow-lg"
                )}
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={goToNext}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                className={cn(
                  "w-10 h-10 rounded-full bg-white border-2 border-gray-200",
                  "flex items-center justify-center text-gray-700",
                  "hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600",
                  "transition-all duration-200 shadow-lg"
                )}
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                className={cn(
                  "relative p-6 md:p-8 lg:p-12 rounded-3xl",
                  "bg-gray-50 border border-gray-200",
                  "shadow-2xl"
                )}
              >
                <Quote className="w-10 h-10 md:w-12 md:h-12 text-purple-200 absolute top-4 md:top-6 left-4 md:left-6" />
                <p className="text-lg md:text-xl lg:text-2xl text-black mb-6 md:mb-8 relative z-10 pl-6 md:pl-8">
                  "{testimonials[currentIndex].quote}"
                </p>
                <div className="flex items-center gap-3 md:gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-purple-600 to-purple-700",
                      "flex items-center justify-center text-white font-bold text-base md:text-lg"
                    )}
                  >
                    {testimonials[currentIndex].avatar}
                  </div>
                  <div>
                    <div className="font-bold text-base md:text-lg text-black">
                      {testimonials[currentIndex].name}
                    </div>
                    <div className="text-sm md:text-base text-gray-600">
                      {testimonials[currentIndex].role} at{" "}
                      {testimonials[currentIndex].company}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation dots */}
            <div className="flex items-center justify-center gap-2 mt-6 md:mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === currentIndex
                      ? "w-8 bg-purple-600"
                      : "bg-gray-300 hover:bg-purple-300"
                  )}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
