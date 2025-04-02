"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FaucetInfo from "../FaucetInfo";
import RequestForm from "../RequestForm";
import DonateForm from "../DonateForm";
import TransactionsTable from "../TransactionsTable";
import { Droplet, Heart } from "lucide-react";
import { useConnection } from "@/providers/ConnectionProvider";
import { useFaucetInfo } from "@/hooks/useFaucetInfo";
import { Address } from "viem";

const Faucet = () => {
    const { account } = useConnection();
    const { data } = useFaucetInfo(account as Address | undefined);

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <FaucetInfo
                balance={data?.balance}
                faucetAmount={data?.dropAmount}
                cooldownPeriod={data?.cooldownDuration}
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
                            balance={data?.balance}
                            faucetAmount={data?.dropAmount}
                            cooldownPeriod={data?.cooldownDuration}
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
        </div>
    );
};

export default Faucet;
