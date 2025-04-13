import { success, error, validateQueryParams } from "@/lib/api/response";
import { ApplicationStats } from "@/lib/api/types";
import { collections } from "@/lib/db/mongodb";
import { NextRequest } from "next/server";
import { z } from "zod";
import { withDB } from "@/lib/db/with-db";

const querySchema = z.object({
    networkId: z
        .string()
        .transform(Number)
        .pipe(z.number().int().positive())
        .optional(),
});

export async function GET(req: NextRequest) {
    return withDB(async () => {
        try {
            // Validate query parameters
            const { networkId } = validateQueryParams(
                req.nextUrl.searchParams,
                querySchema.parse
            );

            // Build query based on networkId
            const query = networkId ? { networkId } : {};

            // Fetch all stats in parallel
            const [
                donationCount,
                requestCount,
                totalDonations,
                totalRequests,
                uniqueDonors,
                uniqueRequesters,
            ] = await Promise.all([
                // Count of donations
                collections.donations.countDocuments(query),
                // Count of requests
                collections.requests.countDocuments(query),
                // Sum of all donations
                collections.donations
                    .aggregate([
                        { $match: query },
                        { $group: { _id: null, total: { $sum: "$amount" } } },
                    ])
                    .then((result) => result[0]?.total || 0),
                // Sum of all requests
                collections.requests
                    .aggregate([
                        { $match: query },
                        { $group: { _id: null, total: { $sum: "$amount" } } },
                    ])
                    .then((result) => result[0]?.total || 0),
                // Count of unique donors
                collections.donations
                    .distinct("userId", query)
                    .then((ids) => ids.length),
                // Count of unique requesters
                collections.requests
                    .distinct("userId", query)
                    .then((ids) => ids.length),
            ]);

            return success<ApplicationStats>({
                networkId,
                donationCount,
                requestCount,
                totalDonations,
                totalRequests,
                uniqueDonors,
                uniqueRequesters,
                timestamp: new Date(),
            });
        } catch (err) {
            console.debug("Stats error:", err);
            return error("Failed to fetch network stats", 500);
        }
    });
}
