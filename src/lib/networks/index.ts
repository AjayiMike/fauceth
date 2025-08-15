import { ChainidNetworkAPIResponseType, INetwork } from "@/types/network";
import { retry } from "../retry";
import {
    Address,
    createPublicClient,
    defineChain,
    fallback,
    formatUnits,
    getAddress,
    Hex,
    http,
    isAddress,
    Transaction,
    TransactionReceipt,
} from "viem";
import { TESTNET_KEYWORDS } from "@/config/networks";
import { getCachedNetwork } from "./cache";

export const CONFIG = {
    API_ENDPOINTS: {
        CHAINID: "https://chainid.network",
    },
    RPC_TEST_TIMEOUT: 15000, // 15 seconds is a generous non-blocking timeout
    RPC_CACHE_DURATION: 1000 * 20 * 60, // 20 minutes in milliseconds
} as const;

/**
 * Fetches the network details for a given chain ID.
 * @param chainId - The chain ID to fetch the network details for.
 * @returns The network details for the given chain ID.
 */
export const fetchNetworkDetails = async (
    networkId: number
): Promise<ChainidNetworkAPIResponseType> => {
    const response = await retry(async () => {
        const res = await fetch(
            `${CONFIG.API_ENDPOINTS.CHAINID}/page-data/chain/${networkId}/page-data.json`
        );
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
    }, `Failed to fetch network data for chain ${networkId}`);
    return response.result.data.chain as ChainidNetworkAPIResponseType;
};

const rpcTestCache: Map<string, { result: boolean; timestamp: number }> =
    new Map();

/**
 * Extracts result and cache rpc URL
 * @param url - The RPC URL associated with the response
 * @param response - The response object
 * @param now (optional) - timestamp of when the response was obtained
 * @returns ok bool, and the result string
 */
const processRPCResponse = async (
    url: string,
    response: Response,
    now?: number
): Promise<{ ok: boolean; result: string }> => {
    if (!response.ok) {
        rpcTestCache.set(url, { result: false, timestamp: now ?? Date.now() });
        return { ok: false, result: "" };
    }

    const data = await response.json();
    const result = data.result !== undefined && !data.error;

    // Cache the result
    rpcTestCache.set(url, { result, timestamp: now ?? Date.now() });
    return { ok: true, result: data.result };
};

const isURLInCache = (url: string): boolean => {
    const cached = rpcTestCache.get(url);
    const now = Date.now();

    if (cached && now - cached.timestamp < CONFIG.RPC_CACHE_DURATION) {
        return cached.result;
    }
    return false;
};

/**
 * Gets the transaction details of a transaction on a list of RPC URLs.
 * @param txHash - The hash of the transaction to get the details of.
 * @param rpcUrls - The list of RPC URLs to try to get the details from.
 * @returns The transaction details.
 */
export const getTransaction = async (
    txHash: Hex,
    rpcUrls: string[]
): Promise<{
    status: TransactionReceipt["status"];
    tx: Transaction;
}> => {
    const publicClient = createPublicClient({
        transport: fallback(rpcUrls.map((url) => http(url))),
    });
    const txReceipt = await publicClient.getTransactionReceipt({
        hash: txHash,
    });
    const tx = await publicClient.getTransaction({ hash: txHash });
    return {
        status: txReceipt?.status,
        tx,
    };
};

/**
 * Gets the balance of an address on a list of RPC URLs on a network.
 * @param address - The address to get the balance of.
 * @param rpcUrls - The list of RPC URLs to get the balance from.
 * @param decimals - The number of decimals to format the balance to.
 * @returns The balance of the address, and active RPC URLs.
 */
