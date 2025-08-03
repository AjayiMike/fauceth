/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
    interface Window {
        gtag: (
            command: "config" | "event" | "js" | "set",
            ...args: any[]
        ) => void;
        dataLayer: any[];
    }
}

export {};
