"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RequestForm from "@/components/RequestForm";
import DonateForm from "@/components/DonateForm";
import { Droplet, Heart } from "lucide-react";
import { INetwork } from "@/types/network";

interface RequestAndDonateProps {
    balance?: number;
    faucetAmount?: number;
    cooldownPeriod?: number;
    network: INetwork | null;
    isBalanceLoading?: boolean;
}

export function RequestAndDonate({
    balance,
    faucetAmount,
    cooldownPeriod,
    network,
    isBalanceLoading,
}: RequestAndDonateProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState(
        searchParams.get("tab") || "request"
    );

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab && (tab === "request" || tab === "donate")) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", value);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                <TabsTrigger
                    value="request"
                    className="inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow hover:text-primary"
                >
                    <Droplet className="w-4 h-4 mr-2" aria-hidden="true" />
                    Request
                </TabsTrigger>
                <TabsTrigger
                    value="donate"
                    className="inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-destructive data-[state=active]:shadow hover:text-destructive"
                >
                    <Heart className="w-4 h-4 mr-2" aria-hidden="true" />
                    Donate
                </TabsTrigger>
            </TabsList>
            <TabsContent value="request" className="mt-6">
                <RequestForm
                    balance={balance}
                    faucetAmount={faucetAmount}
                    cooldownPeriod={cooldownPeriod}
                    network={network}
                    isBalanceLoading={isBalanceLoading}
                />
            </TabsContent>
            <TabsContent value="donate" className="mt-6">
                <DonateForm />
            </TabsContent>
        </Tabs>
    );
}
