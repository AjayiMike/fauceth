"use client";
import React from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "lucide-react";

function ToggleThemeMode() {
    const [mounted, setMounted] = React.useState(false);
    const { theme, setTheme } = useTheme();

    React.useEffect(function () {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    function handleToggleMode() {
        if (theme === "light") {
            setTheme("dark");
        } else {
            setTheme("light");
        }
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
