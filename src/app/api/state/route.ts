import { error, success, validateQueryParams } from "@/lib/api/response";
import { NetworkFaucetState } from "@/lib/api/types";
import { calculateDailyClaimAmount } from "@/lib/faucet";
import { fetchNetworkDetails, getETHBalance } from "@/lib/networks";
import { filterWorkingRPCs } from "@/lib/networks";
import { NextRequest } from "next/server";
import { Address } from "viem";
import { z } from "zod";

const querySchema = z.object({
    networkId: z.string().transform(Number).pipe(z.number().int().positive()),
});

const FAUCET_ADDRESS = process.env.NEXT_PUBLIC_FAUCET_ADDRESS;
if (!FAUCET_ADDRESS) {
    throw new Error(
        "NEXT_PUBLIC_FAUCET_ADDRESS environment variable is not set"
    );
}

export async function GET(req: NextRequest) {
    try {
        // Validate query parameters
        const { networkId } = validateQueryParams(
            req.nextUrl.searchParams,
            querySchema.parse
        );

        // Fetch and validate network details
        const networkDetails = await fetchNetworkDetails(networkId);
        if (!networkDetails.rpc.length) {
            return error("No RPC URLs found for network", 400);
        }

        // Get working RPCs
        const workingRPCURLs = await filterWorkingRPCs(networkDetails.rpc);
        if (workingRPCURLs.length === 0) {
            return error("No working RPC URLs found for network", 400);
        }

        // Get faucet balance
        const faucetBalance = await getETHBalance(
            FAUCET_ADDRESS as Address,
            workingRPCURLs
        );

        // Calculate daily claim amount
        const dailyClaimAmount = calculateDailyClaimAmount(faucetBalance);

        // Return success response
        return success<NetworkFaucetState>({
            dailyClaimAmount,
            faucetBalance,
            claimInterval: 24 * 60 * 60,
            networkId,
            timestamp: new Date(),
        });
    } catch (err) {
        console.debug("Error fetching network state:", err);

        // Handle specific error cases
        if (err instanceof Error) {
            if (err.message.includes("Validation error")) {
                return error(err.message, 400);
            }
            if (err.message.includes("No RPC URLs")) {
                return error(err.message, 400);
            }
        }

        // Generic error response
        return error("Failed to fetch network state", 500);
    }
}
