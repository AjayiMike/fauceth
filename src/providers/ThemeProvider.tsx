"use client";
import dynamic from "next/dynamic";

import * as React from "react";

const ThemeWrapper = dynamic(
    () => import("next-themes").then((module) => module.ThemeProvider),
    { ssr: false }
);

export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof ThemeWrapper>) {
    return <ThemeWrapper {...props}>{children}</ThemeWrapper>;
}
