import { NextRequest } from "next/server";
import { success, error, validateRequest } from "@/lib/api/response";
import {
    checkRateLimitForIpAddress,
    checkRateLimitForWalletAddress,
    getOrCreateUser,
    recordRequest,
    getOrCreateIpAddress,
    checkUserExistsAndDonations,
} from "@/lib/db/operations";
import { z } from "zod";
import { Address, getAddress } from "viem";
import {
    filterWorkingRPCs,
    getETHBalance,
    getNetworkInfo,
    networkInfoToViemChain,
} from "@/lib/networks";
import { calculateDailyClaimAmount, sendETH } from "@/lib/faucet";
import { RequestFaucetResponse } from "@/lib/api/types";
import { withTransaction } from "@/lib/db/with-db";
import { parseEther } from "viem";
import { getPassportScore } from "@/lib/passport";
import { verifyHCaptcha } from "@/lib/captcha/hCaptcha";
import { formatDistanceToNow } from "date-fns";
import { env } from "@/config/env";
import { ClientSession } from "mongodb";

const requestBodySchema = z.object({
    networkId: z.number().int().positive(),
    address: z
        .string()
        .regex(
            /^0x[a-fA-F0-9]{40}$/,
            "Please provide a valid Ethereum address (starting with 0x followed by 40 hexadecimal characters)"
        ),
});

type RequestBody = z.infer<typeof requestBodySchema>;

