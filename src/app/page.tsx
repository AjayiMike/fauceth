"use client";

import FaucetInfo from "@/components/FaucetInfo";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useFaucetInfo } from "@/hooks/useFaucetInfo";
import { useConnection } from "@/providers/ConnectionProvider";
import { Toaster } from "sonner";
import { Address } from "viem";
import TransactionsTable from "@/components/TransactionsTable";
import Leaderboard from "@/components/Leaderboard";
import { useNetworksStore } from "@/lib/store/networksStore";
import { NetworkStats } from "@/components/NetworkStats";
import { Suspense } from "react";
import { RequestAndDonate } from "@/components/RequestAndDonateTabs";

export default function Home() {
    const { account } = useConnection();
    const { balance, cooldownDuration, dropAmount, isLoading } = useFaucetInfo(
        account as Address | undefined
    );
    const { selectedNetwork } = useNetworksStore();

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 w-full overflow-x-hidden">
                <div className="container mx-auto px-4 py-8 space-y-8 w-full">
                    <FaucetInfo
                        balance={balance ?? undefined}
                        faucetAmount={dropAmount ?? undefined}
                        cooldownPeriod={cooldownDuration ?? undefined}
                        currency={
                            selectedNetwork?.nativeCurrency.symbol ?? "ETH"
                        }
                    />
                    <NetworkStats />
                    <div className="grid grid-cols-12 gap-4 md:gap-8">
                        <div className="col-span-12 lg:col-span-8">
                            <Suspense>
                                <RequestAndDonate
                                    balance={balance ?? undefined}
                                    faucetAmount={dropAmount ?? undefined}
                                    cooldownPeriod={
                                        cooldownDuration ?? undefined
                                    }
                                    network={selectedNetwork}
                                    isBalanceLoading={isLoading}
                                />
                            </Suspense>
                            <div className="mt-8">
                                <TransactionsTable />
                            </div>
                        </div>
                        <aside
                            className="col-span-12 lg:col-span-4"
                            aria-label="Top Donors Leaderboard"
                        >
                            <Leaderboard />
                        </aside>
                    </div>
                </div>
            </main>
            <Toaster
                position="bottom-right"
                closeButton
                richColors
                theme="light"
                className="toast-container"
                toastOptions={{
                    duration: 5000,
                    className: "toast",
                }}
            />
            <Footer />
        </div>
    );
}
