"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Info, AlertTriangle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { isAddress } from "viem";
import { displayNumber, formatDuration } from "@/lib/utils/formatting";
import { useState } from "react";
import { getPublicClient } from "@/config/networks";
import { toast } from "sonner";

const RequestForm = ({
    balance,
    faucetAmount,
    cooldownPeriod,
}: {
    balance?: number;
    faucetAmount?: number;
    cooldownPeriod?: number;
}) => {
    const [address, setAddress] = useState("");
    const [addressError, setAddressError] = useState<string | null>(null);
    const formattedBalance = balance ? displayNumber(balance) : "0";
    const isZeroBalance = formattedBalance === "0";
    const isLowBalance = !isZeroBalance && Number(formattedBalance) < 1;

    const renderAlert = () => {
        if (isZeroBalance) {
            return (
                <Alert className="bg-destructive/10 text-destructive">
                    <AlertCircle className="h-5 w-5 mt-0.5" />
                    <AlertTitle className="font-medium mb-1">
                        Faucet Empty
                    </AlertTitle>
                    <AlertDescription className="text-destructive/80">
                        The faucet is currently empty. Please try again later or
                        consider donating to help keep the faucet running.
                    </AlertDescription>
                </Alert>
            );
        }

        if (isLowBalance) {
            return (
                <Alert className="bg-yellow-500/10 text-yellow-600">
                    <AlertTriangle className="h-5 w-5 mt-0.5" />
                    <AlertTitle className="font-medium mb-1">
                        Low Balance Warning
                    </AlertTitle>
                    <AlertDescription className="text-yellow-600/80">
                        The faucet balance is running low ({formattedBalance}{" "}
                        ETH). You can still request{" "}
                        {displayNumber(faucetAmount || 0)} ETH every{" "}
                        {formatDuration(cooldownPeriod || 0)}, but please
                        consider donating to help maintain the faucet.
                    </AlertDescription>
                </Alert>
            );
        }

        return (
            <Alert className="bg-blue-500/10 text-blue-600">
                <Info className="h-5 w-5 mt-0.5" />
                <AlertTitle className="font-medium mb-1">
                    Request Information
                </AlertTitle>
                <AlertDescription className="text-blue-600/80">
                    You can request {displayNumber(faucetAmount || 0)} ETH every{" "}
                    {formatDuration(cooldownPeriod || 0)}. Make sure to provide
                    a valid Ethereum address.
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
        try {
            const response = await fetch("/api/request", {
                method: "POST",
                body: JSON.stringify({ address }),
            });
            const data = await response.json();
            const tx = await getPublicClient().waitForTransactionReceipt({
                hash: data.txHash,
            });
            if (tx.status !== "success") {
                throw new Error("Transaction failed");
            }
            toast.success("Tokens requested successfully");
        } catch (err) {
            console.debug(err);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
        >
            {renderAlert()}

            <div className="space-y-4">
                <div className="space-y-2">
                    <Input
                        placeholder="Enter your Ethereum address (0x...)"
                        value={address}
                        onChange={(e) => handleAddressChange(e.target.value)}
                        className={addressError ? "border-destructive" : ""}
                    />
                    {addressError && (
                        <p className="text-xs text-destructive px-1">
                            {addressError}
                        </p>
                    )}
                    {!addressError && (
                        <p className="text-xs text-muted-foreground px-1">
                            Enter the Ethereum address where you want to receive
                            the tokens
                        </p>
                    )}
                </div>

                <Button
                    className="w-full h-12 text-base font-medium"
                    size="lg"
                    disabled={isZeroBalance || !isValid}
                    onClick={handleRequest}
                >
                    Request Tokens
                    <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
            </div>
        </motion.div>
    );
};

export default RequestForm;