export async function POST(req: NextRequest) {
    try {
        return await withTransaction(
            req,
            async (session: ClientSession, req: NextRequest) => {
                const body = await req.json();
                const { networkId, address } = validateRequest<RequestBody>(
                    body,
                    requestBodySchema.parse
                );

                const checkSummedAddress = getAddress(address);

                // Determine client IP in a way that cannot be spoofed by the caller.
                // Vercel injects `x-vercel-forwarded-for` after terminating TLS, so we trust that first.
                // We also accept `x-real-ip` from other trusted proxies (e.g. Cloudflare) if present.
                let ipAddress: string | null =
                    req.headers.get("x-vercel-forwarded-for") ??
                    req.headers.get("x-real-ip") ??
                    (process.env.NODE_ENV === "development"
                        ? "127.0.0.1"
                        : null);

                // If multiple IPs are present (unlikely with the trusted headers), take the first.
                if (ipAddress) {
                    ipAddress = ipAddress.split(",")[0].trim();
                } else {
                    return error("Unable to determine client IP address.", 400);
                }

                const captchaToken = req.headers.get("captcha-token");

                if (!captchaToken) {
                    return error(
                        "Security verification failed: hCaptcha token not found. Please refresh the page and try again with hCaptcha enabled.",
                        403
                    );
                }

                const hCaptchaResponse = await verifyHCaptcha(
                    captchaToken,
                    env.HCAPTCHA_SECRET as string,
                    env.HCAPTCHA_SITE_KEY as string,
                    ipAddress
                );

                if (!hCaptchaResponse.success) {
                    return error(
                        "Security verification failed: hCaptcha validation was unsuccessful. Please refresh the page and complete the hCaptcha challenge again.",
                        403
                    );
                }
                // Check rate limit
                const ipRateLimit = await checkRateLimitForIpAddress(
                    ipAddress,
                    networkId,
                    session
                );

                const walletRateLimit = await checkRateLimitForWalletAddress(
                    checkSummedAddress,
                    networkId,
                    session
                );

                if (!ipRateLimit.canRequest && ipRateLimit.nextAvailableAt) {
                    const message =
                        ipRateLimit.reason === "network_specific"
                            ? `You've already requested tokens on this network from this IP. You can request again in ${formatDistanceToNow(
                                  ipRateLimit.nextAvailableAt,
                                  { addSuffix: false }
                              )}.`
                            : `You've reached the limit of ${
                                  env.DISTINCT_NETWORK_LIMIT
                              } different networks per day from this IP. You can request again in ${formatDistanceToNow(
                                  ipRateLimit.nextAvailableAt,
                                  { addSuffix: false }
                              )}.`;

                    return error(message, 429);
                }

                if (
                    !walletRateLimit.canRequest &&
                    walletRateLimit.nextAvailableAt
                ) {
                    const message =
                        walletRateLimit.reason === "network_specific"
                            ? `This wallet has already requested tokens on this network. You can request again in ${formatDistanceToNow(
                                  walletRateLimit.nextAvailableAt,
                                  { addSuffix: false }
                              )}.`
                            : `This wallet has reached the limit of ${
                                  env.DISTINCT_NETWORK_LIMIT
                              } different networks per day. You can request from another network in ${formatDistanceToNow(
                                  walletRateLimit.nextAvailableAt,
                                  { addSuffix: false }
                              )}.`;

                    return error(message, 429);
                }

                const [userExists, totalDonations] =
                    await checkUserExistsAndDonations(
                        checkSummedAddress,
                        session
                    );

                if (userExists) {
                    // For existing users, check if they have sufficient donations
                    const hasSufficientDonations =
                        totalDonations >=
                        Number(env.MIN_DONATION_REQUIRED_FOR_VERIFICATION);

                    // If they haven't donated enough, check their Passport score
                    if (!hasSufficientDonations) {
                        const [meetsThreshold, score] =
                            await getPassportScore(checkSummedAddress);

                        // If both verification methods fail, return error with both options
                        if (!meetsThreshold) {
                            return error(
                                `Verification required: Your donations (${totalDonations} ETH) are below our threshold of ${env.MIN_DONATION_REQUIRED_FOR_VERIFICATION} ETH, and your Gitcoin Passport score (${score}) is below our required threshold of ${env.PASSPORT_SCORE_THRESHOLD}. Please either make a donation or increase your Passport score at https://app.passport.xyz to use the faucet.`,
                                403
                            );
                        }
                        // Continue if Passport score is good (even if donations aren't)
                    }
                    // Continue if donations are good
                } else {
                    // For new users, they can't have donations yet, so check only Passport score
                    const [meetsThreshold, score] =
                        await getPassportScore(checkSummedAddress);

                    if (!meetsThreshold) {
                        return error(
                            `Your Gitcoin Passport score (${score}) needs to be at least ${env.PASSPORT_SCORE_THRESHOLD} to use this faucet. Please visit https://app.passport.xyz to increase your score, or consider making a small donation instead.`,
                            403
                        );
                    }
                    // Continue if Passport score is good
                }

                // Get network details and working RPCs
                const networkDetails = await getNetworkInfo(networkId);
                const workingRPCs = await filterWorkingRPCs(networkDetails.rpc);

                if (workingRPCs.length === 0) {
                    return error(
                        "Network connectivity issue. We're having trouble connecting to the blockchain right now. Please try again in a few minutes.",
                        503
                    );
                }

                // Get faucet's ETH balance
                const balance = await getETHBalance(
                    env.FAUCET_ADDRESS as Address,
                    workingRPCs
                );

                // Calculate claim amount
                const claimAmount = calculateDailyClaimAmount(balance);

                if (claimAmount === 0) {
                    return error(
                        "The faucet is currently low on funds. Please check back later or consider making a donation to help replenish it.",
                        503
                    );
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
                    networkInfoToViemChain(networkDetails)
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

                return success<RequestFaucetResponse>({
                    success: true,
                    amount: claimAmount,
                    txHash,
                });
            }
        );
    } catch (err) {
        console.debug("Request error:", err);
        if (err instanceof z.ZodError) {
            // Handle validation errors specifically
            const errorMessage = err.errors
                .map((e) => `${e.path.join(".")}: ${e.message}`)
                .join(", ");
            return error(`Please check your request: ${errorMessage}`, 400);
        }
        return error(
            err instanceof Error
                ? `Something went wrong: ${err.message}. Please try again or contact @0xadek on x if the issue persists.`
                : "An unexpected error occurred while processing your request. Please try again later.",
            500
        );
    }
}
