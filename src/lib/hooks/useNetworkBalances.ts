import { useQueryClient, useQueries } from "@tanstack/react-query";
import { getETHBalance } from "@/lib/networks";
import { INetwork } from "@/types/network";
import { useEffect, useMemo } from "react";

/**
 * A hook that manages network balances with aggressive caching
 * to prevent unnecessary refetching and improve performance.
 */
export const useNetworkBalances = (networks: INetwork[]) => {
    const queryClient = useQueryClient();
    const faucetAddress = process.env.NEXT_PUBLIC_FAUCET_ADDRESS as string;

    // Prefetch all network balances when networks change
    useEffect(() => {
        if (!networks.length) return;

        // Create a map of existing cache entries to avoid refetching
        const existingEntries = new Set();
        networks.forEach((network) => {
            const cachedData = queryClient.getQueryData([
                "networkBalance",
                network.chainId,
            ]);
            if (cachedData) {
                existingEntries.add(network.chainId);
            }
        });

        // Only fetch for networks that don't have cached data
        const networksToFetch = networks.filter(
            (network) => !existingEntries.has(network.chainId)
        );

        if (networksToFetch.length === 0) return;

        // Fetch balances for networks without cached data
        networksToFetch.forEach((network) => {
            queryClient.prefetchQuery({
                queryKey: ["networkBalance", network.chainId],
                queryFn: async () => {
                    try {
                        return await getETHBalance(
                            faucetAddress as `0x${string}`,
                            network.rpc,
                            network.nativeCurrency?.decimals || 18
                        );
                    } catch (error) {
                        console.debug(
                            `Error prefetching balance for network ${network.name}:`,
                            error
                        );
                        throw error;
                    }
                },
                staleTime: Infinity, // Never consider data stale
                gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
            });
        });
    }, [networks, queryClient, faucetAddress]);

    // Create a map of network IDs to their indices for efficient lookup
    const networkIndexMap = useMemo(() => {
        const map = new Map();
        networks.forEach((network, index) => {
            map.set(network.chainId, index);
        });
        return map;
    }, [networks]);

    // Use useQueries hook instead of mapping useQuery calls
    const networkQueries = useQueries({
        queries: networks.map((network) => ({
            queryKey: ["networkBalance", network.chainId],
            queryFn: async () => {
                return await getETHBalance(
                    faucetAddress as `0x${string}`,
                    network.rpc,
                    network.nativeCurrency?.decimals || 18
                );
            },
            staleTime: Infinity, // Never consider data stale
            gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
            refetchInterval: false as const, // Never automatically refetch
            refetchOnWindowFocus: false, // Don't refetch when window regains focus
            refetchOnMount: false, // Don't refetch on component mount if data exists
            refetchOnReconnect: false, // Don't refetch on reconnect
            retry: 1, // Only retry once on failure
            enabled: networks.length > 0, // Only run query if networks are available
        })),
    });

    // Return a function to get a network's balance
    const getNetworkBalance = (chainId: number) => {
        const index = networkIndexMap.get(chainId);
        if (index === undefined) {
            return { balance: undefined, isLoading: true, isError: false };
        }

        const query = networkQueries[index];
        return {
            balance: query.data,
            isLoading: query.isLoading,
            isError: query.isError,
        };
    };

    return { getNetworkBalance };
};
