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
import Image from "next/image";

const WalletModal = () => {
    const { availableProviders, handleConnect } = useConnection();
    const [showAll, setShowAll] = useState(false);
    const INITIAL_DISPLAY_COUNT = 3;

    const connectWallet = useCallback(
        async (provider: EIP6963ProviderDetail) => {
            try {
                await handleConnect(provider);
            } catch (error) {
                console.debug(error);
            }
        },
        [handleConnect]
    );

    const displayedProviders = showAll
        ? availableProviders
        : availableProviders?.slice(0, INITIAL_DISPLAY_COUNT);

    return (
        <Dialog>
            {availableProviders ? (
                <>
                    <DialogTrigger asChild>
                        <Button variant="outline">
                            <Wallet className="w-4 h-4 mr-2" />
                            <span>Connect Wallet</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="w-96">
                        <DialogHeader>
                            <DialogTitle>Select a wallet</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col gap-2">
                            {displayedProviders?.map((provider) => (
                                <Button
                                    key={provider.info.uuid}
                                    variant="outline"
                                    className="w-full justify-start gap-3 h-12"
                                    onClick={() => connectWallet(provider)}
                                >
                                    <Image
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
                                    className="w-full"
                                    onClick={() => setShowAll(!showAll)}
                                >
                                    {showAll ? (
                                        <>
                                            Show Less{" "}
                                            <ChevronUp className="w-4 h-4" />
                                        </>
                                    ) : (
                                        <>
                                            Show More{" "}
                                            <ChevronDown className="w-4 h-4" />
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </DialogContent>
                </>
            ) : (
                <div className="text-muted-foreground">
                    No wallets available
                </div>
            )}
        </Dialog>
    );
};

export default WalletModal;
