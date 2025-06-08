"use client";

import { Coins, Clock, Droplet } from "lucide-react";
import { motion } from "framer-motion";
import { FC, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { displayNumber, formatDuration } from "@/lib/utils/formatting";

const FaucetInfoSkeleton = () => {
    return (
        <div className="w-full">
            <div className="flex gap-4 items-center overflow-x-auto no-scrollbar">
                {[1, 2, 3].map((index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.1 }}
                        className="flex items-center gap-3 px-4 py-2 rounded-lg bg-accent/80"
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
    currency: string;
}> = ({ balance, faucetAmount, cooldownPeriod, currency }) => {
    const items = useMemo(
        () => [
            {
                title: "Balance",
                value: `${
                    balance ? displayNumber(balance, 1) : "0"
                } ${currency}`,
                icon: Coins,
                color: "text-green-500 bg-green-500/10",
            },
            {
                title: "Drop",
                value: `${
                    faucetAmount ? displayNumber(faucetAmount, 3) : "0"
                } ${currency}`,
                icon: Droplet,
                color: "text-blue-500 bg-blue-500/10",
            },
            {
                title: "Interval",
                value: formatDuration(cooldownPeriod),
                icon: Clock,
                color: "text-purple-500 bg-purple-500/10",
            },
        ],
        [balance, currency, faucetAmount, cooldownPeriod]
    );

    if (
        balance === undefined ||
        faucetAmount === undefined ||
        cooldownPeriod === undefined
    ) {
        return <FaucetInfoSkeleton />;
    }

    return (
        <div className="w-full">
            <dl className="flex gap-4 items-center overflow-x-auto no-scrollbar">
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
                            <dt className="text-xs text-muted-foreground whitespace-nowrap">
                                {item.title}
                            </dt>
                            <dd className="font-medium whitespace-nowrap">
                                {item.value}
                            </dd>
                        </div>
                    </motion.div>
                ))}
            </dl>
        </div>
    );
};

export default FaucetInfo;
