"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "@/components/providers/theme-provider";
import { type Theme } from "@/lib/theme-config";

export function ThemeSync() {
    const { data: session, status } = useSession();
    const { theme, customTheme, setTheme, setCustomTheme } = useTheme();
    const isAuthenticated = status === "authenticated";
    const hasFetchedRef = useRef(false);
    const skipNextSaveRef = useRef(false);

    // Fetch theme from database when user is authenticated
    useEffect(() => {
        if (!isAuthenticated || hasFetchedRef.current) {
            return;
        }

        const fetchUserPreferences = async () => {
            try {
                const response = await fetch("/api/user/preferences");
                if (response.ok) {
                    const data = await response.json();
                    skipNextSaveRef.current = true; // Skip saving the fetched theme
                    if (data.theme) {
                        setTheme(data.theme as Theme);
                    }
                    if (data.customTheme) {
                        setCustomTheme(data.customTheme);
                    }
                }
            } catch (error) {
                console.error("Error fetching user preferences:", error);
            } finally {
                hasFetchedRef.current = true;
            }
        };

        fetchUserPreferences();
    }, [isAuthenticated, setTheme, setCustomTheme]);

    // Update database when theme changes (authenticated users)
    useEffect(() => {
        if (!isAuthenticated || !hasFetchedRef.current) {
            return;
        }

        // Skip the first save after fetching
        if (skipNextSaveRef.current) {
            skipNextSaveRef.current = false;
            return;
        }

        const timeoutId = setTimeout(async () => {
            try {
                await fetch("/api/user/preferences", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        theme,
                        customTheme,
                    }),
                });
            } catch (error) {
                console.error("Error updating user preferences:", error);
            }
        }, 300); // Debounce to avoid rapid saves

        return () => clearTimeout(timeoutId);
    }, [theme, customTheme, isAuthenticated]);

    return null;
}
