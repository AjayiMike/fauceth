"use client";

import { Button } from "@/components/ui/button";
import { Heart, Info, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import NumericalInput from "../NumericalInput";
import { useState } from "react";
import useETHBalance from "@/hooks/useETHBalance";
import { parseEther, WriteContractErrorType } from "viem";
import useDonate from "@/hooks/useDonate";
import { toast } from "sonner";
import { useConnection } from "@/providers/ConnectionProvider";
import { displayNumber } from "@/lib/utils/formatting";
import { sepolia } from "viem/chains";
import { SocialLinksModal } from "../SocialLinksModal";
import Account from "../Account";
import { Card, CardContent, CardHeader } from "../ui/card";
import { useNetworksStore } from "@/lib/store/networksStore";
import { Badge } from "@/components/ui/badge";

const DonateForm = () => {
    const { isConnected, chainId, account, handleSwitchChain } =
        useConnection();
    const { balance, formattedBalance, isLoading } = useETHBalance();
    const { networks, selectedNetwork } = useNetworksStore();
    const donate = useDonate();
    const [amount, setAmount] = useState("");
    const [showSocialModal, setShowSocialModal] = useState(false);

    const insufficientBalance =
        balance !== undefined &&
        Boolean(amount) &&
        balance < parseEther(amount);

    const isError = !isLoading && insufficientBalance;

    // Check if current chain is supported and get current network info
    const currentNetwork = networks.find((n) => n.chainId === chainId);
    const isUnsupportedChain = isConnected && chainId && !currentNetwork;
    const targetNetwork = selectedNetwork || networks[0]; // Default to first network if none selected

    const handleDonate = async () => {
        try {
            if (!isConnected) {
                toast.error("Please connect your wallet to donate.");
                return;
            }

            // Check if we're on the correct network
            if (isUnsupportedChain) {
                toast.error("Please switch to a supported network to donate.");
                return;
            }

            // Check if amount is valid
            if (!amount || parseFloat(amount) <= 0) {
                toast.error("Please enter a valid amount to donate.");
                return;
            }

            // Check if user has sufficient balance
            if (insufficientBalance) {
                toast.error(
                    `You need ${displayNumber(
                        amount,
                        3
                    )} ETH to donate. Your balance: ${displayNumber(
                        formattedBalance,
                        3
                    )} ETH`
                );
                return;
            }

            const txHash = await donate(sepolia, amount);

            toast.info("Transaction sent. Waiting for confirmation...");

            // const txReceipt = await getPublicClient().waitForTransactionReceipt(
            //     {
            //         hash: txHash,
            //     }
            // );

            // if (txReceipt.status !== "success") {
            //     throw new Error("Transaction failed");
            // }

            // Record donation on backend
            const response = await fetch("/api/donate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    networkId: sepolia.id,
                    txHash,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to record donation");
            }

            // Show success message
            toast.success(`Successfully donated ${amount} ETH! Thank you!`);

            // If this was their first donation, show the social links modal
            if (data.isFirstDonation) {
                setShowSocialModal(true);
            }

            // Reset form
            setAmount("");
        } catch (err) {
            const error = err as WriteContractErrorType;
            toast.error(error.message);
        }
    };

    const handleSocialLinksSubmit = async (links: {
        twitter?: string;
        github?: string;
        linkedin?: string;
    }) => {
        try {
            const response = await fetch("/api/users/social-links", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    address: account,
                    ...links,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save social links");
            }

            toast.success("Social links saved successfully!");
        } catch (error) {
            toast.error("Failed to save social links. Please try again later.");
            console.error("Error saving social links:", error);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
            >
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center space-x-2">
                            <Heart className="w-5 h-5 text-rose-500" />
                            <h3 className="font-semibold text-lg">
                                Support the Community
                            </h3>
                        </div>
                        <Account />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {isConnected && !isUnsupportedChain && (
                                <Alert className="bg-rose-500/10 text-rose-600 border-rose-200">
                                    <Info className="h-5 w-5 mt-0.5" />
                                    <AlertTitle>Support the Faucet</AlertTitle>
                                    <AlertDescription className="text-rose-600/80">
                                        Your donations help keep this faucet
                                        running. Any amount of ETH is
                                        appreciated.
                                    </AlertDescription>
                                </Alert>
                            )}
                            {isConnected && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">
                                            Network:
                                        </span>
                                        {isUnsupportedChain ? (
                                            <Badge
                                                variant="destructive"
                                                className="font-normal"
                                            >
                                                <AlertCircle className="w-3 h-3 mr-1" />
                                                Unsupported Network
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="outline"
                                                className="bg-rose-50 text-rose-600 border-rose-200 font-normal"
                                            >
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                {currentNetwork?.name}
                                            </Badge>
                                        )}
                                    </div>
                                    {isUnsupportedChain && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                            onClick={() =>
                                                handleSwitchChain(
                                                    targetNetwork.chainId
                                                )
                                            }
                                        >
                                            Switch to {targetNetwork.name}
                                        </Button>
                                    )}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="relative">
                                        <div className="text-sm text-muted-foreground mb-2 flex items-center justify-between">
                                            <span>Enter donation amount</span>
                                            <span>
                                                Balance:{" "}
                                                {displayNumber(
                                                    formattedBalance,
                                                    3
                                                )}{" "}
                                                ETH
                                            </span>
                                        </div>
                                        <NumericalInput
                                            value={amount}
                                            onUserInput={(value) => {
                                                setAmount(value);
                                            }}
                                            placeholder="Enter amount to donate"
                                            isError={isError}
                                            disabled={Boolean(
                                                !isConnected ||
                                                    isUnsupportedChain
                                            )}
                                        />
                                    </div>
                                </div>

                                <Button
                                    className="w-full h-12 text-base font-medium bg-rose-500 hover:bg-rose-600"
                                    size="lg"
                                    disabled={Boolean(
                                        isError ||
                                            isLoading ||
                                            !Boolean(amount) ||
                                            !isConnected ||
                                            isUnsupportedChain
                                    )}
                                    onClick={handleDonate}
                                >
                                    Donate
                                    <Heart className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <SocialLinksModal
                isOpen={showSocialModal}
                onClose={() => setShowSocialModal(false)}
                onSubmit={handleSocialLinksSubmit}
            />
        </>
    );
};

export default DonateForm;
