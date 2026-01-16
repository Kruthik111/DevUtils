"use client";

import { useEffect } from "react";
import { HeroSection } from "./hero-section";
import { FeaturesSection } from "./features-section";
import { HowItWorksSection } from "./how-it-works-section";
import { AppShowcaseSection } from "./app-showcase-section";
import { TestimonialsSection } from "./testimonials-section";
import { FAQSection } from "./faq-section";
import { Footer } from "./footer";
import { LandingNavbar } from "./navbar";

export function LandingPage() {
  useEffect(() => {
    // Add smooth scrolling behavior
    document.documentElement.style.scrollBehavior = "smooth";
    
    // Add custom text selection color
    const style = document.createElement("style");
    style.textContent = `
      .landing-page ::selection {
        background-color: #9333ea;
        color: white;
      }
      .landing-page ::-moz-selection {
        background-color: #9333ea;
        color: white;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="bg-white landing-page">
      <LandingNavbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <AppShowcaseSection />
      <TestimonialsSection />
      <FAQSection />
      <Footer />
    </div>
  );
}
