import { error, success, validateQueryParams } from "@/lib/api/response";
import { UserStats } from "@/lib/api/types";
import { collections } from "@/lib/db/mongodb";
import { NextRequest } from "next/server";
import { getAddress } from "viem";
import { z } from "zod";
import { withDB } from "@/lib/db/with-db";

const querySchema = z.object({
    networkId: z
        .string()
        .transform(Number)
        .pipe(z.number().int().positive())
        .optional(),
});

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ address: string }> }
) {
    return withDB(async () => {
        try {
            const { networkId } = validateQueryParams(
                req.nextUrl.searchParams,
                querySchema.parse
            );

            // Validate address parameter
            const { address } = await params;
            if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
                return error("Invalid Ethereum address", 400);
            }

            const checkSummedAddress = getAddress(address);

            // Build query based on networkId if provided
            const query = networkId
                ? {
                      networkId,
                      address: checkSummedAddress, // Changed from userId to address
                  }
                : { address: checkSummedAddress };

            const [donationCount, requestCount, totalDonations, totalRequests] =
                await Promise.all([
                    collections.donations.countDocuments(query),
                    collections.requests.countDocuments(query),
                    collections.donations
                        .aggregate([
                            { $match: query },
                            {
                                $group: {
                                    _id: null,
                                    total: { $sum: "$amount" },
                                },
                            },
                        ])
                        .then((result) => result[0]?.total || 0),
                    collections.requests
                        .aggregate([
                            { $match: query },
                            {
                                $group: {
                                    _id: null,
                                    total: { $sum: "$amount" },
                                },
                            },
                        ])
                        .then((result) => result[0]?.total || 0),
                ]);

            return success<UserStats>({
                address,
                networkId,
                donationCount,
                requestCount,
                totalDonations,
                totalRequests,
                timestamp: new Date(),
            });
        } catch (err) {
            console.debug(err);
            if (err instanceof Error) {
                if (err.message.includes("Validation error")) {
                    return error(err.message, 400);
                }
            }
            return error("Internal server error", 500);
        }
    });
}
