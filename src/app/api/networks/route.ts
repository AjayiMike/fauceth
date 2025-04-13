import { NextRequest } from "next/server";
import { error, success } from "@/lib/api/response";
import { ChainsResponse, INetwork } from "@/types/network";
import { filterDesiredNetworks } from "@/lib/networks";
import { getAllCachedNetworks, setCachedNetworks } from "@/lib/networks/cache";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(req: NextRequest) {
    try {
        // Check if we have cached data that's still valid
        const cachedData = getAllCachedNetworks();
        if (cachedData) {
            return success(cachedData);
        }

        // If no valid cache, fetch fresh data
        const networks = await fetch("https://chainid.network/chains.json");

        if (!networks.ok) {
            throw new Error("Failed to fetch networks");
        }
        const data: ChainsResponse = await networks.json();

        // Process the data
        const processedData = filterDesiredNetworks(data).map<INetwork>(
            (network) => ({
                chainId: network.chainId,
                name: network.name,
                rpc: network.rpc.filter((rpc) => !rpc.startsWith("wss://")),
                nativeCurrency: network.nativeCurrency,
                explorers: network.explorers || [],
            })
        );

        // Update the cache
        setCachedNetworks(processedData);

        return success(processedData);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        // If we have cached data but the fresh fetch failed, return the cached data
        const cachedData = getAllCachedNetworks();
        if (cachedData) {
            return success(cachedData);
        }
        return error(err.message || "Internal server error", 500);
    }
}
