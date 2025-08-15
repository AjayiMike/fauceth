import { success, error } from "@/lib/api/response";
import { HealthCheckResponse, HealthCheckStatus } from "@/lib/api/types";
import { getETHBalance, getNetworkInfo } from "@/lib/networks";
import { withDB } from "@/lib/db/with-db";
import { env } from "@/config/env";

export async function GET() {
    return withDB(async () => {
        try {
            let status: HealthCheckStatus = HealthCheckStatus.Healthy;

            // Try to get network details from chainlist
            const networkDetails = await getNetworkInfo(11155111); // Sepolia chainId
            if (!networkDetails.rpc.length) {
                status = HealthCheckStatus.Degraded;
            }

            const { urls: workingRPCs } = await getETHBalance(
                env.FAUCET_ADDRESS as `0x${string}`,
                networkDetails.rpc,
                undefined,
                true
            );
            if (workingRPCs.length === 0) {
                status = HealthCheckStatus.Degraded;
            }

            return success<HealthCheckResponse>({
                status,
                timestamp: new Date(),
            });
        } catch (err) {
            console.debug("Health check error:", err);
            return error(
                "The faucet service is currently experiencing technical difficulties. Our team has been notified and is working to resolve the issue.",
                503
            );
        }
    });
}
