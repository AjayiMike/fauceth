import { env } from "@/config/env";
import { getETHBalance } from "@/lib/networks";
import { Address } from "viem";

// Global cache for network balances
const balanceCache = new Map<
    number,
    {
        balance: number | null;
        isLoading: boolean;
        isError: boolean;
        timestamp: number;
    }
>();

// Cache expiration time (24 hours)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

/**
 * Get a network balance from cache or fetch it if not available
 */
export const getNetworkBalance = async (
    chainId: number,
    rpcUrls: string[],
    decimals: number = 18
): Promise<{
    balance: number | null;
    isLoading: boolean;
    isError: boolean;
}> => {
    // Check if we have a valid cached value
    const cachedValue = balanceCache.get(chainId);
    const now = Date.now();

    if (
        cachedValue &&
        !cachedValue.isLoading &&
        !cachedValue.isError &&
        now - cachedValue.timestamp < CACHE_EXPIRATION
    ) {
        return {
            balance: cachedValue.balance,
            isLoading: cachedValue.isLoading,
            isError: cachedValue.isError,
        };
    }

    // Set loading state in cache
    balanceCache.set(chainId, {
        balance: null,
        isLoading: true,
        isError: false,
        timestamp: now,
    });

    try {
        // Fetch the balance
        const { balance } = await getETHBalance(
            env.FAUCET_ADDRESS as Address,
            rpcUrls,
            decimals
        );

        // Update cache with success
        balanceCache.set(chainId, {
            balance,
            isLoading: false,
            isError: false,
            timestamp: now,
        });

        return {
            balance,
            isLoading: false,
            isError: false,
        };
    } catch (error) {
        console.debug(`Error fetching balance for network ${chainId}:`, error);

        // Update cache with error
        balanceCache.set(chainId, {
            balance: null,
            isLoading: false,
            isError: true,
            timestamp: now,
        });

        return {
            balance: null,
            isLoading: false,
            isError: true,
        };
    }
};

/**
 * Prefetch balances for multiple networks
 */
export const prefetchNetworkBalances = async (
    networks: Array<{
        chainId: number;
        rpc: string[];
        nativeCurrency?: {
            decimals?: number;
        };
    }>
): Promise<void> => {
    // Process networks in parallel with a concurrency limit
    const concurrencyLimit = 5;
    const chunks = [];

    for (let i = 0; i < networks.length; i += concurrencyLimit) {
        chunks.push(networks.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
        await Promise.allSettled(
            chunk.map((network) =>
                getNetworkBalance(
                    network.chainId,
                    network.rpc,
                    network.nativeCurrency?.decimals || 18
                )
            )
        );
    }
};
