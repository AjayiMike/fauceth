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
} from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "../ui/alert";
import { isAddress } from "viem";
import { displayNumber, formatDuration } from "@/lib/utils/formatting";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "../ui/card";
import HCaptcha from "@hcaptcha/react-hcaptcha";

const RequestForm = ({
    balance,
    faucetAmount,
    cooldownPeriod,
    networkId,
    isBalanceLoading,
}: {
    balance?: number;
    faucetAmount?: number;
    cooldownPeriod?: number;
    networkId?: number;
    isBalanceLoading?: boolean;
}) => {
    const [address, setAddress] = useState("");
    const [addressError, setAddressError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hCaptchaToken, setHCaptchaToken] = useState<string | null>(null);
    const formattedBalance = balance ? displayNumber(balance, 3) : "0";
    const isZeroBalance = formattedBalance === "0";
    const isLowBalance = !isZeroBalance && Number(formattedBalance) < 1;

    const hCaptchaRef = useRef<HCaptcha>(null);

    const renderAlert = () => {
        if (isBalanceLoading) {
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
                        The faucet is currently empty. Please try again later or
                        consider donating to help keep the faucet running.
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
                        The faucet balance is running low (
                        {isBalanceLoading ? (
                            <span className="inline-flex items-center">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Loading...
                            </span>
                        ) : (
                            formattedBalance
                        )}{" "}
                        ETH). You can still request{" "}
                        {displayNumber(faucetAmount || 0, 3)} ETH every{" "}
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
                    You can request {displayNumber(faucetAmount || 0, 3)} ETH
                    every {formatDuration(cooldownPeriod || 0)}. Make sure to
                    provide a valid Ethereum address.
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
        if (!networkId) {
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
                    networkId,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Transaction failed");
            }

            toast.success("Tokens requested successfully");

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
                            Request Tokens
                        </h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {renderAlert()}

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
                                        disabled={isLoading}
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

                            <HCaptcha
                                sitekey={
                                    process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ||
                                    ""
                                }
                                onExpire={onHCaptchaExpire}
                                onError={onHCaptchaError}
                                onVerify={setHCaptchaToken}
                                ref={hCaptchaRef}
                            />

                            <Button
                                className="w-full h-12 text-base font-medium bg-blue-500 hover:bg-blue-600"
                                size="lg"
                                disabled={
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
                                        Request Tokens
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
        </motion.div>
    );
};

export default RequestForm;
