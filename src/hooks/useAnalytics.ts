"use client";

import { useCallback } from "react";
import { getCookieValue } from "@/lib/utils/cookies";

export enum AnalyticsEvents {
    ADDRESS_INPUT_CHANGE = "address_input_change", // Basic
    REQUEST_BUTTON_CLICK = "request_button_click", // Basic
    REQUEST_SUBMIT_SUCCESS = "request_submit_success",
    REQUEST_SUBMIT_ERROR = "request_submit_error",
    DONATE_BUTTON_CLICK = "donate_button_click", // Basic
    DONATE_SUBMIT_SUCCESS = "donate_submit_success",
    SOCIAL_LINKS_SUBMIT = "social_links_submit",
    NETWORK_SELECTED = "network_selected", // Basic
    WALLET_CONNECT = "wallet_connect",
    MODAL_OPEN = "modal_open", // Basic
    MODAL_CLOSE = "modal_close", // Basic
    ERROR_OCCURRED = "error_occurred",
    ABUSE_SIGNAL = "abuse_signal",
    THEME_TOGGLE = "theme_toggle", // Basic
}

export const useAnalytics = () => {
    const trackEvent = useCallback(
        async (
            eventName: string,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            params: Record<string, any> = {},
            isAdvanced: boolean = false
        ) => {
            const basicConsent =
                getCookieValue("cookieConsent") === "basic" ||
                getCookieValue("cookieConsent") === "true";
            const advancedConsent =
                getCookieValue("advancedConsent") === "true";

            if (!basicConsent) return;

            if (isAdvanced && !advancedConsent) {
                // Anonymize for basic only
                for (const key in params) {
                    if (typeof params[key] === "string") {
                        const encoder = new TextEncoder();
                        const data = encoder.encode(params[key]);
                        const hashBuffer = await crypto.subtle.digest(
                            "SHA-256",
                            data
                        );
                        const hashArray = Array.from(
                            new Uint8Array(hashBuffer)
                        );
                        params[key] = hashArray
                            .map((b) => b.toString(16).padStart(2, "0"))
                            .join("");
                    }
                }
            }

            if (typeof window !== "undefined" && window.gtag) {
                window.gtag("event", eventName, params);
            }
        },
        []
    );

    return { trackEvent };
};
