import { create } from "zustand";
import { INetwork } from "@/types/network";
import { sepolia } from "viem/chains";
import { prefetchNetworkBalances } from "@/lib/cache/networkBalances";
import { filterWorkingRPCs } from "@/lib/networks";

const SELECTED_NETWORK_CHAIN_ID_KEY = "selectedNetworkChainId";

interface NetworksState {
    networks: INetwork[];
    selectedNetwork: INetwork | null;
    isLoading: boolean;
    error: string | null;
    fetchNetworks: () => Promise<void>;
    setSelectedNetwork: (network: INetwork) => void;
    _hasHydrated: boolean; // To track if we've attempted to load from localStorage
}

type NetworksStore = NetworksState;

// Helper to get initial selected network
const getInitialSelectedNetwork = (networks: INetwork[]): INetwork | null => {
    if (typeof window !== "undefined" && networks.length > 0) {
        const storedChainId = localStorage.getItem(
            SELECTED_NETWORK_CHAIN_ID_KEY
        );
        if (storedChainId) {
            const chainId = parseInt(storedChainId, 10);
            const persistedNetwork = networks.find(
                (n) => n.chainId === chainId
            );
            if (persistedNetwork) return persistedNetwork;
        }
    }
    // Default selection logic
    if (networks.length > 0) {
        const sepoliaNetwork = networks.find(
            (network: INetwork) => network.chainId === sepolia.id
        );
        return sepoliaNetwork || networks[0];
    }
    return null;
};

export const useNetworksStore = create<NetworksStore>((set, get) => ({
    networks: [],
    selectedNetwork: null, // Initialized to null, will be set by fetchNetworks
    isLoading: false,
    error: null,
    _hasHydrated: false, // Initially not hydrated

    fetchNetworks: async () => {
        if (get().networks.length > 0 && get()._hasHydrated) return; // Avoid refetch if already loaded & hydrated

        set({ isLoading: true, error: null });

        try {
            const response = await fetch("/api/networks");
            if (!response.ok) {
                throw new Error("Failed to fetch networks");
            }

            const data = await response.json();
            if (data.success && data.data) {
                const rawNetworks = data.data as INetwork[];

                // Process networks in parallel for better performance
                const networksWithWorkingRPCs = await Promise.all(
                    rawNetworks.map(async (network) => {
                        const workingRPCs = await filterWorkingRPCs(
                            network.rpc
                        );
                        return {
                            ...network,
                            rpc: workingRPCs,
                        };
                    })
                );

                // Filter out networks with no working RPCs
                const networks = networksWithWorkingRPCs.filter(
                    (network) => network.rpc.length > 0
                );

                const initialSelected = getInitialSelectedNetwork(networks);

                set({
                    networks,
                    selectedNetwork: initialSelected,
                    isLoading: false,
                    _hasHydrated: true, // Mark as hydrated after attempting to load from localStorage via getInitialSelectedNetwork
                });

                // Prefetch network balances in the background
                prefetchNetworkBalances(networks).catch((error) => {
                    console.debug("Error prefetching network balances:", error);
                });
            }
        } catch (error) {
            console.debug("Error fetching networks:", error);
            set({
                error: error instanceof Error ? error.message : "Unknown error",
                isLoading: false,
                _hasHydrated: true, // Also mark as hydrated on error to prevent re-attempts if fetch fails
            });
        }
    },

    setSelectedNetwork: (network: INetwork) => {
        set({ selectedNetwork: network });
        if (typeof window !== "undefined") {
            localStorage.setItem(
                SELECTED_NETWORK_CHAIN_ID_KEY,
                network.chainId.toString()
            );
        }
    },
}));
