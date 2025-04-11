import { create } from "zustand";
import { INetwork } from "@/types/network";
import { sepolia } from "viem/chains";
import { prefetchNetworkBalances } from "@/lib/cache/networkBalances";

interface NetworksState {
    networks: INetwork[];
    selectedNetwork: INetwork | null;
    isLoading: boolean;
    error: string | null;
    fetchNetworks: () => Promise<void>;
    setSelectedNetwork: (network: INetwork) => void;
}

type NetworksStore = NetworksState;

export const useNetworksStore = create<NetworksStore>((set, get) => ({
    networks: [],
    selectedNetwork: null,
    isLoading: false,
    error: null,

    fetchNetworks: async () => {
        // If networks are already loaded, don't fetch again
        if (get().networks.length > 0) return;

        set({ isLoading: true, error: null });

        try {
            const response = await fetch("/api/networks");
            if (!response.ok) {
                throw new Error("Failed to fetch networks");
            }

            const data = await response.json();
            if (data.success && data.data) {
                const networks = data.data;
                set({ networks });

                // Set sepolia or the first network as selected by default
                if (networks.length > 0) {
                    const sepoliaNetwork = networks.find(
                        (network: INetwork) => network.chainId === sepolia.id
                    );
                    set({ selectedNetwork: sepoliaNetwork || networks[0] });
                }

                // Prefetch network balances in the background
                prefetchNetworkBalances(networks).catch((error) => {
                    console.debug("Error prefetching network balances:", error);
                });
            }
        } catch (error) {
            console.debug("Error fetching networks:", error);
            set({
                error: error instanceof Error ? error.message : "Unknown error",
            });
        } finally {
            set({ isLoading: false });
        }
    },

    setSelectedNetwork: (network: INetwork) => {
        set({ selectedNetwork: network });
    },
}));
