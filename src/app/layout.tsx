import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConnectionProvider } from "@/providers/ConnectionProvider";
import AppQueryClientProvider from "@/providers/QueryClient";
import { ThemeProvider } from "@/providers/ThemeProvider";
import ClientLayout from "@/components/ClientLayout";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const siteUrl = "https://fauceth.dev";

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: "FaucETH: EVM Testnet Faucet",
        template: "%s | FaucETH",
    },
    description:
        "A community-funded testnet ETH faucet for all EVM chains where developers can donate and request test ETH for testing and development.",
    keywords: [
        "faucet",
        "testnet",
        "ETH",
        "Ethereum",
        "EVM",
        "developer tools",
        "crypto",
        "blockchain",
        "request ETH",
        "donate ETH",
    ],
    authors: [{ name: "Ajayi Adekunle Michael" }],
    manifest: "/site.webmanifest",
    openGraph: {
        title: "FaucETH: EVM Testnet Faucet",
        description:
            "A community-funded testnet ETH faucet for all EVM chains. Donate and request test ETH for development.",
        url: siteUrl,
        siteName: "FaucETH",
        images: [
            {
                url: "/fauceth.svg",
                width: 800,
                height: 600,
                alt: "FaucETH Logo",
            },
            // {
            //   url: '/og-image.png',
            //   width: 1200,
            //   height: 630,
            //   alt: 'FaucETH Open Graph Image',
            // },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "FaucETH: EVM Testnet Faucet",
        description: "Get your testnet ETH for EVM chains quickly and easily.",
        creator: "@0xAdek",
        images: ["/fauceth.svg"],
    },
    icons: {
        icon: [
            { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
            { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
            { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        ],
        apple: [{ url: "/apple-touch-icon.png", type: "image/png" }],
    },
    robots: {
        index: true,
        follow: true,
        nocache: true,
        googleBot: {
            index: true,
            follow: false,
            noimageindex: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <ConnectionProvider>
                        <AppQueryClientProvider>
                            <ClientLayout>{children}</ClientLayout>
                        </AppQueryClientProvider>
                    </ConnectionProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
