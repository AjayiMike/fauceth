"use client";

import { Button } from "@/components/ui/button";
import { Heart, AlertCircle, CheckCircle2, Loader2, Info } from "lucide-react";
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

// More specific transaction states for better UX
type TransactionStatus =
    | "initiating"
    | "signing"
    | "mining"
    | "confirming"
    | "verifying"
    | "complete";

const DonateForm = () => {
    const { isConnected, chainId, account, handleSwitchChain } =
        useConnection();
    const { balance, formattedBalance, isLoading } = useBalance();
    const { networks, selectedNetwork } = useNetworksStore();
    const donate = useDonate();
    const [amount, setAmount] = useState("");
    const [showDonationModal, setShowDonationModal] = useState(false);
    const [currentStep, setCurrentStep] = useState<DonationStep>("confirm");
    const [txStatus, setTxStatus] = useState<TransactionStatus>("initiating");
    const [socialLinks, setSocialLinks] = useState({
        x: "",
        github: "",
        farcaster: "",
    });
    const [socialErrors, setSocialErrors] = useState({
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

    // Log current step when it changes
    useEffect(() => {
        console.log("Current step updated:", currentStep);
    }, [currentStep]);

    // Validate social links
    const validateSocialLink = (
        type: "x" | "github" | "farcaster",
        value: string
    ) => {
        // Empty is valid
        if (!value) {
            return "";
        }

        // Check if starts with @
        if (value.startsWith("@")) {
            return "Username should not start with @";
        }

        // General username validation - alphanumeric with underscore and some special characters
        const usernameRegex = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;
        if (!usernameRegex.test(value)) {
            return "Username can only contain letters, numbers, underscores, dots, or hyphens";
        }

        return "";
    };

    const handleSocialInputChange = (
        type: "x" | "github" | "farcaster",
        value: string
    ) => {
        setSocialLinks((prev) => ({
            ...prev,
            [type]: value,
        }));

        // Validate on change
        const error = validateSocialLink(type, value);
        setSocialErrors((prev) => ({
            ...prev,
            [type]: error,
        }));
    };

    // Check if any social input has errors
    const hasSocialErrors = Object.values(socialErrors).some(
        (error) => error !== ""
    );

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
                    `You need ${displayNumber(amount, 3)} ${
                        currentNetwork?.nativeCurrency.symbol
                    } to donate. Your balance: ${displayNumber(
                        formattedBalance,
                        3
                    )} ${currentNetwork?.nativeCurrency.symbol}`
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
            setTxStatus("signing");

            // User is signing transaction
            const txHash = await donate(chain, amount);
            toast.info("Transaction sent. Waiting for confirmation...");

            // Transaction has been sent, waiting for confirmation
            setTxStatus("mining");

            const receipt = await publicClient.waitForTransactionReceipt({
                hash: txHash,
            });

            if (receipt.status === "reverted") {
                toast.error("Transaction reverted. Please try again.");
                return;
            }

            // Transaction confirmed, now verifying on backend
            setTxStatus("verifying");

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

            console.log({ data, response });

            console.log("API response status:", response.status);

            if (!response.ok) {
                throw new Error(data?.message || "Failed to record donation");
            }

            setTxStatus("complete");

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
            // Validate all inputs before submission
            const xError = validateSocialLink("x", socialLinks.x);
            const githubError = validateSocialLink(
                "github",
                socialLinks.github
            );
            const farcasterError = validateSocialLink(
                "farcaster",
                socialLinks.farcaster
            );

            setSocialErrors({
                x: xError,
                github: githubError,
                farcaster: farcasterError,
            });

            // If there are any errors, prevent submission
            if (xError || githubError || farcasterError) {
                return;
            }

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
        setTxStatus("initiating");
        setSocialLinks({ x: "", github: "", farcaster: "" });
        setSocialErrors({ x: "", github: "", farcaster: "" });
    };

    // Get transaction status display info
    const getStatusInfo = () => {
        switch (txStatus) {
            case "signing":
                return {
                    title: "Sign Transaction",
                    message: "Please sign the transaction in your wallet",
                };
            case "mining":
                return {
                    title: "Processing Transaction",
                    message:
                        "Your transaction is being processed on the blockchain. This may take a few moment.",
                };
            case "verifying":
                return {
                    title: "Verifying Donation",
                    message:
                        "Transaction confirmed! Now verifying your donation on our servers.",
                };
            case "complete":
                return {
                    title: "Donation Complete",
                    message: "Your donation has been successfully verified!",
                };
            default:
                return {
                    title: "Processing Donation",
                    message: "Please wait while we process your donation.",
                };
        }
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
                                    {`${amount} ${currentNetwork?.nativeCurrency.symbol}`}
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
                const statusInfo = getStatusInfo();
                return (
                    <>
                        <DialogHeader>
                            <DialogTitle>{statusInfo.title}</DialogTitle>
                            <DialogDescription>
                                {txStatus === "signing"
                                    ? "Please approve the transaction in your wallet"
                                    : "Please wait while we process your donation"}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-8 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                            <div className="text-center">
                                <p className="font-medium mb-2">
                                    {txStatus === "mining" &&
                                        "Transaction sent"}
                                    {txStatus === "verifying" &&
                                        "Transaction confirmed"}
                                    {txStatus === "complete" &&
                                        "Verification complete"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {statusInfo.message}
                                </p>
                            </div>

                            {/* Progress steps visualization */}
                            <div className="w-full max-w-sm mt-4">
                                <div className="relative flex items-center justify-between w-full">
                                    <div
                                        className={`h-2.5 w-2.5 rounded-full ${
                                            txStatus !== "initiating"
                                                ? "bg-rose-500"
                                                : "bg-gray-300"
                                        }`}
                                    ></div>
                                    <div
                                        className={`h-2.5 w-2.5 rounded-full ${
                                            txStatus !== "initiating" &&
                                            txStatus !== "signing"
                                                ? "bg-rose-500"
                                                : "bg-gray-300"
                                        }`}
                                    ></div>
                                    <div
                                        className={`h-2.5 w-2.5 rounded-full ${
                                            txStatus === "verifying" ||
                                            txStatus === "complete"
                                                ? "bg-rose-500"
                                                : "bg-gray-300"
                                        }`}
                                    ></div>
                                    <div
                                        className={`h-2.5 w-2.5 rounded-full ${
                                            txStatus === "complete"
                                                ? "bg-rose-500"
                                                : "bg-gray-300"
                                        }`}
                                    ></div>
                                    <div className="absolute left-0 top-1/2 h-0.5 bg-gradient-to-r from-rose-500 to-gray-300 w-full -z-10 transform -translate-y-1/2"></div>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                    <span>Sign</span>
                                    <span>Process</span>
                                    <span>Verify</span>
                                    <span>Done</span>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground mt-2">
                                Please don&apos;t close this window.
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
                                    <label
                                        htmlFor="xLinkInput"
                                        className="text-sm font-medium"
                                    >
                                        X (Twitter)
                                    </label>
                                    <Input
                                        id="xLinkInput"
                                        placeholder="x username"
                                        value={socialLinks.x}
                                        onChange={(e) =>
                                            handleSocialInputChange(
                                                "x",
                                                e.target.value
                                            )
                                        }
                                        className={
                                            socialErrors.x
                                                ? "border-red-500"
                                                : ""
                                        }
                                    />
                                    {socialErrors.x && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {socialErrors.x}
                                        </p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <label
                                        htmlFor="githubLinkInput"
                                        className="text-sm font-medium"
                                    >
                                        GitHub
                                    </label>
                                    <Input
                                        id="githubLinkInput"
                                        placeholder="github username"
                                        value={socialLinks.github}
                                        onChange={(e) =>
                                            handleSocialInputChange(
                                                "github",
                                                e.target.value
                                            )
                                        }
                                        className={
                                            socialErrors.github
                                                ? "border-red-500"
                                                : ""
                                        }
                                    />
                                    {socialErrors.github && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {socialErrors.github}
                                        </p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <label
                                        htmlFor="farcasterLinkInput"
                                        className="text-sm font-medium"
                                    >
                                        Farcaster
                                    </label>
                                    <Input
                                        id="farcasterLinkInput"
                                        placeholder="farcaster username"
                                        value={socialLinks.farcaster}
                                        onChange={(e) =>
                                            handleSocialInputChange(
                                                "farcaster",
                                                e.target.value
                                            )
                                        }
                                        className={
                                            socialErrors.farcaster
                                                ? "border-red-500"
                                                : ""
                                        }
                                    />
                                    {socialErrors.farcaster && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {socialErrors.farcaster}
                                        </p>
                                    )}
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
                                disabled={hasSocialErrors}
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
                                <CheckCircle2
                                    className="h-6 w-6 text-rose-500"
                                    aria-hidden="true"
                                />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-sm font-medium">
                                    You&apos;ve donated{" "}
                                    {`${amount} ${currentNetwork?.nativeCurrency.symbol}`}
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
                            <Heart
                                className="w-5 h-5 text-rose-500"
                                aria-hidden="true"
                            />
                            <h3 className="font-semibold text-sm sm:text-base md:text-lg">
                                Support the Community
                            </h3>
                        </div>
                        <Account />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="text-sm text-muted-foreground mb-2 flex items-center justify-between">
                                    <label
                                        htmlFor="donateAmountInput"
                                        className="block text-sm font-medium text-muted-foreground"
                                    >
                                        Enter donation amount
                                    </label>
                                    {currentNetwork && (
                                        <span>
                                            Balance:{" "}
                                            {isLoading ? (
                                                <span className="inline-flex items-center">
                                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                    Loading...
                                                </span>
                                            ) : (
                                                `${displayNumber(
                                                    formattedBalance,
                                                    3
                                                )} ${
                                                    currentNetwork
                                                        ?.nativeCurrency.symbol
                                                }`
                                            )}
                                        </span>
                                    )}
                                </div>
                                <NumericalInput
                                    id="donateAmountInput"
                                    placeholder="0.0"
                                    value={amount}
                                    onUserInput={setAmount}
                                    isError={isError}
                                    disabled={!isConnected || isLoading}
                                    aria-invalid={isError}
                                    aria-describedby={
                                        isError
                                            ? "donateAmountError"
                                            : undefined
                                    }
                                />
                                {isError && (
                                    <p
                                        id="donateAmountError"
                                        className="text-xs text-destructive mt-1"
                                    >
                                        Insufficient balance. You have{" "}
                                        {isLoading ? (
                                            <span className="inline-flex items-center">
                                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                Loading...
                                            </span>
                                        ) : (
                                            `${displayNumber(
                                                formattedBalance,
                                                3
                                            )} ${
                                                selectedNetwork?.nativeCurrency
                                                    .symbol
                                            }`
                                        )}
                                    </p>
                                )}
                                {!isConnected ? (
                                    <Alert
                                        variant="destructive"
                                        className="bg-yellow-500/10 text-yellow-700 border-yellow-300"
                                    >
                                        <AlertCircle
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                        <AlertDescription className="text-yellow-700/90">
                                            Please connect your wallet to
                                            donate.
                                        </AlertDescription>
                                    </Alert>
                                ) : isUnsupportedChain ? (
                                    <Alert
                                        variant="destructive"
                                        className="bg-red-500/10 text-red-600 border-red-300"
                                    >
                                        <AlertCircle
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                        <AlertDescription className="text-red-600/80">
                                            Unsupported network. Please switch
                                            to one of the supported network
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <Alert className="bg-rose-500/10 text-rose-600 border-rose-200">
                                        <Info className="h-5 w-5 mt-0.5" />
                                        <AlertTitle>
                                            {`Support the Faucet on ${currentNetwork?.name}`}
                                        </AlertTitle>
                                        <AlertDescription className="text-rose-600/80">
                                            Your donations help keep this faucet
                                            running. Any amount of{" "}
                                            {
                                                currentNetwork?.nativeCurrency
                                                    .symbol
                                            }{" "}
                                            is appreciated.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            {isUnsupportedChain ? (
                                <Button
                                    className="w-full h-12 text-base font-medium bg-rose-500 hover:bg-rose-600"
                                    size="lg"
                                    onClick={() =>
                                        handleSwitchChain(
                                            selectedNetwork?.chainId as number
                                        )
                                    }
                                >
                                    {`Switch to ${selectedNetwork?.name}`}
                                </Button>
                            ) : (
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
                                    {currentNetwork
                                        ? `Donate on ${currentNetwork?.name}`
                                        : "Donate"}
                                    <Heart className="w-5 h-5 ml-2" />
                                </Button>
                            )}
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
