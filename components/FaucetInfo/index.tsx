"use client";

import { Coins, Clock, Droplet } from "lucide-react";
import { motion } from "framer-motion";

const FaucetInfo = () => {
    // Dummy data
    const balance = "1.5 ETH";
    const faucetAmount = "0.1 ETH";
    const cooldownPeriod = "24 hours";

    const items = [
        {
            title: "Balance",
            value: balance,
            icon: Coins,
            color: "text-green-500 bg-green-500/10",
        },
        {
            title: "Faucet Amount",
            value: faucetAmount,
            icon: Droplet,
            color: "text-blue-500 bg-blue-500/10",
        },
        {
            title: "Cooldown",
            value: cooldownPeriod,
            icon: Clock,
            color: "text-purple-500 bg-purple-500/10",
        },
    ];

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex flex-wrap gap-4 items-center justify-center">
                {items.map((item, index) => (
                    <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.1 }}
                        className="flex items-center gap-3 px-4 py-2 rounded-full"
                    >
                        <div className={`p-2 rounded-full ${item.color}`}>
                            <item.icon className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                                {item.title}
                            </span>
                            <span className="font-medium">{item.value}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default FaucetInfo;
