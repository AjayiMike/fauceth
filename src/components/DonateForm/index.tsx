"use client";

import { Button } from "@/components/ui/button";
import { Heart, Info, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import NumericalInput from "../NumericalInput";
import { useState, useEffect } from "react";
import useBalance from "@/hooks/useBalance";
import { parseEther, WriteContractErrorType } from "viem";
import useDonate from "@/hooks/useDonate";
import { toast } from "sonner";
import { useConnection } from "@/providers/ConnectionProvider";
import { displayNumber } from "@/lib/utils/formatting";
import { Card, CardContent, CardHeader } from "../ui/card";
import { useNetworksStore } from "@/lib/store/networksStore";
import { Badge } from "@/components/ui/badge";
import Account from "../Account";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "../ui/dialog";
import { getNetworkPublicClient, networkInfoToViemChain } from "@/lib/networks";
import { Input } from "@/components/ui/input";

type DonationStep = "confirm" | "pending" | "success" | "socials";

const DonateForm = () => {
    const { isConnected, chainId, account, handleSwitchChain } =
        useConnection();
    const { balance, formattedBalance, isLoading } = useBalance();
    const { networks, selectedNetwork } = useNetworksStore();
    const donate = useDonate();
    const [amount, setAmount] = useState("");
    const [showDonationModal, setShowDonationModal] = useState(false);
    const [currentStep, setCurrentStep] = useState<DonationStep>("confirm");
    const [socialLinks, setSocialLinks] = useState({
        x: "",
        github: "",
        farcaster: "",
    });

    const insufficientBalance =
        balance !== undefined &&
        Boolean(amount) &&
        balance < parseEther(amount);

    const isError = !isLoading && insufficientBalance;

    // Check if current chain is supported and get current network info
    const currentNetwork = networks.find((n) => n.chainId === chainId);
    const isUnsupportedChain = isConnected && chainId && !currentNetwork;
    const targetNetwork = selectedNetwork;

    // Log current step when it changes
    useEffect(() => {
        console.log("Current step updated:", currentStep);
    }, [currentStep]);

    const handleDonateClick = () => {
        setCurrentStep("confirm");
        setShowDonationModal(true);
    };

    const handleConfirmDonate = async () => {
        try {
            if (!isConnected) {
                toast.error("Please connect your wallet to donate.");
                return;
            }

            if (isUnsupportedChain) {
                toast.error("Please switch to a supported network to donate.");
                return;
            }

            if (!amount || parseFloat(amount) <= 0) {
                toast.error("Please enter a valid amount to donate.");
                return;
            }

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

            const network = networks.find((n) => n.chainId === chainId);
            if (!network) {
                toast.error("Please switch to a supported network to donate.");
                return;
            }

            const chain = networkInfoToViemChain(network);
            const publicClient = getNetworkPublicClient(network);

            // Update state to show pending
            setCurrentStep("pending");

            const txHash = await donate(chain, amount);

            toast.info("Transaction sent. Waiting for confirmation...");

            const receipt = await publicClient.waitForTransactionReceipt({
                hash: txHash,
            });

            if (receipt.status === "reverted") {
                toast.error("Transaction reverted. Please try again.");
                return;
            }

            // Record donation on backend
            const response = await fetch("/api/donate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    networkId: network.chainId,
                    txHash,
                }),
            });

            const { data } = await response.json();

            console.log("Donation API response:", data);
            console.log("API response status:", response.status);

            if (!response.ok) {
                throw new Error(data.message || "Failed to record donation");
            }

            // Show success and check if first donation
            console.log(
                "Is first time donor from API:",
                data?.isFirstTimeDonor
            );
            console.log(
                "Is first time donor type:",
                typeof data?.isFirstTimeDonor
            );

            // Force update to the correct step based on the response
            if (data?.isFirstTimeDonor === true) {
                console.log("Setting step to socials - first time donor");
                setCurrentStep("socials");
                // Force a delay to ensure state updates before modal rendering
                setTimeout(() => {
                    console.log("After timeout, currentStep:", "socials");
                }, 100);
            } else {
                console.log("Setting step to success - returning donor");
                setCurrentStep("success");
            }

            // Reset form
            setAmount("");
        } catch (err) {
            const error = err as WriteContractErrorType;
            console.error("Donation error:", error);
            toast.error(error.message);
            setShowDonationModal(false);
        }
    };

    const handleSocialLinksSubmit = async () => {
        try {
            const response = await fetch("/api/users/social-links", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    address: account,
                    ...socialLinks,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save social links");
            }

            toast.success("Social links saved successfully!");
            setCurrentStep("success");
        } catch (error) {
            toast.error("Failed to save social links. Please try again later.");
            console.error("Error saving social links:", error);
            setCurrentStep("success");
        }
    };

    const handleModalClose = () => {
        setShowDonationModal(false);
        setCurrentStep("confirm");
        setSocialLinks({ x: "", github: "", farcaster: "" });
    };

    const renderModalContent = () => {
        switch (currentStep) {
            case "confirm":
                return (
                    <>
                        <DialogHeader>
                            <DialogTitle>Confirm Donation</DialogTitle>
                            <DialogDescription>
                                Please review your donation details
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-sm text-muted-foreground">
                                    Network
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                        {currentNetwork?.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        ({currentNetwork?.chainId})
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-sm text-muted-foreground">
                                    Amount
                                </span>
                                <span className="font-medium">
                                    {amount} ETH
                                </span>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={handleModalClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-rose-500 hover:bg-rose-600"
                                onClick={handleConfirmDonate}
                            >
                                Confirm Donation
                            </Button>
                        </DialogFooter>
                    </>
                );
            case "pending":
                return (
                    <>
                        <DialogHeader>
                            <DialogTitle>Processing Donation</DialogTitle>
                            <DialogDescription>
                                Please wait while we process your donation
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-8 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                            <p className="text-sm text-muted-foreground text-center">
                                Your donation is being processed. Please
                                don&apos;t close this window.
                            </p>
                        </div>
                    </>
                );
            case "socials":
                return (
                    <>
                        <DialogHeader>
                            <DialogTitle>Share Your Social Media</DialogTitle>
                            <DialogDescription>
                                Thank you for your first donation! Share your
                                social media handles to get recognized in our
                                leaderboard.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">
                                        X (Twitter)
                                    </label>
                                    <Input
                                        placeholder="x username"
                                        value={socialLinks.x}
                                        onChange={(e) =>
                                            setSocialLinks((prev) => ({
                                                ...prev,
                                                x: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">
                                        GitHub
                                    </label>
                                    <Input
                                        placeholder="github username"
                                        value={socialLinks.github}
                                        onChange={(e) =>
                                            setSocialLinks((prev) => ({
                                                ...prev,
                                                github: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">
                                        Farcaster
                                    </label>
                                    <Input
                                        placeholder="farcaster username"
                                        value={socialLinks.farcaster}
                                        onChange={(e) =>
                                            setSocialLinks((prev) => ({
                                                ...prev,
                                                farcaster: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentStep("success")}
                            >
                                Skip
                            </Button>
                            <Button
                                className="bg-rose-500 hover:bg-rose-600"
                                onClick={handleSocialLinksSubmit}
                            >
                                Save
                            </Button>
                        </DialogFooter>
                    </>
                );
            case "success":
                return (
                    <>
                        <DialogHeader>
                            <DialogTitle>Thank You!</DialogTitle>
                            <DialogDescription>
                                Your donation has been successfully processed
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-6 flex flex-col items-center justify-center space-y-4">
                            <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-rose-500" />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-sm font-medium">
                                    You&apos;ve donated {amount} ETH
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Thank you for supporting our community!
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                className="w-full bg-rose-500 hover:bg-rose-600"
                                onClick={handleModalClose}
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </>
                );
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
                                    {isUnsupportedChain && targetNetwork && (
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
                                    onClick={handleDonateClick}
                                >
                                    Donate
                                    <Heart className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <Dialog open={showDonationModal} onOpenChange={handleModalClose}>
                <DialogContent>{renderModalContent()}</DialogContent>
            </Dialog>
        </>
    );
};

export default DonateForm;
