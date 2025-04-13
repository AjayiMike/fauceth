"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Twitter, Github, Linkedin } from "lucide-react";
import { displayNumber } from "@/lib/utils/formatting";

interface LeaderboardStats {
    totalDonors: number;
    totalAmount: number;
    totalDonations: number;
}

interface DonorInfo {
    address: string;
    socialLinks?: {
        twitter?: string;
        github?: string;
        linkedin?: string;
    };
    totalAmount: number;
    donationCount: number;
    networkCount: number;
    lastDonation: string;
}

interface LeaderboardResponse {
    period: string;
    donors: DonorInfo[];
    stats: LeaderboardStats;
}

export const Leaderboard = () => {
    const [period, setPeriod] = useState<"all-time" | "monthly" | "weekly">(
        "all-time"
    );

    const { data, isLoading, error } = useQuery<LeaderboardResponse>({
        queryKey: ["leaderboard", period],
        queryFn: async () => {
            const response = await fetch(`/api/leaderboard?period=${period}`);
            if (!response.ok) {
                throw new Error("Failed to fetch leaderboard data");
            }
            const data = await response.json();
            return data.data;
        },
    });

    console.log("data: ", data);

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    if (error) {
        return (
            <div className="text-center py-8 text-destructive">
                Error loading leaderboard. Please try again later.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold">Top Donors</h2>
                    {data?.stats && (
                        <p className="text-sm text-muted-foreground">
                            {data.stats.totalDonors} donors have contributed{" "}
                            {displayNumber(data.stats.totalAmount)} ETH across{" "}
                            {data.stats.totalDonations} donations
                        </p>
                    )}
                </div>
                <Tabs
                    value={period}
                    onValueChange={(v) => setPeriod(v as typeof period)}
                >
                    <TabsList>
                        <TabsTrigger
                            className="cursor-pointer"
                            value="all-time"
                        >
                            All Time
                        </TabsTrigger>
                        <TabsTrigger className="cursor-pointer" value="monthly">
                            Monthly
                        </TabsTrigger>
                        <TabsTrigger className="cursor-pointer" value="weekly">
                            Weekly
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-8">Loading...</div>
                ) : !data || !data.donors || data.donors.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No donations found for this period
                    </div>
                ) : (
                    data.donors.map((donor, index) => (
                        <div
                            key={donor.address}
                            className="flex items-center justify-between p-4 bg-card rounded-lg hover:bg-accent/50 transition-colors"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0 w-8 text-center">
                                    <span className="text-xl font-bold text-muted-foreground">
                                        #{index + 1}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-medium">
                                        {formatAddress(donor.address)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {donor.donationCount} donations ·{" "}
                                        {displayNumber(donor.totalAmount)} ETH ·{" "}
                                        {donor.networkCount} networks
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                {donor.socialLinks?.twitter && (
                                    <a
                                        href={`https://twitter.com/${donor.socialLinks.twitter}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#1DA1F2] hover:opacity-80"
                                    >
                                        <Twitter className="h-5 w-5" />
                                    </a>
                                )}
                                {donor.socialLinks?.github && (
                                    <a
                                        href={`https://github.com/${donor.socialLinks.github}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:opacity-80"
                                    >
                                        <Github className="h-5 w-5" />
                                    </a>
                                )}
                                {donor.socialLinks?.linkedin && (
                                    <a
                                        href={`https://linkedin.com/in/${donor.socialLinks.linkedin}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#0A66C2] hover:opacity-80"
                                    >
                                        <Linkedin className="h-5 w-5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
