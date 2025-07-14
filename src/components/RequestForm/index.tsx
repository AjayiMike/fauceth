"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    ArrowRight,
    Info,
    AlertTriangle,
    AlertCircle,
    Loader2,
    Droplet,
    ExternalLink,
    Copy,
    Check,
} from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "../ui/alert";
import { isAddress } from "viem";
import { displayNumber, formatDuration } from "@/lib/utils/formatting";
import { useState, useRef, useMemo } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "../ui/card";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { env } from "@/config/env";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../ui/dialog";
import { INetwork } from "@/types/network";
import useCopyClipboard from "@/hooks/useCopyClipboard";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getPreferredExplorer } from "@/lib/networks";

const RequestForm = ({
    balance,
    faucetAmount,
    cooldownPeriod,
    network,
    isBalanceLoading,
}: {
    balance?: number;
    faucetAmount?: number;
    cooldownPeriod?: number;
    network: INetwork | null;
    isBalanceLoading?: boolean;
}) => {
    const [address, setAddress] = useState("");
    const [addressError, setAddressError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hCaptchaToken, setHCaptchaToken] = useState<string | null>(null);
    const [successData, setSuccessData] = useState<{
        amount: number;
        txHash: string;
    } | null>(null);

    const isXsScreen = useMediaQuery("(max-width: 350px)");
    const currency = network?.nativeCurrency.symbol;
    const explorer = useMemo(() => {
        return getPreferredExplorer(network);
    }, [network]);
    const formattedBalance = balance ? displayNumber(balance, 3) : "0";
    const isZeroBalance = formattedBalance === "0";
    const isWarningBalance =
        !isZeroBalance &&
        Number(formattedBalance) > 0 &&
        Number(formattedBalance) <= Number(env.WARNING_BALANCE);
    const isLowBalance =
        !isZeroBalance && Number(formattedBalance) < Number(env.MIN_BALANCE);

    const [isCopied, copyToClipboard] = useCopyClipboard(2000);

    const hCaptchaRef = useRef<HCaptcha>(null);

    const renderAlert = () => {
        if (
            isBalanceLoading ||
            isBalanceLoading === undefined ||
            balance === undefined
        ) {
            return (
                <Alert className="bg-blue-500/10 text-blue-600 border-blue-200">
                    <Loader2
                        className="h-5 w-5 mt-0.5 animate-spin"
                        aria-hidden="true"
                    />
                    <AlertDescription className="text-blue-600/80">
                        Loading faucet information...
                    </AlertDescription>
                </Alert>
            );
        }

        if (isZeroBalance) {
            return (
                <Alert className="bg-blue-500/10 text-blue-600 border-blue-200">
                    <AlertCircle
                        className="h-5 w-5 mt-0.5"
                        aria-hidden="true"
                    />
                    <AlertDescription className="text-blue-600/80">
                        The {network?.name || "current network"} faucet is
                        currently empty. Please check back later or consider
                        donating to help keep the faucet running.
                    </AlertDescription>
                </Alert>
            );
        }

        if (isLowBalance) {
            return (
                <Alert className="bg-blue-500/10 text-blue-600 border-blue-200">
                    <AlertTriangle
                        className="h-5 w-5 mt-0.5"
                        aria-hidden="true"
                    />
                    <AlertDescription className="text-blue-600/80">
                        The faucet is very low on this network, therefore cannot
                        dispense at the moment. consider donating to help keep
                        it running.
                    </AlertDescription>
                </Alert>
            );
        }

        if (isWarningBalance) {
            return (
                <Alert className="bg-blue-500/10 text-blue-600 border-blue-200">
                    <AlertTriangle
                        className="h-5 w-5 mt-0.5"
                        aria-hidden="true"
                    />
                    <AlertDescription className="text-blue-600/80">
                        The faucet balance on this network is running low (
                        {isBalanceLoading ? (
                            <span className="inline-flex items-center">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Loading...
                            </span>
                        ) : (
                            formattedBalance
                        )}{" "}
                        {currency}). You can still request{" "}
                        {displayNumber(faucetAmount || 0, 5)}{" "}
                        {currency ?? "ETH"} every{" "}
                        {formatDuration(cooldownPeriod || 0)}, but please
                        consider donating to help maintain the faucet.
                    </AlertDescription>
                </Alert>
            );
        }

        return (
            <Alert className="bg-blue-500/10 text-blue-600 border-blue-200">
                <Info className="h-5 w-5 mt-0.5" aria-hidden="true" />
                <AlertDescription className="text-blue-600/80">
                    You can request {displayNumber(faucetAmount || 0, 3)}{" "}
                    {currency ?? "ETH"} every{" "}
                    {formatDuration(cooldownPeriod || 0)}. Make sure to provide
                    a valid {currency ?? "ETH"} address.
                </AlertDescription>
            </Alert>
        );
    };

    const handleAddressChange = (value: string) => {
        setAddress(value);
        setAddressError(null);

        if (!value) {
            setAddressError("Address is required");
        }

        if (!isAddress(value)) {
            setAddressError("Invalid Ethereum address");
        }
    };

    const isValid = !addressError && isAddress(address);

    const handleRequest = async () => {
        if (!network) {
            toast.error("Network not selected");
            return;
        }

        if (isLoading) return;

        setIsLoading(true);
        try {
            const response = await fetch("/api/request", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "captcha-token": hCaptchaToken || "",
                },
                body: JSON.stringify({
                    address,
                    networkId: network.chainId,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Transaction failed");
            }

            // Show success modal instead of toast
            setSuccessData({
                amount: data.data.amount,
                txHash: data.data.txHash,
            });

            // Reset form after successful request
            setAddress("");
            setAddressError(null);
        } catch (err) {
            console.error("Request error:", err);
            if (err instanceof Error) {
                toast.error(err.message);
            } else {
                toast.error("An unknown error occurred");
            }
        } finally {
            hCaptchaRef.current?.resetCaptcha();
            setIsLoading(false);
        }
    };

    const onHCaptchaExpire = () => {
        toast.error("hCaptcha token expired");
    };

    const onHCaptchaError = (err: string) => {
        toast.error(`hCaptcha Error: ${err}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
        >
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-2">
                        <Droplet className="w-5 h-5 text-blue-500" />
                        <h3 className="font-semibold text-lg">
                            Request Testnet {currency ?? "ETH"}
                        </h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {renderAlert()}

                        <Alert className="bg-blue-500/10 text-blue-600 border-blue-200">
                            <Info
                                className="h-5 w-5 mt-0.5"
                                aria-hidden="true"
                            />
                            <AlertDescription className="text-blue-600/80">
                                To request funds, you need a Gitcoin Passport
                                score of at least 2 or to have made a donation
                                of at least 2 ETH on any network.
                            </AlertDescription>
                            <div className="mt-4 flex gap-2">
                                <Button variant="outline" size="sm" asChild>
                                    <a
                                        href="https://passport.gitcoin.co/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Learn more about Passport
                                    </a>
                                </Button>
                                <Button variant="outline" size="sm" asChild>
                                    <a href="?tab=donate">Donate now</a>
                                </Button>
                            </div>
                        </Alert>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="relative">
                                    <label
                                        htmlFor="ethAddressInput"
                                        className="text-sm text-muted-foreground mb-2 block"
                                    >
                                        Enter your Ethereum address
                                    </label>
                                    <Input
                                        id="ethAddressInput"
                                        placeholder="0x..."
                                        value={address}
                                        onChange={(e) =>
                                            handleAddressChange(e.target.value)
                                        }
                                        className={
                                            addressError
                                                ? "border-destructive"
                                                : ""
                                        }
                                        disabled={
                                            isLoading ||
                                            isLowBalance ||
                                            isZeroBalance
                                        }
                                        aria-invalid={!!addressError}
                                        aria-describedby={
                                            addressError
                                                ? "addressErrorText"
                                                : undefined
                                        }
                                    />
                                    {addressError && (
                                        <p
                                            id="addressErrorText"
                                            className="text-xs text-destructive mt-1 px-1"
                                        >
                                            {addressError}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {!isLowBalance && !isZeroBalance && !isLoading && (
                                <HCaptcha
                                    sitekey={env.HCAPTCHA_SITE_KEY!}
                                    onExpire={onHCaptchaExpire}
                                    onError={onHCaptchaError}
                                    onVerify={setHCaptchaToken}
                                    ref={hCaptchaRef}
                                    size={isXsScreen ? "compact" : "normal"}
                                />
                            )}

                            <Button
                                className="w-full h-12 text-base font-medium bg-blue-500 hover:bg-blue-600"
                                size="lg"
                                disabled={
                                    isLowBalance ||
                                    isZeroBalance ||
                                    !isValid ||
                                    isLoading ||
                                    !hCaptchaToken ||
                                    !address ||
                                    Boolean(addressError)
                                }
                                onClick={handleRequest}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2
                                            className="w-5 h-5 mr-2 animate-spin"
                                            aria-hidden="true"
                                        />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Request Testnet {currency ?? "ETH"}
                                        <ArrowRight
                                            className="w-5 h-5 ml-2"
                                            aria-hidden="true"
                                        />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Success Modal */}
            <Dialog
                open={!!successData}
                onOpenChange={(open) => !open && setSuccessData(null)}
            >
                <DialogContent className="sm:max-w-md border-blue-200 bg-gradient-to-b from-white to-blue-50 bg-background">
                    <DialogHeader className="pb-2">
                        <DialogTitle className="text-xl text-blue-700 font-semibold">
                            Test {currency ?? "ETH"} Request Successful!
                        </DialogTitle>
                        <DialogDescription className="text-gray-600">
                            Your requested testnet {currency ?? "ETH"} has been
                            processed successfully.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4 overflow-hidden">
                        <div className="bg-background rounded-lg p-4 border border-blue-100 shadow-sm">
                            <p className="text-sm font-medium text-gray-500 mb-2">
                                Amount Sent:
                            </p>
                            <p className="text-2xl font-bold text-blue-600">
                                {successData?.amount &&
                                    displayNumber(successData.amount, 5)}{" "}
                                {currency ?? "ETH"}
                            </p>
                        </div>

                        <div className="bg-background rounded-lg p-4 border border-blue-100 shadow-sm">
                            <p className="text-sm font-medium text-gray-500 mb-2">
                                Transaction Hash:
                            </p>
                            <div className="relative bg-background rounded p-0 mt-1 flex">
                                <div className="py-3 px-3 overflow-hidden overflow-ellipsis whitespace-nowrap max-w-[calc(100%-36px)]">
                                    <code className="text-xs">
                                        {successData?.txHash}
                                    </code>
                                </div>
                                <button
                                    onClick={() =>
                                        successData?.txHash &&
                                        copyToClipboard(successData.txHash)
                                    }
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
                                    aria-label="Copy transaction hash"
                                >
                                    {isCopied ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {explorer && (
                            <a
                                href={`${explorer.url}/tx/${successData?.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex justify-center items-center  bg-blue-50 hover:bg-blue-100  text-blue-700 font-medium py-3 px-4 rounded-lg transition-colors w-full"
                            >
                                View on {explorer.name}
                                <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
};

export default RequestForm;
