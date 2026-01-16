"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { StaggerContainer, StaggerItem } from "./scroll-animations";
import Image from "next/image";
import desktopPreview from "../../public/appdesktoppreview.png"
import mobilePreview from "../../public/appmobilepreview.png"
import addNewNoteDesktopImage from "../../public/add-new-note-desktop.png";
import addNewNoteMobileImage from "../../public/add-new-note-mobile.png";

// Image arrays - user can add more images here
const desktopImages = [desktopPreview, addNewNoteDesktopImage];
const mobileImages = [addNewNoteMobileImage, mobilePreview];

export function AppShowcaseSection() {
  const [desktopIndex, setDesktopIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);

  useEffect(() => {
    // Desktop image carousel
    const desktopInterval = setInterval(() => {
      setDesktopIndex((prev) => (prev + 1) % desktopImages.length);
    }, 3000);

    // Mobile image carousel
    const mobileInterval = setInterval(() => {
      setMobileIndex((prev) => (prev + 1) % mobileImages.length);
    }, 3000);

    return () => {
      clearInterval(desktopInterval);
      clearInterval(mobileInterval);
    };
  }, []);

  return (
    <section id="showcase" className="py-24 md:py-32 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <StaggerContainer className="text-center mb-16">
          <StaggerItem>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold mb-4 text-black"
            >
              Experience the{" "}
              <span className="text-gray-600">DevUtils</span>{" "}
              <span className="text-black">Difference</span>
            </motion.h2>
          </StaggerItem>
          <StaggerItem>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xl text-gray-600 max-w-2xl mx-auto"
            >
              Access your clipboard vault and API configurations from any device, anywhere
            </motion.p>
          </StaggerItem>
        </StaggerContainer>

        {/* Device Frames */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* iPhone Frame */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative flex justify-center"
          >
            <div className="relative" style={{ width: "320px", height: "640px" }}>
              {/* iPhone Frame */}
              <div className="relative bg-black rounded-[3rem] p-2 shadow-2xl h-full flex flex-col group" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.1)' }}>
                {/* Dynamic Island */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-10 flex items-center justify-center">
                  <div className="w-20 h-1 bg-gray-800 rounded-full"></div>
                </div>
                {/* Screen */}
                <div className="bg-white rounded-[2.5rem] overflow-hidden relative flex-1 mt-3">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={mobileIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-700 ease-in-out"
                    >
                      <Image 
                        src={mobileImages[mobileIndex]} 
                        alt={`DevUtils mobile app preview ${mobileIndex + 1}`}
                        fill
                        className="object-cover"
                        sizes="320px"
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>

          {/* iMac Frame */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative flex justify-center"
          >
            <div className="relative w-full max-w-[900px]">
              {/* iMac Frame */}
              <div className="relative  group">
                {/* Screen with silver bezel */}
                <div className="bg-gradient-to-b shadow-2xl from-gray-300 to-gray-400 rounded-t-2xl p-2" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.1)' }}>
                  <div className="bg-black rounded-lg overflow-hidden aspect-video relative">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={desktopIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 group-hover:scale-105 transition-transform duration-700 ease-in-out"
                      >
                        <Image 
                          src={desktopImages[desktopIndex]} 
                          alt={`DevUtils desktop app preview ${desktopIndex + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 900px) 100vw, 900px"
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
                {/* Chin with Apple logo */}
                <div className="bg-gradient-to-b from-gray-300 to-gray-400 h-16 rounded-b-2xl flex items-center justify-center relative">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                  </div>
                </div>
                {/* Stand */}
                <div className="flex justify-center">
                  <div className="w-32 h-24 bg-gradient-to-b from-gray-300 to-gray-400 rounded-b-lg relative">
                    {/* Stand base */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-2 bg-gradient-to-b from-gray-400 to-gray-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Coming Soon Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-slate-800 to-slate-900 shadow-lg border border-slate-700/50 relative overflow-hidden">
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            {/* Sparkle Icon */}
            <div className="relative z-10">
              <Sparkles className="w-5 h-5 text-yellow-400 drop-shadow-sm" />
            </div>
            {/* Text */}
            <span className="text-white font-medium text-sm relative z-10">
              More to come: Prompts Collections for developers
            </span>
            {/* Chevron Icon */}
            <div className="relative z-10">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
