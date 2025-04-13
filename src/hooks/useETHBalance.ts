import { getPublicClient } from "@/config/networks";
import { useConnection } from "@/providers/ConnectionProvider";
import { useQuery } from "@tanstack/react-query";
import { Address, formatEther } from "viem";

const useETHBalance = (_account?: string) => {
    const { account } = useConnection();
    const targetAccount = account || _account;
    const { data: balance, isLoading } = useQuery({
        queryKey: ["ETHBalance", targetAccount],
        queryFn: async () => {
            if (!targetAccount) return BigInt(0);
            return getPublicClient().getBalance({
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
