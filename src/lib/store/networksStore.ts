import { create } from "zustand";
import { IAugmentedNetwork, FaucetState, INetwork } from "@/types/network";
import { holesky, sepolia } from "viem/chains";
import { filterWorkingRPCs, getETHBalance } from "@/lib/networks";
import { env } from "@/config/env";

const SELECTED_NETWORK_CHAIN_ID_KEY = "selectedNetworkChainId";

// Define the high-priority networks
const PRIORITY_NETWORK_IDS = [
    11155111, 17000, 97, 421614, 4062, 84532, 43113, 4202,
];

interface NetworksState {
    networks: IAugmentedNetwork[];
    selectedNetwork: IAugmentedNetwork | null;
    isLoading: boolean;
    error: string | null;
    initializeNetworks: () => Promise<void>;
    setSelectedNetwork: (network: IAugmentedNetwork) => void;
    _updateNetwork: (
        chainId: number,
        updates: Partial<IAugmentedNetwork>
    ) => void;
}

const selectInitialNetwork = (
    networks: IAugmentedNetwork[]
): IAugmentedNetwork | null => {
    if (networks.length === 0) return null;

    // 1. Prioritize persisted network from localStorage
    if (typeof window !== "undefined") {
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

    // 2. Fallback to Sepolia if available
    const sepoliaNetwork = networks.find((n) => n.chainId === sepolia.id);
    if (sepoliaNetwork) return sepoliaNetwork;

    // 3. Fallback to Holesky if available
    const holeskyNetwork = networks.find((n) => n.chainId === holesky.id);
    if (holeskyNetwork) return holeskyNetwork;

    // 4. Fallback to the first network in the list
    return networks[0];
};

export const useNetworksStore = create<NetworksState>((set, get) => ({
    networks: [],
    selectedNetwork: null,
    isLoading: true,
    error: null,

    initializeNetworks: async () => {
        if (get().networks.length > 0 && !get().isLoading) return;

        set({ isLoading: true, error: null });

        try {
            const response = await fetch("/api/networks");
            if (!response.ok)
                throw new Error("Failed to fetch master network list");
            const data = await response.json();
            if (!data.success || !data.data)
                throw new Error("API response was not successful.");

            const rawNetworks = data.data as INetwork[];

            const pendingNetworks: IAugmentedNetwork[] = rawNetworks.map(
                (network) => ({
                    ...network,
                    health: "pending",
                    faucetState: "loading",
                    balance: null,
                })
            );

            // Set initial state with all networks pending
            const initialSelected = selectInitialNetwork(pendingNetworks);
            set({
                networks: pendingNetworks,
                isLoading: false,
                selectedNetwork: initialSelected,
            });

            // Reusable validation function for a single network
            const validateNetwork = async (network: IAugmentedNetwork) => {
                const workingRPCs = await filterWorkingRPCs(network.rpc);
                if (workingRPCs.length === 0) {
                    get()._updateNetwork(network.chainId, {
                        health: "offline",
                        faucetState: "error",
                    });
                    return;
                }

                get()._updateNetwork(network.chainId, {
                    health: "online",
                    rpc: workingRPCs,
                });

                try {
                    const balance = await getETHBalance(
                        env.FAUCET_ADDRESS as `0x${string}`,
                        workingRPCs
                    );
                    let faucetState: FaucetState = "ok";
                    if (balance === 0) faucetState = "empty";
                    else if (balance < Number(env.MIN_BALANCE))
                        faucetState = "low";
                    get()._updateNetwork(network.chainId, {
                        faucetState,
                        balance,
                    });
                } catch (balanceError) {
                    console.error(
                        `Balance fetch failed for ${network.name}:`,
                        balanceError
                    );
                    get()._updateNetwork(network.chainId, {
                        faucetState: "error",
                        balance: null,
                    });
                }
            };

            // Tier 1: Prioritize validation of the selected network
            if (initialSelected) {
                await validateNetwork(initialSelected);
            }

            // Separate remaining networks into priority and others
            const remainingNetworks = pendingNetworks.filter(
                (n) => n.chainId !== initialSelected?.chainId
            );

            const priorityNetworks = remainingNetworks.filter((n) =>
                PRIORITY_NETWORK_IDS.includes(n.chainId)
            );
            const otherNetworks = remainingNetworks.filter(
                (n) => !PRIORITY_NETWORK_IDS.includes(n.chainId)
            );

            // Tier 2: Validate common networks in parallel
            await Promise.all(priorityNetworks.map(validateNetwork));

            // Tier 3: Start background validation for all other networks
            otherNetworks.forEach((network) => validateNetwork(network));
        } catch (error) {
            console.error("Error initializing networks:", error);
            set({
                error: error instanceof Error ? error.message : "Unknown error",
                isLoading: false,
            });
        }
    },

    setSelectedNetwork: (network: IAugmentedNetwork) => {
        if (network.health !== "online") return;
        set({ selectedNetwork: network });
        if (typeof window !== "undefined") {
            localStorage.setItem(
                SELECTED_NETWORK_CHAIN_ID_KEY,
                network.chainId.toString()
            );
        }
    },

    _updateNetwork: (chainId: number, updates: Partial<IAugmentedNetwork>) => {
        set((state) => {
            let newSelectedNetwork = state.selectedNetwork;
            const newNetworks = state.networks.map((n) => {
                if (n.chainId === chainId) {
                    const updatedNetwork = { ...n, ...updates };
                    if (state.selectedNetwork?.chainId === chainId) {
                        newSelectedNetwork = updatedNetwork;
                    }
                    return updatedNetwork;
                }
                return n;
            });

            return {
                networks: newNetworks,
                selectedNetwork: newSelectedNetwork,
            };
        });
    },
}));
