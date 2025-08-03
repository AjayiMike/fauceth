"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useConnection } from "@/providers/ConnectionProvider";
import { useCallback, useState } from "react";
import { ChevronDown, ChevronUp, Wallet } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { AnalyticsEvents } from "@/hooks/useAnalytics";

const WalletModal = () => {
    const { availableProviders, handleConnect } = useConnection();
    const [showAll, setShowAll] = useState(false);
    const INITIAL_DISPLAY_COUNT = 3;
    const { trackEvent } = useAnalytics();

    const connectWallet = useCallback(
        async (provider: EIP6963ProviderDetail) => {
            try {
                await handleConnect(provider);
                trackEvent(
                    AnalyticsEvents.WALLET_CONNECT,
                    { provider: provider.info.name },
                    true
                );
            } catch (error) {
                console.debug(error);
            }
        },
        [handleConnect, trackEvent]
    );

    const displayedProviders = showAll
        ? availableProviders
        : availableProviders?.slice(0, INITIAL_DISPLAY_COUNT);

    return (
        <Dialog>
            {availableProviders ? (
                <>
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            className="bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600"
                        >
                            <Wallet className="w-4 h-4 mr-2 hidden sm:block" />
                            <span>Connect Wallet</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[360px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Wallet className="w-5 h-5" />
                                Connect your wallet
                            </DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col gap-3 pt-2">
                            {displayedProviders?.map((provider) => (
                                <Button
                                    key={provider.info.uuid}
                                    variant="outline"
                                    className="w-full justify-start gap-3 h-12 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                                    onClick={() => connectWallet(provider)}
                                >
                                    <img
                                        src={provider.info.icon}
                                        alt={provider.info.name}
                                        width={24}
                                        height={24}
                                        className="w-6 h-6 rounded"
                                    />
                                    <span className="font-medium">
                                        {provider.info.name}
                                    </span>
                                </Button>
                            ))}
                            {availableProviders.length >
                                INITIAL_DISPLAY_COUNT && (
                                <Button
                                    variant="ghost"
                                    className="w-full hover:bg-rose-50 hover:text-rose-600"
                                    onClick={() => setShowAll(!showAll)}
                                >
                                    {showAll ? (
                                        <>
                                            Show Less{" "}
                                            <ChevronUp className="w-4 h-4 ml-2" />
                                        </>
                                    ) : (
                                        <>
                                            Show More{" "}
                                            <ChevronDown className="w-4 h-4 ml-2" />
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </DialogContent>
                </>
            ) : (
                <div className="text-muted-foreground p-4 text-center bg-muted rounded-lg">
                    No wallets available
                </div>
            )}
        </Dialog>
    );
};

export default WalletModal;
