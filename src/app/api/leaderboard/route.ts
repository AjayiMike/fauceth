import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { Donation } from "@/lib/db/models/donation";
import { User } from "@/lib/db/models/user";
import mongoose from "mongoose";
import { withDB } from "@/lib/db/with-db";

interface NetworkCount {
    _id: mongoose.Types.ObjectId;
    count: number;
}

interface AggregationResult {
    _id: mongoose.Types.ObjectId;
    totalAmount: number;
}

interface LeanUser {
    _id: mongoose.Types.ObjectId;
    address: string;
    socialLinks?: {
        x?: string;
        github?: string;
        farcaster?: string;
    };
}

export async function GET(req: NextRequest) {
    return withDB(async () => {
        try {
            const searchParams = req.nextUrl.searchParams;
            const period = searchParams.get("period") || "all-time";
            const limit = Math.min(Number(searchParams.get("limit")) || 10, 50);

            let dateFilter = {};

            switch (period) {
                case "weekly":
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    weekAgo.setHours(0, 0, 0, 0);
                    dateFilter = { createdAt: { $gte: weekAgo } };
                    break;
                case "monthly":
                    const monthAgo = new Date();
                    monthAgo.setDate(monthAgo.getDate() - 30);
                    monthAgo.setHours(0, 0, 0, 0);
                    dateFilter = { createdAt: { $gte: monthAgo } };
                    break;
            }

            // Get top donors with basic info first
            const topDonorsBasic = await Donation.aggregate<AggregationResult>([
                { $match: dateFilter },
                {
                    $group: {
                        _id: "$userId",
                        totalAmount: { $sum: "$amount" },
                    },
                },
                { $sort: { totalAmount: -1 } },
                { $limit: limit },
            ]).option({ maxTimeMS: 30000 }); // Increased timeout to 30s

            if (!topDonorsBasic.length) {
                return success({
                    period,
                    donors: [],
                    stats: {
                        totalDonors: 0,
                        totalAmount: 0,
                        totalDonations: 0,
                    },
                });
            }

            // Get user details and network counts in parallel
            const [users, networkCounts] = await Promise.all([
                (await User.find({
                    _id: { $in: topDonorsBasic.map((d) => d._id) },
                })
                    .select("address socialLinks")
                    .lean()) as unknown as LeanUser[],
                Donation.aggregate<NetworkCount>([
                    {
                        $match: {
                            ...dateFilter,
                            userId: { $in: topDonorsBasic.map((d) => d._id) },
                        },
                    },
                    {
                        $group: {
                            _id: "$userId",
                            count: { $sum: 1 },
                        },
                    },
                ]).option({ maxTimeMS: 20000 }),
            ]);

            // Get overall stats with a shorter timeout
            const stats = await Donation.aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: null,
                        totalDonors: { $addToSet: "$userId" },
                        totalAmount: { $sum: "$amount" },
                        totalDonations: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        totalDonors: { $size: "$totalDonors" },
                        totalAmount: 1,
                        totalDonations: 1,
                    },
                },
            ])
                .option({ maxTimeMS: 15000 })
                .then(
                    (results) =>
                        results[0] || {
                            totalDonors: 0,
                            totalAmount: 0,
                            totalDonations: 0,
                        }
                );

            // Combine the results
            const donors = topDonorsBasic.map((donor) => {
                const user = users.find(
                    (u) => u._id.toString() === donor._id.toString()
                );
                const networkData = networkCounts.find((nc) =>
                    nc._id.equals(donor._id)
                );

                return {
                    address: user?.address || "",
                    socialLinks: user?.socialLinks,
                    totalAmount: donor.totalAmount,
                    networkCount: networkData?.count || 0,
                };
            });

            return success({
                period,
                donors,
                stats,
            });
        } catch (err) {
            console.error("Leaderboard error:", err);
            return error(
                err instanceof Error ? err.message : "Internal server error",
                500
            );
        }
    });
}
