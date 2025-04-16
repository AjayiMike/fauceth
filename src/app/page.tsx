"use client";

import FaucetInfo from "@/components/FaucetInfo";
import Footer from "@/components/Footer";
import RequestForm from "@/components/RequestForm";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFaucetInfo } from "@/hooks/useFaucetInfo";
import { useConnection } from "@/providers/ConnectionProvider";
import { Droplet, Heart } from "lucide-react";
import { Toaster } from "sonner";
import { Address } from "viem";
import DonateForm from "@/components/DonateForm";
import TransactionsTable from "@/components/TransactionsTable";
import { Leaderboard } from "@/components/Leaderboard";
import { useNetworksStore } from "@/lib/store/networksStore";

export default function Home() {
    const { account } = useConnection();
    const { balance, cooldownDuration, dropAmount } = useFaucetInfo(
        account as Address | undefined
    );
    const { selectedNetwork } = useNetworksStore();
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                <div className="container mx-auto px-4 py-8 space-y-8">
                    <FaucetInfo
                        balance={balance ?? undefined}
                        faucetAmount={dropAmount ?? undefined}
                        cooldownPeriod={cooldownDuration ?? undefined}
                    />
                    <div className="max-w-2xl mx-auto">
                        <Tabs defaultValue="request" className="w-full">
                            <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                                <TabsTrigger
                                    value="request"
                                    className="inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-blue-600 data-[state=active]:shadow hover:text-blue-600"
                                >
                                    <Droplet className="w-4 h-4 mr-2" />
                                    Request
                                </TabsTrigger>
                                <TabsTrigger
                                    value="donate"
                                    className="inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-rose-600 data-[state=active]:shadow hover:text-rose-600"
                                >
                                    <Heart className="w-4 h-4 mr-2" />
                                    Donate
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="request" className="mt-6">
                                <RequestForm
                                    balance={balance ?? undefined}
                                    faucetAmount={dropAmount ?? undefined}
                                    cooldownPeriod={
                                        cooldownDuration ?? undefined
                                    }
                                    networkId={selectedNetwork?.chainId}
                                />
                            </TabsContent>
                            <TabsContent value="donate" className="mt-6">
                                <DonateForm />
                            </TabsContent>
                        </Tabs>
                    </div>
                    <div className="max-w-2xl mx-auto">
                        <TransactionsTable />
                    </div>
                    <div className="max-w-2xl mx-auto mt-4">
                        <Leaderboard />
                    </div>
                </div>
            </main>
            <Toaster />
            <Footer />
        </div>
    );
}
