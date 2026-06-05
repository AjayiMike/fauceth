import { env } from "@/config/env";
import { INetwork } from "@/types/network";
import { Address, createWalletClient, fallback, Hex, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
    getETHBalance,
    getNetworkInfo,
    networkInfoToViemChain,
} from "@/lib/networks";

const FUNDING_VAULT_ABI = [
    {
        type: "function",
        name: "claim",
        stateMutability: "nonpayable",
        inputs: [{ name: "amount", type: "uint256" }],
        outputs: [],
    },
] as const;

export const FUNDING_VAULT_CHAIN_IDS = {
    sepolia: 11155111,
    hoodi: 560048,
} as const;

type FundingVaultNetworkTarget = {
    key: keyof typeof FUNDING_VAULT_CHAIN_IDS;
    chainId: number;
};

export type FundingVaultResolvedNetwork = {
    key: FundingVaultNetworkTarget["key"];
    chainId: number;
    network: INetwork | null;
    error?: string;
};

const FUNDING_VAULT_NETWORK_TARGETS: FundingVaultNetworkTarget[] = [
    { key: "sepolia", chainId: FUNDING_VAULT_CHAIN_IDS.sepolia },
    { key: "hoodi", chainId: FUNDING_VAULT_CHAIN_IDS.hoodi },
];

export const getFundingVaultNetworks = async (): Promise<
    FundingVaultResolvedNetwork[]
> => {
    const resolutions = await Promise.allSettled(
        FUNDING_VAULT_NETWORK_TARGETS.map(async (target) => ({
            ...target,
            network: await getNetworkInfo(target.chainId),
        }))
    );

    return resolutions.map((result, index) => {
        const target = FUNDING_VAULT_NETWORK_TARGETS[index];
        if (result.status === "fulfilled") {
            return result.value;
        }

        return {
            key: target.key,
            chainId: target.chainId,
            network: null,
            error:
                result.reason instanceof Error
                    ? result.reason.message
                    : "Unknown network resolution error",
        };
    });
};

export const shouldTriggerFundingClaim = async (
    network: INetwork,
    threshold: number
) => {
    const { balance, urls } = await getETHBalance(
        env.FAUCET_ADDRESS as Address,
        network.rpc,
        network.nativeCurrency.decimals
    );

    return {
        balance,
        threshold,
        urls,
        shouldClaim: balance < threshold,
    };
};

export const claimAllAvailableFunding = async (
    network: INetwork,
    rpcUrls: string[]
) => {
    if (!env.FAUCET_PK) {
        throw new Error("FAUCET_PRIVATE_KEY is missing");
    }

    const account = privateKeyToAccount(`0x${env.FAUCET_PK}` as Hex);
    const walletClient = createWalletClient({
        chain: networkInfoToViemChain(network),
        account,
        transport: fallback(rpcUrls.map((url) => http(url))),
    });

    const txHash = await walletClient.writeContract({
        address: env.FUNDING_VAULT_CONTRACT_ADDRESS as Address,
        abi: FUNDING_VAULT_ABI,
        functionName: "claim",
        args: [BigInt(0)],
    });

    return txHash;
};
