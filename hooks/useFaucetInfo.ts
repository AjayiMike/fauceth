import { getNetworkBalance } from "@/lib/cache/networkBalances";
import { calculateDailyClaimAmount } from "@/lib/faucet";
import { useNetworksStore } from "@/lib/store/networksStore";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useFaucetInfo = (account?: Address) => {
    const { selectedNetwork } = useNetworksStore();

    const { data, isLoading } = useQuery({
        queryKey: [
            "network-balance",
            selectedNetwork?.chainId,
            selectedNetwork?.rpc,
            selectedNetwork?.nativeCurrency?.decimals,
        ],
        queryFn: () =>
            getNetworkBalance(
                selectedNetwork?.chainId || 0,
                selectedNetwork?.rpc || [],
                selectedNetwork?.nativeCurrency?.decimals || 18
            ),
        enabled: Boolean(selectedNetwork?.chainId && selectedNetwork?.rpc),
        refetchInterval: 3000,
    });

    console.log(
        "calculateDailyClaimAmount(data?.balance || 0),: ",
        calculateDailyClaimAmount(data?.balance || 0)
    );

    return {
        isLoading: isLoading || data?.isLoading,
        balance: data?.balance,
        cooldownDuration: 24 * 60 * 60,
        dropAmount: calculateDailyClaimAmount(data?.balance || 0),
        lastDrip: 0,
    };
};
