import { env } from "@/config/env";
import {
    Address,
    Chain,
    createPublicClient,
    createWalletClient,
    fallback,
    Hex,
    http,
    keccak256,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

/**
 * Calculates the daily claim amount based on the faucet balance.
 * The claim amount is scaled between 0 and 1 based on the balance.
 * @param faucetBalance - The balance of the faucet.
 * @returns The daily claim amount.
 */
export const calculateDailyClaimAmount = (faucetBalance: number): number => {
    const MAX_CLAIM = Number(env.MAX_CLAIM);
    const MIN_BALANCE = Number(env.MIN_BALANCE);
    const OPTIMAL_BALANCE = Number(env.OPTIMAL_BALANCE);

    // If balance is below minimum, return 0
    if (faucetBalance < MIN_BALANCE) {
        return 0;
    }

    // If balance is above optimal, return max claim
    if (faucetBalance >= OPTIMAL_BALANCE) {
        return MAX_CLAIM;
    }

    // Calculate scaling factor between 0 and 1 based on balance
    const scalingFactor =
        (faucetBalance - MIN_BALANCE) / (OPTIMAL_BALANCE - MIN_BALANCE);

    // Return scaled amount, rounded to 4 decimal places
    return Number((MAX_CLAIM * scalingFactor).toFixed(4));
};

export const sendETH = async (
    address: Address,
    amount: bigint,
    rpcUrls: string[],
    chain: Chain
) => {
    const walletClient = createWalletClient({
        chain: chain,
        account: privateKeyToAccount(`0x${env.FAUCET_PK}` as Hex),
        transport: fallback(rpcUrls.map((url) => http(url))),
    });
    const publicClient = createPublicClient({
        chain: chain,
        transport: fallback(rpcUrls.map((url) => http(url))),
    });

    let chainType: "legacy" | "eip1559" = "eip1559";
    let maxFeePerGas: bigint | undefined;
    let maxPriorityFeePerGas: bigint | undefined;
    let gasPrice: bigint | undefined;

    try {
        ({ maxFeePerGas, maxPriorityFeePerGas } =
            await publicClient.estimateFeesPerGas({
                type: "eip1559",
                chain,
            }));
        // some rpc providers don't return maxPriorityFeePerGas, so we need to calculate it
        if (
            maxFeePerGas &&
            (!maxPriorityFeePerGas || maxPriorityFeePerGas === BigInt(0))
        ) {
            // Calculate priority fee as 30% of the original maxFeePerGas
            maxPriorityFeePerGas =
                (maxFeePerGas * BigInt(130)) / BigInt(100) - maxFeePerGas;
            // Recalculate maxFeePerGas as base fee + priority fee for EIP-1559 compliance
            maxFeePerGas = maxPriorityFeePerGas + maxFeePerGas;
        }
    } catch (error) {
        console.error(error);
        gasPrice = await publicClient.getGasPrice();
        chainType = "legacy";
    }

    let tx: Hex;

    if (chainType === "eip1559") {
        tx = await walletClient.sendTransaction({
            to: address,
            value: amount,
            gas: BigInt(21000),
            type: chainType,
            maxFeePerGas: maxFeePerGas,
            maxPriorityFeePerGas: maxPriorityFeePerGas,
        });
    } else {
        tx = await walletClient.sendTransaction({
            to: address,
            value: amount,
            gas: BigInt(21000),
            type: chainType,
            gasPrice: gasPrice,
        });
    }

    return tx;
};

export const calculateSendETHTxHash = async (
    address: Address,
    amount: bigint,
    rpcUrls: string[],
    chain: Chain
) => {
    const walletClient = createWalletClient({
        chain: chain,
        account: privateKeyToAccount(`0x${env.FAUCET_PK}` as Hex),
        transport: fallback(rpcUrls.map((url) => http(url))),
    });

    const request = await walletClient.prepareTransactionRequest({
        account: env.FAUCET_ADDRESS as Address,
        to: address,
        value: amount,
    });

    const tx = await walletClient.signTransaction(request);

    const txHash = keccak256(tx);
    return txHash;
};
