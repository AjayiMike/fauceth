"use client";
import React from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "lucide-react";
import { useAnalytics, AnalyticsEvents } from "@/hooks/useAnalytics";

function ToggleThemeMode() {
    const { theme, setTheme } = useTheme();
    const { trackEvent } = useAnalytics();

    function handleToggleMode() {
        const nextTheme = theme === "light" ? "dark" : "light";
        setTheme(nextTheme);
        trackEvent(
            AnalyticsEvents.THEME_TOGGLE,
            { newTheme: nextTheme },
            false
        ); // Basic
    }
    return (
        <button
            onClick={handleToggleMode}
            className=" flex items-center space-x-2 px-3 py-2 rounded-lg bg-accent hover:bg-accent/80 transition-colors cursor-pointer"
        >
            {theme === "light" ? (
                <MoonIcon size={28} strokeWidth={1.5} />
            ) : (
                <SunIcon size={28} strokeWidth={1.5} />
            )}
        </button>
    );
}

export default ToggleThemeMode;
