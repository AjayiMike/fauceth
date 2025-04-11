import { success, error } from "@/lib/api/response";
import { HealthCheckResponse, HealthCheckStatus } from "@/lib/api/types";
import { fetchNetworkDetails, filterWorkingRPCs } from "@/lib/networks";
import { withDB } from "@/lib/db/with-db";

export async function GET() {
    return withDB(async () => {
        try {
            let status: HealthCheckStatus = HealthCheckStatus.Healthy;

            // Try to get network details from chainlist
            const networkDetails = await fetchNetworkDetails(11155111); // Sepolia chainId
            if (!networkDetails.rpc.length) {
                status = HealthCheckStatus.Degraded;
            }

            const workingRPCs = await filterWorkingRPCs(networkDetails.rpc);
            if (workingRPCs.length === 0) {
                status = HealthCheckStatus.Degraded;
            }

            return success<HealthCheckResponse>({
                status,
                timestamp: new Date(),
            });
        } catch (err) {
            console.debug("Health check error:", err);
            return error("Service unhealthy", 503);
        }
    });
}
