import { NextRequest } from "next/server";
import { success, error, validateRequest } from "@/lib/api/response";
import {
    checkRateLimit,
    updateRateLimit,
    getOrCreateUser,
    recordRequest,
    getOrCreateIpAddress,
    checkUserExists,
} from "@/lib/db/operations";
import { z } from "zod";
import { Address, getAddress } from "viem";
import {
    filterWorkingRPCs,
    getETHBalance,
    getNetworkInfo,
} from "@/lib/networks";
import { calculateDailyClaimAmount, sendETH } from "@/lib/faucet";
import { RequestFaucetResponse } from "@/lib/api/types";
import { withTransaction } from "@/lib/db/with-db";
import { parseEther } from "viem";
import { sepolia } from "viem/chains";
import { getPassportScore } from "@/lib/passport";

const requestBodySchema = z.object({
    networkId: z.number().int().positive(),
    address: z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
});

type RequestBody = z.infer<typeof requestBodySchema>;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { networkId, address } = validateRequest<RequestBody>(
            body,
            requestBodySchema.parse
        );

        const checkSummedAddress = getAddress(address);

        // Get IP address from headers or use a development fallback
        const forwardedFor = req.headers.get("x-forwarded-for");
        const ipAddress = forwardedFor
            ? forwardedFor.split(",")[0].trim() // Get the first IP in the chain
            : process.env.NODE_ENV === "development"
            ? "127.0.0.1" // Use localhost for development
            : "unknown";

        return await withTransaction(async (session) => {
            // Check rate limit
            const rateLimit = await checkRateLimit(
                checkSummedAddress,
                ipAddress,
                networkId,
                session
            );

            if (!rateLimit.canRequest && rateLimit.nextAvailableAt) {
                return error(
                    `Rate limit exceeded. Try again after ${rateLimit.nextAvailableAt.toISOString()}`,
                    429
                );
            }

            const userExists = await checkUserExists(
                checkSummedAddress,
                session
            );

            // if user does not exist in the system yet, check their passport score and ensure it meets threshold
            if (!userExists) {
                const [meetsThreshold, score] = await getPassportScore(
                    checkSummedAddress
                );
                if (!meetsThreshold) {
                    return error(
                        `Passport score too low. Required at least ${process.env.PASSPORT_SCORE_THRESHOLD}, Actual: ${score}`,
                        403
                    );
                }
            }

            // Get network details and working RPCs
            const networkDetails = await getNetworkInfo(networkId);
            const workingRPCs = await filterWorkingRPCs(networkDetails.rpc);

            if (workingRPCs.length === 0) {
                return error("No working RPCs found", 503);
            }

            // Get faucet's ETH balance
            const balance = await getETHBalance(
                process.env.NEXT_PUBLIC_FAUCET_ADDRESS as Address,
                workingRPCs
            );

            // Calculate claim amount
            const claimAmount = calculateDailyClaimAmount(balance);

            if (claimAmount === 0) {
                return error("Low faucet balance", 503);
            }

            // Get or create user and IP address
            const [user, ipAddressId] = await Promise.all([
                getOrCreateUser(checkSummedAddress, session),
                getOrCreateIpAddress(ipAddress, session),
            ]);

            // Send ETH - keeping this inside the transaction as requested
            const txHash = await sendETH(
                checkSummedAddress,
                parseEther(claimAmount.toString()),
                workingRPCs,
                sepolia
            );

            // Record request
            await recordRequest(
                user._id.toString(),
                ipAddressId,
                networkId,
                claimAmount,
                txHash,
                session
            );

            // Update rate limit
            await updateRateLimit(
                checkSummedAddress,
                ipAddress,
                networkId,
                session
            );

            return success<RequestFaucetResponse>({
                success: true,
                txHash,
            });
        });
    } catch (err) {
        console.debug("Request error:", err);
        return error(
            err instanceof Error ? err.message : "Internal server error",
            500
        );
    }
}
