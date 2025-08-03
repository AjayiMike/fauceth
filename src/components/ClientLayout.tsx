"use client";

import { ReactNode } from "react";
import { useState, useEffect } from "react";
import Script from "next/script";
import ConsentModal from "./ConsentModal/index";
import { getCookieValue } from "@/lib/utils/cookies";

type ClientLayoutProps = {
    children: ReactNode;
};

export default function ClientLayout({ children }: ClientLayoutProps) {
    const [hasConsent, setHasConsent] = useState(
        getCookieValue("cookieConsent") === "basic" ||
            getCookieValue("cookieConsent") === "true"
    );

    useEffect(() => {
        const consent = getCookieValue("cookieConsent");
        setHasConsent(consent === "basic" || consent === "true");
    }, []);

    return (
        <>
            {hasConsent && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID}`}
                        strategy="afterInteractive"
                    />
                    <Script id="google-analytics" strategy="afterInteractive">
                        {`
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', '${process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID}', { anonymize_ip: true });
                        `}
                    </Script>
                </>
            )}
            {children}
            <ConsentModal />
        </>
    );
}
