import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { Donation } from "@/lib/db/models/donation";
import { User } from "@/lib/db/models/user";
import mongoose from "mongoose";

interface BaseUser {
    _id: mongoose.Types.ObjectId;
    address: string;
    socialLinks?: {
        twitter?: string;
        github?: string;
        linkedin?: string;
    };
}

interface NetworkCount {
    _id: mongoose.Types.ObjectId;
    count: number;
}

interface AggregationResult {
    _id: mongoose.Types.ObjectId;
    totalAmount: number;
}

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const period = searchParams.get("period") || "all-time";
        const limit = Math.min(Number(searchParams.get("limit")) || 10, 50);

        let dateFilter = {};

        switch (period) {
            case "weekly":
                // Set to start of the current day
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
            // "all-time" doesn't need a date filter
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
        ]).option({ maxTimeMS: 20000 }); // Set 20s timeout

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

        // Get user details
        const users = (await User.find({
            _id: { $in: topDonorsBasic.map((d) => d._id) },
        })
            .select("address socialLinks")
            .lean()) as unknown as BaseUser[];

        // Get network counts separately
        const networkCounts: NetworkCount[] =
            await Donation.aggregate<NetworkCount>([
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
            ]).option({ maxTimeMS: 20000 });

        // Get overall stats separately with a shorter timeout
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
            .option({ maxTimeMS: 10000 }) // Set 10s timeout
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
                donationCount: networkData?.count || 0,
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
}
