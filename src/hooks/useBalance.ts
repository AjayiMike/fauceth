import { useNetworksStore } from "@/lib/store/networksStore";
import { useConnection } from "@/providers/ConnectionProvider";
import { useQuery } from "@tanstack/react-query";
import {
    Address,
    createPublicClient,
    defineChain,
    fallback,
    formatEther,
    http,
} from "viem";

const useBalance = (_account?: string) => {
    const { account, chainId } = useConnection();
    const { networks } = useNetworksStore();
    const targetAccount = account || _account;
    const network = networks.find((network) => network.chainId === chainId);
    const transport = fallback(
        network?.rpc ? network.rpc.map((url) => http(url)) : []
    );

    const publicClient = createPublicClient({
        chain: defineChain({
            id: network?.chainId || 0,
            name: network?.name || "",
            rpcUrls: {
                default: { http: network?.rpc || [] },
            },
            nativeCurrency: {
                name: network?.nativeCurrency.name || "",
                symbol: network?.nativeCurrency.symbol || "",
                decimals: network?.nativeCurrency.decimals || 0,
            },
        }),
        transport: transport,
    });
    const {
        data: balance,
        isLoading,
        isFetching,
        isRefetching,
        isError,
        error,
    } = useQuery({
        queryKey: ["ETHBalance", targetAccount, chainId, network?.rpc],
        queryFn: async () => {
            if (!targetAccount) return BigInt(0);
            return publicClient.getBalance({
                address: targetAccount as Address,
            });
        },
        enabled: !!targetAccount && !!network?.rpc?.length,
        refetchInterval: 4000,
    });

    return {
        balance,
        formattedBalance: formatEther(balance ?? BigInt(0)),
        // Loading states
        isLoading, // True when fetching for the first time with no data yet
        isFetching, // True whenever a fetch is in progress
        isRefetching, // True when refetching data that already exists
        isError, // True if there was an error fetching the balance
        error, // The error object if an error occurred
    };
};

export default useBalance;
