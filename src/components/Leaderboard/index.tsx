"use client";

import React, { useState, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { displayNumber } from "@/lib/utils/formatting";
import { Crown } from "lucide-react";
import Blockies from "../Blockies";

interface LeaderboardStats {
    totalDonors: number;
    totalAmount: number;
    totalDonations: number;
}

interface DonorInfo {
    address: string;
    socialLinks?: {
        x?: string;
        github?: string;
        farcaster?: string;
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

const Leaderboard = () => {
    const [period, setPeriod] = useState<"all-time" | "month" | "week">(
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

    if (error) {
        return (
            <div className="text-center py-8 text-destructive card shadow-md p-6 bg-white rounded-xl border">
                Error loading leaderboard. Please try again later.
            </div>
        );
    }

    return (
        <div className="card shadow-md p-6 bg-background rounded-xl border w-full max-w-full overflow-hidden">
            <div className="flex flex-col gap-4 sm:flex-row lg:flex-col sm:justify-between sm:items-center lg:items-start mb-6">
                <div>
                    <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                        <span>Top Donors</span>
                    </h2>
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
                        <TabsTrigger className="cursor-pointer" value="month">
                            This Month
                        </TabsTrigger>
                        <TabsTrigger className="cursor-pointer" value="week">
                            This Week
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
                    <ol className="space-y-4">
                        {data.donors.map((donor, index) => {
                            const isTop = index === 0;
                            return (
                                <li
                                    key={donor.address}
                                    className={`flex lg:flex-col lg:items-start items-center justify-between p-4 rounded-lg transition-colors border ${
                                        isTop
                                            ? "bg-yellow-50 border-yellow-200 shadow-sm"
                                            : "bg-card hover:bg-accent/50"
                                    }`}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center">
                                            <Blockies seed={donor.address} />
                                            {isTop && (
                                                <span className="absolute -top-3 -right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white shadow">
                                                    <Crown
                                                        className="w-5 h-5 text-yellow-500"
                                                        aria-label="Top Donor"
                                                    />
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`text-lg font-bold ${
                                                        isTop
                                                            ? "text-yellow-700"
                                                            : "text-muted-foreground"
                                                    }`}
                                                >
                                                    #{index + 1}
                                                </span>
                                                <span className="font-mono text-base font-semibold truncate block max-w-[120px]">
                                                    {donor.address}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {donor.donationCount} donations
                                                ·{" "}
                                                {displayNumber(
                                                    donor.totalAmount
                                                )}{" "}
                                                ETH · {donor.networkCount}{" "}
                                                networks
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center lg:w-full lg:justify-end space-x-2">
                                        {donor.socialLinks?.x && (
                                            <a
                                                href={`https://twitter.com/${donor.socialLinks.x}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:scale-110 transition-transform"
                                                title="X (Twitter)"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width={20}
                                                    height={20}
                                                    viewBox="0 0 24 24"
                                                    aria-hidden="true"
                                                    focusable="false"
                                                >
                                                    <path
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={1.5}
                                                        d="m13.081 10.712l-4.786-6.71a.6.6 0 0 0-.489-.252H5.28a.6.6 0 0 0-.488.948l6.127 8.59m2.162-2.576l6.127 8.59a.6.6 0 0 1-.488.948h-2.526a.6.6 0 0 1-.489-.252l-4.786-6.71m2.162-2.576l5.842-6.962m-8.004 9.538L5.077 20.25"
                                                    ></path>
                                                </svg>
                                            </a>
                                        )}
                                        {donor.socialLinks?.github && (
                                            <a
                                                href={`https://github.com/${donor.socialLinks.github}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:scale-110 transition-transform"
                                                title="GitHub"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width={20}
                                                    height={20}
                                                    viewBox="0 0 24 24"
                                                    aria-hidden="true"
                                                    focusable="false"
                                                >
                                                    <path
                                                        fill="currentColor"
                                                        d="M11.963 2.382C.554 2.621-1.82 17.93 8.852 21.602c.498.093.684-.219.684-.478v-1.68c-2.79.601-3.38-1.317-3.38-1.317a2.6 2.6 0 0 0-1.121-1.442c-.902-.612.072-.602.072-.602a2.07 2.07 0 0 1 1.536 1.038a2.167 2.167 0 0 0 2.924.819c.052-.5.275-.965.633-1.317c-2.23-.25-4.564-1.1-4.564-4.875a3.76 3.76 0 0 1 1.038-2.645a3.46 3.46 0 0 1 .103-2.634s.84-.26 2.76 1.037a9.6 9.6 0 0 1 5.02 0c1.908-1.276 2.748-1.038 2.748-1.038c.365.828.398 1.763.093 2.614a3.75 3.75 0 0 1 1.037 2.645c0 3.786-2.344 4.626-4.574 4.865c1.038.55.602 4.086.664 4.522c0 .259.176.57.695.477c10.642-3.64 8.152-18.97-3.257-19.209"
                                                    ></path>
                                                </svg>
                                            </a>
                                        )}
                                        {donor.socialLinks?.farcaster && (
                                            <a
                                                href={`https://warpcast.com/${donor.socialLinks.farcaster}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:scale-110 transition-transform"
                                                title="Farcaster"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width={20}
                                                    height={20}
                                                    viewBox="0 0 24 24"
                                                    aria-hidden="true"
                                                    focusable="false"
                                                >
                                                    <path
                                                        fill="currentColor"
                                                        d="M18.24.24H5.76A5.76 5.76 0 0 0 0 6v12a5.76 5.76 0 0 0 5.76 5.76h12.48A5.76 5.76 0 0 0 24 18V6A5.76 5.76 0 0 0 18.24.24m.816 17.166v.504a.49.49 0 0 1 .543.48v.568h-5.143v-.569A.49.49 0 0 1 15 17.91v-.504c0-.22.153-.402.358-.458l-.01-4.364c-.158-1.737-1.64-3.098-3.443-3.098s-3.285 1.361-3.443 3.098l-.01 4.358c.228.042.532.208.54.464v.504a.49.49 0 0 1 .543.48v.568H4.392v-.569a.49.49 0 0 1 .543-.479v-.504c0-.253.201-.454.454-.472V9.039h-.49l-.61-2.031H6.93V5.042h9.95v1.966h2.822l-.61 2.03h-.49v7.896c.252.017.453.22.453.472"
                                                    ></path>
                                                </svg>
                                            </a>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                )}
            </div>
        </div>
    );
};

export default memo(Leaderboard);
