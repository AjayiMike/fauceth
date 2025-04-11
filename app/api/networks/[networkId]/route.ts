import { error, success } from "@/lib/api/response";
import {
    fetchNetworkDetails,
    filterDesiredNetworks,
    validateChainId,
} from "@/lib/networks";
import { INetwork } from "@/types/network";
import { NextRequest } from "next/server";
import { getCachedNetwork } from "@/lib/networks/cache";

export async function GET(
    req: NextRequest,
    { params }: { params: { networkId: string } }
) {
    try {
        if (!params.networkId) {
            return error("Network ID is required", 400);
        }

        if (isNaN(Number(params.networkId))) {
            return error("Network ID must be a number", 400);
        }

        const networkId = Number(params.networkId);

        validateChainId(networkId);

        // Check if we have cached network details
        const cachedNetwork = getCachedNetwork(networkId);
        if (cachedNetwork) {
            return success<INetwork>(cachedNetwork);
        }

        // If no valid cache, fetch fresh data
        const networkDetails = await fetchNetworkDetails(networkId);

        console.log("networkDetails: ", networkDetails);

        if (!networkDetails) {
            return error("Network not found", 404);
        }

        const validatedNetwork = filterDesiredNetworks([networkDetails]);

        if (!validatedNetwork.length) {
            return error("Network not supported", 404);
        }

        // Create the network object
        const networkObj: INetwork = {
            chainId: validatedNetwork[0].chainId,
            name: validatedNetwork[0].name,
            rpc: validatedNetwork[0].rpc.filter(
                (rpc) => !rpc.startsWith("wss://")
            ),
            nativeCurrency: validatedNetwork[0].nativeCurrency,
            explorers: validatedNetwork[0].explorers || [],
        };

        // We don't set the cache here to avoid potential issues
        // The cache will be updated by the main networks route

        return success<INetwork>(networkObj);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        return error(err.message || "Error fetching network details", 500);
    }
}
