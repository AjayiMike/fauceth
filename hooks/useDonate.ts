import { useCallback } from "react";
import useWalletClient from "./useWalletClient";
import { FAUCET } from "@/config/abi";
import { parseEther } from "viem";
import { sepolia } from "viem/chains";
const useDonate = () => {
    const walletClient = useWalletClient();

    return useCallback(
        async (amount: string) => {
            if (!walletClient) {
                throw new Error("No wallet client");
            }

            return walletClient.writeContract({
                chain: sepolia,
                address: process.env
                    .NEXT_PUBLIC_FAUCET_ADDRESS as `0x${string}`,
                abi: FAUCET,
                functionName: "donate",
                args: [],
                value: parseEther(amount),
            });
        },
        [walletClient]
    );
};

export default useDonate;
