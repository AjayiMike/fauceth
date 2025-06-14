import { create } from "zustand";
import {
    IAugmentedNetwork,
    FaucetState,
    INetwork,
    NetworkHealth,
} from "@/types/network";
import { holesky, sepolia } from "viem/chains";
import { filterWorkingRPCs, getETHBalance } from "@/lib/networks";
import { env } from "@/config/env";

const SELECTED_NETWORK_CHAIN_ID_KEY = "selectedNetworkChainId";

// high-priority networks (Because they are the most used)
const PRIORITY_NETWORK_IDS = [
    11155111, 17000, 97, 421614, 4062, 84532, 43113, 4202,
];

interface NetworkDetails {
    health: NetworkHealth;
    faucetState: FaucetState;
    balance: number | null;
    rpc: string[];
}

interface NetworksState {
    networks: INetwork[]; // Static data
    networkDetails: Record<number, NetworkDetails>; // Dynamic data
    selectedNetwork: IAugmentedNetwork | null;
    isLoading: boolean;
    error: string | null;
    initializeNetworks: () => Promise<void>;
    setSelectedNetwork: (network: IAugmentedNetwork) => void;
    getNetworkById: (chainId: number) => IAugmentedNetwork | null;
    _updateNetworkDetails: (
        chainId: number,
        updates: Partial<NetworkDetails>
    ) => void;
}

const selectInitialNetwork = (
    networks: INetwork[],
    details: Record<number, NetworkDetails>
): IAugmentedNetwork | null => {
    if (networks.length === 0) return null;

    const composeAugmentedNetwork = (network: INetwork): IAugmentedNetwork => ({
        ...network,
        ...details[network.chainId],
    });

    if (typeof window !== "undefined") {
        const storedChainId = localStorage.getItem(
            SELECTED_NETWORK_CHAIN_ID_KEY
        );
        if (storedChainId) {
            const chainId = parseInt(storedChainId, 10);
            const persistedNetwork = networks.find(
                (n) => n.chainId === chainId
            );
            // 1. If the network is in the local storage, return it
            if (persistedNetwork)
                return composeAugmentedNetwork(persistedNetwork);
        }
    }

    // 2. Fallback to Sepolia if available
    const sepoliaNetwork = networks.find((n) => n.chainId === sepolia.id);
    if (sepoliaNetwork) return composeAugmentedNetwork(sepoliaNetwork);

    // 3. Fallback to Holesky if available
    const holeskyNetwork = networks.find((n) => n.chainId === holesky.id);
    if (holeskyNetwork) return composeAugmentedNetwork(holeskyNetwork);

    // 4. Fallback to the first network
    return composeAugmentedNetwork(networks[0]);
};

export const useNetworksStore = create<NetworksState>((set, get) => ({
    networks: [],
    networkDetails: {},
    selectedNetwork: null,
    isLoading: true,
    error: null,

    getNetworkById: (chainId: number) => {
        const state = get();
        const network = state.networks.find((n) => n.chainId === chainId);
        if (!network) return null;
        const details = state.networkDetails[chainId];
        if (!details) return null;
        return { ...network, ...details };
    },

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

            const rawNetworks: INetwork[] = data.data;

            const initialDetails: Record<number, NetworkDetails> = {};
            rawNetworks.forEach((network) => {
                initialDetails[network.chainId] = {
                    health: "pending",
                    faucetState: "loading",
                    balance: null,
                    rpc: network.rpc,
                };
            });

            const initialSelected = selectInitialNetwork(
                rawNetworks,
                initialDetails
            );
            set({
                networks: rawNetworks,
                networkDetails: initialDetails,
                isLoading: false,
                selectedNetwork: initialSelected,
            });

            const validateNetwork = async (network: INetwork) => {
                const workingRPCs = await filterWorkingRPCs(network.rpc);
                if (workingRPCs.length === 0) {
                    get()._updateNetworkDetails(network.chainId, {
                        health: "offline",
                        faucetState: "error",
                    });
                    return;
                }

                get()._updateNetworkDetails(network.chainId, {
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
                    get()._updateNetworkDetails(network.chainId, {
                        faucetState,
                        balance,
                    });
                } catch (balanceError) {
                    console.error(
                        `Balance fetch failed for ${network.name}:`,
                        balanceError
                    );
                    get()._updateNetworkDetails(network.chainId, {
                        faucetState: "error",
                        balance: null,
                    });
                }
            };

            // Tier 1: Prioritize validation of the selected network
            if (initialSelected) {
                await validateNetwork(initialSelected);
            }

            const remainingNetworks = rawNetworks.filter(
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

            otherNetworks.forEach(validateNetwork);
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

    _updateNetworkDetails: (
        chainId: number,
        updates: Partial<NetworkDetails>
    ) => {
        set((state) => {
            const currentDetails = state.networkDetails[chainId];
            const newDetails = { ...currentDetails, ...updates };

            const newNetworkDetails = {
                ...state.networkDetails,
                [chainId]: newDetails,
            };

            let newSelectedNetwork = state.selectedNetwork;
            if (state.selectedNetwork?.chainId === chainId) {
                newSelectedNetwork = {
                    ...state.selectedNetwork,
                    ...newDetails,
                };
            }

            return {
                networkDetails: newNetworkDetails,
                selectedNetwork: newSelectedNetwork,
            };
        });
    },
}));
