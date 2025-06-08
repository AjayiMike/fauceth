"use client";

import { useMemo } from "react";
import { useNetworksStore } from "@/lib/store/networksStore";
import { Globe, Info, Server, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";

const StatCard = ({
    icon: Icon,
    label,
    value,
    isLoading,
    tooltip,
}: {
    icon: React.ElementType;
    label: string;
    value: number;
    isLoading: boolean;
    tooltip: string;
}) => (
    <div className="flex items-center space-x-4 rounded-lg bg-card p-4 shadow-sm relative">
        <Tooltip>
            <TooltipTrigger className="absolute top-0 right-0">
                <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltip}</p>
            </TooltipContent>
        </Tooltip>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex flex-col items-start">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            {isLoading ? (
                <Skeleton className="mt-1 h-6 w-12" />
            ) : (
                <p className="text-2xl font-bold">{value}</p>
            )}
        </div>
    </div>
);

export const NetworkStats = () => {
    const { networks, isLoading } = useNetworksStore();

    const stats = useMemo(() => {
        const totalNetworks = networks.length;
        const onlineNetworks = networks.filter(
            (n) => n.health === "online"
        ).length;
        const fundedFaucets = networks.filter(
            (n) =>
                n.health === "online" &&
                (n.faucetState === "ok" || n.faucetState === "low")
        ).length;

        return { totalNetworks, onlineNetworks, fundedFaucets };
    }, [networks]);

    return (
        <div className="hidden md:grid md:grid-cols-3 gap-6 mb-8">
            <StatCard
                icon={Globe}
                label="Total Networks"
                tooltip="Total number of networks in the network list"
                value={stats.totalNetworks}
                isLoading={isLoading && stats.totalNetworks === 0}
            />
            <StatCard
                icon={Server}
                label="Active Networks"
                tooltip="Number of networks that are online"
                value={stats.onlineNetworks}
                isLoading={isLoading && stats.totalNetworks === 0}
            />
            <StatCard
                icon={Wallet}
                label="Funded Networks"
                tooltip="Number of networks that have a funded faucet"
                value={stats.fundedFaucets}
                isLoading={isLoading && stats.totalNetworks === 0}
            />
        </div>
    );
};
