"use client";

import { useEffect } from "react";
import { useNetworksStore } from "@/lib/store/networksStore";

/**
 * A client component that initializes the networks store when the app loads.
 * This component is included in the app layout.
 */
export function NetworksUpdater() {
    const fetchNetworks = useNetworksStore((state) => state.fetchNetworks);

    useEffect(() => {
        fetchNetworks();
    }, [fetchNetworks]);

    return null;
}
