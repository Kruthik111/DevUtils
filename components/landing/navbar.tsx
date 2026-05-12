"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Notes", href: "/signin", requiresAuth: true },
  { name: "Quick Share", href: "/quick-share" },
  { name: "QR Code", href: "/qr-generator" },
  { name: "JSON Tools", href: "/json-tools" },
  { name: "Readme Preview", href: "/readme-preview" },
];

export function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-lg"
          : "bg-white md:bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <img src="/logo.png" alt="DevUtils Logo" className="w-10 h-10 object-contain" />
            <span className="text-2xl font-bold text-black tracking-tight">DevUtils</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <TooltipProvider delayDuration={150}>
              {navLinks.map((link) =>
                link.requiresAuth ? (
                  <Tooltip key={link.name}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        asChild
                        className="text-gray-600 hover:text-black font-medium"
                      >
                        <Link href={link.href}>{link.name}</Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Need sign in to access</TooltipContent>
                  </Tooltip>
                ) : (
                  <Button
                    key={link.name}
                    variant="ghost"
                    asChild
                    className="text-gray-600 hover:text-black font-medium"
                  >
                    <Link href={link.href}>{link.name}</Link>
                  </Button>
                )
              )}
            </TooltipProvider>
            <Button asChild>
              <Link href="/signin">
                Sign In
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-black" />
            ) : (
              <Menu className="w-6 h-6 text-black" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden pb-4 border-t border-gray-200 mt-2"
          >
            <div className="flex flex-col gap-4 pt-4">
              {navLinks.map((link) => (
                <Button
                  key={link.name}
                  variant="ghost"
                  asChild
                  className="w-full justify-start text-gray-600 hover:text-purple-700 font-medium py-2"
                  title={link.requiresAuth ? "Need sign in to access" : undefined}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                    {link.requiresAuth && (
                      <span className="ml-2 text-xs text-gray-400">(sign in required)</span>
                    )}
                  </Link>
                </Button>
              ))}
              <Button asChild className="w-full mt-2">
                <Link href="/signin">
                  Sign In
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}
