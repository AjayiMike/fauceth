"use client";
import React from "react";
import Logo from "next/image";
import { useTheme } from "next-themes";

interface ImageProps {
    alt: string;
    width: number;
    height: number;
    className: string;
}

function Image({ ...delegated }: ImageProps) {
    const { theme } = useTheme();
    return (
        <Logo
            src={theme === "light" ? "/fauceth_dark.svg" : "/fauceth_light.svg"}
            {...delegated}
        />
    );
}

export default Image;
