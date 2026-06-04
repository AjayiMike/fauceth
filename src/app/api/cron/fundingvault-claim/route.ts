import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { env } from "@/config/env";
import {
    claimAllAvailableFunding,
    getFundingVaultNetworks,
    shouldTriggerFundingClaim,
} from "@/lib/fundingvault";

const verifyCronAuthorization = (req: NextRequest) => {
    if (!env.CRON_SECRET) return true;

    const authHeader = req.headers.get("authorization");
    return authHeader === `Bearer ${env.CRON_SECRET}`;
};

export async function GET(req: NextRequest) {
    try {
        if (!verifyCronAuthorization(req)) {
            return error("Unauthorized cron request.", 401);
        }

        const threshold = Number(env.FUNDING_VAULT_MIN_BALANCE_THRESHOLD);
        if (Number.isNaN(threshold) || threshold < 0) {
            return error(
                "Invalid FUNDING_VAULT_MIN_BALANCE_THRESHOLD configuration.",
                500
            );
        }

        const networks = await getFundingVaultNetworks();
        if (networks.length === 0) {
            return error("Could not resolve Sepolia/Hoodi networks.", 500);
        }

        const results = await Promise.all(
            networks.map(async (network) => {
                try {
                    const { balance, shouldClaim, urls } =
                        await shouldTriggerFundingClaim(network, threshold);

                    if (!shouldClaim) {
                        const skippedResult = {
                            network: network.name,
                            chainId: network.chainId,
                            balance,
                            threshold,
                            claimed: false,
                            reason: "balance-above-threshold",
                        };
                        console.info(
                            "[fundingvault-claim] skipped",
                            skippedResult
                        );
                        return skippedResult;
                    }

                    const txHash = await claimAllAvailableFunding(
                        network,
                        urls
                    );
                    const claimedResult = {
                        network: network.name,
                        chainId: network.chainId,
                        balance,
                        threshold,
                        claimed: true,
                        txHash,
                    };
                    console.info("[fundingvault-claim] claimed", claimedResult);
                    return claimedResult;
                } catch (networkError) {
                    const failedResult = {
                        network: network.name,
                        chainId: network.chainId,
                        claimed: false,
                        error:
                            networkError instanceof Error
                                ? networkError.message
                                : "Unknown error",
                    };
                    console.error("[fundingvault-claim] failed", failedResult);
                    return failedResult;
                }
            })
        );

        return success({
            runAt: new Date().toISOString(),
            contract: env.FUNDING_VAULT_CONTRACT_ADDRESS,
            threshold,
            results,
        });
    } catch (err) {
        const message =
            err instanceof Error ? err.message : "Unknown cron execution error";
        console.error("[fundingvault-claim] fatal", message);
        return error(`FundingVault cron job failed: ${message}`, 500);
    }
}

export const runtime = "nodejs";
export const maxDuration = 60;
