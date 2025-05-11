import { error, success } from "@/lib/api/response";
import { validateChainId, getNetworkInfo } from "@/lib/networks";
import { INetwork } from "@/types/network";
import { NextRequest } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ networkId: string }> }
) {
    try {
        const { networkId } = await params;

        if (!networkId) {
            return error("Network ID is required", 400);
        }

        if (isNaN(Number(networkId))) {
            return error("Network ID must be a number", 400);
        }

        const networkIdNumber = Number(networkId);

        validateChainId(networkIdNumber);

        try {
            // Use the getNetworkInfo function to get the network details
            const network = await getNetworkInfo(networkIdNumber);
            return success<INetwork>(network);
        } catch (networkError) {
            // Handle specific network errors
            if (networkError instanceof Error) {
                // Check if it's a "not supported" error
                if (networkError.message.includes("not supported")) {
                    return error(networkError.message, 404);
                }
                return error(networkError.message, 500);
            }
            return error("Error fetching network details", 500);
        }
    } catch (err: unknown) {
        const errorMessage =
            err instanceof Error
                ? err.message
                : "Error fetching network details";
        return error(errorMessage, 500);
    }
}
