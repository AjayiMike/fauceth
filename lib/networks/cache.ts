import { INetwork } from "@/types/network";

// Cache structure to store network data and timestamp
export interface NetworkCache {
    // Map of chain IDs to network data
    networks: Map<number, INetwork>;
    // Timestamp of when the cache was last updated
    timestamp: number;
}

// Cache duration in milliseconds (24 hours)
export const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Initialize the cache
export const networkCache: NetworkCache = {
    networks: new Map(),
    timestamp: 0,
};

// Helper function to check if cache is valid
export const isCacheValid = (): boolean => {
    return Date.now() - networkCache.timestamp < CACHE_DURATION;
};

// Helper function to get all cached networks
export const getAllCachedNetworks = (): INetwork[] | null => {
    if (networkCache.networks.size > 0 && isCacheValid()) {
        return Array.from(networkCache.networks.values());
    }
    return null;
};

// Helper function to get a specific network by ID
export const getCachedNetwork = (chainId: number): INetwork | null => {
    if (isCacheValid() && networkCache.networks.has(chainId)) {
        return networkCache.networks.get(chainId) || null;
    }
    return null;
};

// Helper function to set a network in the cache
export const setCachedNetwork = (network: INetwork): void => {
    networkCache.networks.set(network.chainId, network);
    networkCache.timestamp = Date.now();
};

// Helper function to set multiple networks in the cache
export const setCachedNetworks = (networks: INetwork[]): void => {
    // Clear existing cache
    networkCache.networks.clear();

    // Add all networks to the cache
    networks.forEach((network) => {
        networkCache.networks.set(network.chainId, network);
    });

    // Update timestamp
    networkCache.timestamp = Date.now();
};