export const getETHBalance = async (
    address: Address,
    rpcUrls: string[],
    decimals = 18,
    urlsOnly = false
): Promise<{ balance: number; urls: string[] }> => {
    if (rpcUrls.length === 0) {
        throw new Error("No RPC URLs provided");
    }
    if (!isAddress(address)) {
        throw new Error("Invalid address");
    }
    // Filter out template URLs first
    const candidateUrls = rpcUrls.filter(
        (url) => !url.includes("API_KEY") && !url.startsWith("wss://")
    );
    // if no valid URLs are left, treat same as no URLs provided
    if (candidateUrls.length === 0) {
        throw new Error("No valid RPC URLs provided");
    }

    // return valid cached URLs if only URLs are needed
    if (urlsOnly) {
        const cached = candidateUrls.filter((url) => isURLInCache(url));
        if (cached.length > 0) {
            return { balance: 0, urls: cached };
        }
    }

    // Try each RPC URL and get balances
    const results = await Promise.allSettled(
        candidateUrls.map(async (url) =>
            retry(async () => {
                const controller = new AbortController();
                const timeoutId = setTimeout(
                    () => controller.abort(),
                    CONFIG.RPC_TEST_TIMEOUT
                );
                // The actual fetch promise
                try {
                    const response = await fetch(url, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            jsonrpc: "2.0",
                            method: "eth_getBalance",
                            params: [address, "latest"],
                            id: 1,
                        }),
                        signal: controller.signal,
                    });

                    // send url to cache, and get result
                    const { ok, result } = await processRPCResponse(
                        url,
                        response,
                        Date.now()
                    );
                    if (!ok || result == null) {
                        throw new Error(
                            `RPC ${url} failed, ${response.status}`
                        );
                    }
                    return [url, result] as [string, string];
                } finally {
                    clearTimeout(timeoutId);
                }
            }, `Failed to get balance from RPC ${url}`)
        )
    );

    // extract successful balances and urls
    const urlBalances: Map<string, string> = new Map();

    for (const res of results) {
        if (res.status === "fulfilled") {
            const [url, balance] = res.value;
            if (balance !== null && balance !== undefined) {
                urlBalances.set(url, balance);
            }
        }
    }

    const urls = Array.from(urlBalances.keys());
    if (urlsOnly) {
        return { balance: 0, urls };
    }

    if (urlBalances.size === 0) {
        throw new Error("Failed to get balance from any RPC");
    }

    // Find the most common balance (majority/mode)
    const balanceCounts = new Map<string, number>();
    let majorityBalance = "0";
    let maxCount = 0;
    const majorityThreshold = Math.floor(urlBalances.size / 2) + 1;

    for (const balance of urlBalances.values()) {
        const count = (balanceCounts.get(balance) ?? 0) + 1;
        balanceCounts.set(balance, count);
        if (count > maxCount) {
            maxCount = count;
            majorityBalance = balance;
        }
        if (count >= majorityThreshold) {
            break;
        }
    }

    return {
        balance: Number(formatUnits(BigInt(majorityBalance), decimals)),
        urls,
    };
};

/**
 * Checks if an address matches another address.
 * @param address - The address to check.
 * @param otherAddress - The address to match against.
 * @returns True if the address matches, false otherwise.
 */
export const isMatchingAddress = (address: Address, otherAddress: Address) => {
    return getAddress(address) === getAddress(otherAddress);
};

export const isTestnet = (chain: ChainidNetworkAPIResponseType) => {
    const lowercaseValues = [chain.name, chain.title, chain.shortName].map(
        (val) => val?.toLowerCase()
    );

    return TESTNET_KEYWORDS.some((keyword) =>
        lowercaseValues.some((val) => val?.includes(keyword))
    );
};

export const hasPublicRPCs = (network: ChainidNetworkAPIResponseType) => {
    return (
        network.rpc.length > 0 &&
        !network.rpc.every((r) => r.includes("$")) &&
        !network.rpc.every((r) => r.startsWith("wss://"))
    );
};

export const filterDesiredNetworks = (
    networks: ChainidNetworkAPIResponseType[]
) => networks.filter((network) => isTestnet(network) && hasPublicRPCs(network));

/**
 * MAX_SAFE_CHAIN_ID is the upper bound limit on what will be accepted for `chainId`
 * `MAX_SAFE_CHAIN_ID = floor( ( 2**53 - 39 ) / 2 ) = 4503599627370476`
 *
 * @see {@link https://github.com/MetaMask/metamask-extension/blob/b6673731e2367e119a5fee9a454dd40bd4968948/shared/constants/network.js#L31}
 */
export const MAX_SAFE_CHAIN_ID = 4503599627370476;

export const validateChainId = (chainId: number): void => {
    if (
        !Number.isInteger(chainId) ||
        chainId <= 0 ||
        chainId > MAX_SAFE_CHAIN_ID
    ) {
        throw new Error(`Invalid chainId ${chainId}`);
    }
};

/**
 * @title isSupportedChain
 * @dev Function to check if a chain is supported.
 * @param chainId The chain ID to check.
 * @returns True if the chain ID is supported, false otherwise.
 */
