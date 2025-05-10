"use client";

import { Coins, Clock, Droplet } from "lucide-react";
import { motion } from "framer-motion";
import { FC, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { displayNumber, formatDuration } from "@/lib/utils/formatting";

const FaucetInfoSkeleton = () => {
    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex flex-wrap gap-4 items-center">
                {[1, 2, 3].map((index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.1 }}
                        className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-200"
                    >
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex flex-col gap-1">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

const FaucetInfo: FC<{
    balance: number | undefined;
    faucetAmount: number | undefined;
    cooldownPeriod: number | undefined;
}> = ({ balance, faucetAmount, cooldownPeriod }) => {
    const items = useMemo(
        () => [
            {
                title: "Balance",
                value: `${balance ? displayNumber(balance, 3) : "0"} ETH`,
                icon: Coins,
                color: "text-green-500 bg-green-500/10",
            },
            {
                title: "Faucet Amount",
                value: `${
                    faucetAmount ? displayNumber(faucetAmount, 3) : "0"
                } ETH`,
                icon: Droplet,
                color: "text-blue-500 bg-blue-500/10",
            },
            {
                title: "Cooldown",
                value: formatDuration(cooldownPeriod),
                icon: Clock,
                color: "text-purple-500 bg-purple-500/10",
            },
        ],
        [balance, faucetAmount, cooldownPeriod]
    );

    if (
        balance === undefined ||
        faucetAmount === undefined ||
        cooldownPeriod === undefined
    ) {
        return <FaucetInfoSkeleton />;
    }

    return (
        <div className="max-w-6xl mx-auto">
            <dl className="flex flex-wrap gap-4 items-center">
                {items.map((item, index) => (
                    <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.1 }}
                        className="flex items-center gap-3 py-2 rounded-full"
                    >
                        <div className={`p-2 rounded-full ${item.color}`}>
                            <item.icon className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="flex flex-col">
                            <dt className="text-xs text-muted-foreground">
                                {item.title}
                            </dt>
                            <dd className="font-medium">{item.value}</dd>
                        </div>
                    </motion.div>
                ))}
            </dl>
        </div>
    );
};

export default FaucetInfo;
