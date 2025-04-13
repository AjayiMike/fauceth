import { useCallback } from "react";
import useWalletClient from "./useWalletClient";
import { Address, Chain, parseEther } from "viem";
import { useConnection } from "@/providers/ConnectionProvider";
const useDonate = () => {
    const { account } = useConnection();
    const walletClient = useWalletClient();

    return useCallback(
        async (chain: Chain, amount: string) => {
            if (!walletClient) {
                throw new Error("No wallet client");
            }

            return walletClient.sendTransaction({
                chain: chain,
                account: account as Address,
                args: [],
                value: parseEther(amount),
                to: process.env.NEXT_PUBLIC_FAUCET_ADDRESS as Address,
            });
        },
        [account, walletClient]
    );
};

export default useDonate;