export function isSupportedChain(chainId: number | null | undefined): boolean {
    if (!chainId) return false;
    return getCachedNetwork(chainId) !== null;
}

/**
 * @title getNetworkInfo
 * @dev Retrieves network information for a given chain ID, first checking the cache
 *      and falling back to fetching from the API if not found.
 *
 * @notice This function first attempts to retrieve the network from the cache.
 *         If not found, it fetches the network details from the ChainID API,
 *         validates the network using filterDesiredNetworks, and returns
 *         a properly formatted INetwork object.
 *
 * @param chainId The chain ID of the network to retrieve
 * @return Promise<INetwork> A promise that resolves to the network information
 * @throws Error if the network cannot be fetched from the API or is not supported
 *
 * @example
 * // Get network info for Sepolia testnet
 * const sepoliaNetwork = await getNetworkInfo(11155111);
 */
export const getNetworkInfo = async (chainId: number): Promise<INetwork> => {
    console.log(
        `[getNetworkInfo] Fetching network info for chainId: ${chainId}`
    );

    // First try to get from cache
    const cachedNetwork = getCachedNetwork(chainId);
    if (cachedNetwork) {
        console.log(
            `[getNetworkInfo] Found network in cache: ${cachedNetwork.name}`
        );
        return cachedNetwork;
    }

    // If not in cache, fetch from API
    try {
        console.log(`[getNetworkInfo] Network not in cache, fetching from API`);
        const networkDetails = await fetchNetworkDetails(chainId);
        console.log(
            `[getNetworkInfo] Fetched network details: ${networkDetails.name}`
        );

        // Validate the network using filterDesiredNetworks
        const validatedNetworks = filterDesiredNetworks([networkDetails]);
        console.log(
            `[getNetworkInfo] Validated networks count: ${validatedNetworks.length}`
        );

        if (validatedNetworks.length === 0) {
            console.log(
                `[getNetworkInfo] Network not supported: ${networkDetails.name}`
            );
            throw new Error(`Network with chainId ${chainId} is not supported`);
        }

        const validatedNetwork = validatedNetworks[0];
        console.log(
            `[getNetworkInfo] Using validated network: ${validatedNetwork.name}`
        );

        // Create network object
        const network: INetwork = {
            chainId: validatedNetwork.chainId,
            name: validatedNetwork.name,
            rpc: validatedNetwork.rpc.filter(
                (rpc) => !rpc.startsWith("wss://")
            ),
            nativeCurrency: validatedNetwork.nativeCurrency,
            explorers: validatedNetwork.explorers || [],
        };

        return network;
    } catch (error) {
        console.error(
            `[getNetworkInfo] Error fetching network info for chainId ${chainId}:`,
            error
        );
        throw error; // Re-throw the original error to preserve the message
    }
};

export const networkInfoToViemChain = (network: INetwork) => {
    return defineChain({
        id: network.chainId,
        name: network.name,
        nativeCurrency: network.nativeCurrency,
        rpcUrls: {
            default: {
                http: network.rpc,
            },
        },
        blockExplorers:
            network.explorers.length > 0
                ? {
                      default: {
                          name: network.explorers[0].name,
                          url: network.explorers[0].url,
                      },
                  }
                : undefined,
        testnet: true,
    });
};

export const getNetworkPublicClient = (network: INetwork) => {
    const transport = fallback(
        network?.rpc ? network.rpc.map((url) => http(url)) : []
    );

    return createPublicClient({
        chain: defineChain({
            id: network?.chainId,
            name: network?.name,
            rpcUrls: {
                default: { http: network.rpc },
            },
            nativeCurrency: {
                name: network?.nativeCurrency.name,
                symbol: network?.nativeCurrency.symbol,
                decimals: network?.nativeCurrency.decimals,
            },
        }),
        transport: transport,
    });
};

export const getPreferredExplorer = (network?: INetwork | null) => {
    if (!network?.explorers || network.explorers.length === 0) return null;

    if (network.explorers.length > 1) {
        const etherscan = network.explorers.find((explorer) =>
            explorer.url.includes("etherscan")
        );
        const blockScout = network.explorers.find((explorer) =>
            explorer.url.includes("blockscout")
        );
        const otterscan = network.explorers.find((explorer) =>
            explorer.url.includes("otterscan")
        );
        return etherscan || blockScout || otterscan || network.explorers[0];
    }
    return network.explorers[0];
};
