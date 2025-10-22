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
import { useAnalytics } from "@/hooks/useAnalytics";
import { AnalyticsEvents } from "@/hooks/useAnalytics";
import Cookies from "js-cookie";

const getCsrfToken = () => Cookies.get("csrf_token_read") || "";

const hashValue = async (value: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

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

    const { trackEvent } = useAnalytics();

    const renderAlert = () => {
        if (
            isBalanceLoading ||
            isBalanceLoading === undefined ||
            balance === undefined
        ) {
            return (
                <Alert className="bg-primary/10 text-primary">
                    <Loader2
                        className="h-5 w-5 mt-0.5 animate-spin"
                        aria-hidden="true"
                    />
                    <AlertDescription className="text-primary/80">
                        Loading faucet information...
                    </AlertDescription>
                </Alert>
            );
        }

        if (isZeroBalance) {
            return (
                <Alert className="bg-primary/10 text-primary">
                    <AlertCircle
                        className="h-5 w-5 mt-0.5"
                        aria-hidden="true"
                    />
                    <AlertDescription className="text-primary/80">
                        The {network?.name || "current network"} faucet is
                        currently empty. Please check back later or consider
                        donating to help keep the faucet running.
                    </AlertDescription>
                </Alert>
            );
        }

        if (isLowBalance) {
            return (
                <Alert className="bg-primary/10 text-primary">
                    <AlertTriangle
                        className="h-5 w-5 mt-0.5"
                        aria-hidden="true"
                    />
                    <AlertDescription className="text-primary/80">
                        The faucet is very low on this network, therefore cannot
                        dispense at the moment. consider donating to help keep
                        it running.
                    </AlertDescription>
                </Alert>
            );
        }

        if (isWarningBalance) {
            return (
                <Alert className="bg-blue-500/10 text-blue-600">
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
            <Alert className="bg-primary/10 text-primary">
                <Info className="h-5 w-5 mt-0.5" aria-hidden="true" />
                <AlertDescription className="text-primary/80">
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
            trackEvent(
                AnalyticsEvents.ERROR_OCCURRED,
                { type: "invalid_address" },
                true
            );
        }
        trackEvent(
            AnalyticsEvents.ADDRESS_INPUT_CHANGE,
            { length: value.length },
            false
        ); // Basic
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
                    "x-csrf-token": getCsrfToken(),
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
            trackEvent(
                AnalyticsEvents.REQUEST_SUBMIT_SUCCESS,
                { hashedAddress: await hashValue(address) },
                true
            ); // Advanced, with client-side hash
        } catch (err) {
            console.error("Request error:", err);
            if (err instanceof Error) {
                toast.error(err.message);
                trackEvent(
                    AnalyticsEvents.ABUSE_SIGNAL,
                    { type: "request_failure", message: err.message },
                    true
                );
                trackEvent(
                    AnalyticsEvents.REQUEST_SUBMIT_ERROR,
                    { errorType: err.message },
                    true
                ); // Advanced
            } else {
                toast.error("An unknown error occurred");
            }
        } finally {
            hCaptchaRef.current?.resetCaptcha();
            setIsLoading(false);
            trackEvent(AnalyticsEvents.REQUEST_BUTTON_CLICK, {}, false); // Basic
        }
    };

    const onHCaptchaExpire = () => {
        toast.error("hCaptcha token expired");
    };

    const onHCaptchaError = (err: string) => {
        toast.error(err);
        trackEvent(
            AnalyticsEvents.ABUSE_SIGNAL,
            { type: "captcha_error", message: err },
            true
        );
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
                        <Droplet className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-lg">
                            Request Testnet {currency ?? "ETH"}
                        </h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {renderAlert()}

                        <Alert className="bg-primary/10 text-primary">
                            <Info
                                className="h-5 w-5 mt-0.5"
                                aria-hidden="true"
                            />
                            <AlertDescription className="text-primary/80">
                                To request funds, you need a Gitcoin Passport
                                score of at least {env.PASSPORT_SCORE_THRESHOLD}
                                .
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
                                className="w-full h-12 text-base font-medium"
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
                <DialogContent className="sm:max-w-md bg-background">
                    <DialogHeader className="pb-2">
                        <DialogTitle className="text-xl text-foreground font-semibold">
                            Test {currency ?? "ETH"} Request Successful!
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Your requested testnet {currency ?? "ETH"} has been
                            processed successfully.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4 overflow-hidden">
                        <div className="bg-background rounded-lg p-4 border shadow-sm">
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                                Amount Sent:
                            </p>
                            <p className="text-2xl font-bold text-primary">
                                {successData?.amount &&
                                    displayNumber(successData.amount, 5)}{" "}
                                {currency ?? "ETH"}
                            </p>
                        </div>

                        <div className="bg-background rounded-lg p-4 border shadow-sm">
                            <p className="text-sm font-medium text-muted-foreground mb-2">
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
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                                    aria-label="Copy transaction hash"
                                >
                                    {isCopied ? (
                                        <Check className="h-4 w-4 text-primary" />
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
                                className="flex justify-center items-center bg-accent hover:bg-accent/80 text-accent-foreground font-medium py-3 px-4 rounded-lg transition-colors w-full"
                            >
                                View on {explorer.name}
                                <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                        )}

                        <div className="pt-4 mt-4 border-t">
                            <div className="space-y-4 text-center">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Do you like this faucet? Give it a star on
                                    GitHub!
                                </p>
                                <div className="flex justify-center">
                                    <iframe
                                        src="https://ghbtns.com/github-btn.html?user=AjayiMike&repo=fauceth&type=star&count=true&size=large"
                                        width="120"
                                        height="30"
                                        title="GitHub"
                                    />
                                </div>

                                <p className="text-sm font-medium text-muted-foreground">
                                    Share the news with others on X!
                                </p>
                                <Button
                                    variant="outline"
                                    className="w-full flex items-center justify-center gap-2"
                                    onClick={() => {
                                        const tweetText = `I just got some testnet ${
                                            currency ?? "ETH"
                                        } from Fauceth! A fast and reliable multichain community-funded faucet for all your testing needs. Check it out: ${
                                            window.location.origin
                                        }`;
                                        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                                            tweetText
                                        )}`;
                                        window.open(
                                            tweetUrl,
                                            "_blank",
                                            "noopener,noreferrer"
                                        );
                                    }}
                                >
                                    <svg
                                        role="img"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 fill-current"
                                    >
                                        <title>X</title>
                                        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.931ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                                    </svg>
                                    Share on X
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
};

export default RequestForm;
