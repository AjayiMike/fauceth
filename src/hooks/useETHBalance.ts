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

const useETHBalance = (_account?: string) => {
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
    const { data: balance, isLoading } = useQuery({
        queryKey: ["ETHBalance", targetAccount],
        queryFn: async () => {
            if (!targetAccount) return BigInt(0);
            return publicClient.getBalance({
                address: targetAccount as Address,
            });
        },
        enabled: !!targetAccount,
        refetchInterval: 4000,
    });

    return {
        balance,
        formattedBalance: formatEther(balance ?? BigInt(0)),
        isLoading,
    };
};

export default useETHBalance;
