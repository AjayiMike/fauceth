"use client";

import { Button } from "@/components/ui/button";
import { Heart, Info } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import NumericalInput from "../NumericalInput";
import { useState } from "react";
import useETHBalance from "@/hooks/useETHBalance";
import { parseEther, WriteContractErrorType } from "viem";
import { displayNumber } from "@/lib/utils";
import useDonate from "@/hooks/useDonate";
import { toast } from "sonner";
import { useConnection } from "@/providers/ConnectionProvider";
import { isSupportedChain } from "@/config";
import { getPublicClient } from "@/config/networks";
const DonateForm = () => {
    const { isConnected, chainId } = useConnection();
    const { balance, formattedBalance, isLoading } = useETHBalance();
    const donate = useDonate();
    const [amount, setAmount] = useState("");

    const insufficientBalance =
        balance !== undefined &&
        Boolean(amount) &&
        balance < parseEther(amount);

    const isError = !isLoading && insufficientBalance;

    const handleDonate = async () => {
        try {
            if (!isConnected) {
                toast.error("Please connect your wallet to donate.");
                return;
            }

            // Check if we're on the correct network
            if (!isSupportedChain(chainId)) {
                // Sepolia testnet
                toast.error("Please switch to Sepolia testnet to donate.");
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
                        amount
                    )} ETH to donate. Your balance: ${displayNumber(
                        formattedBalance
                    )} ETH`
                );
                return;
            }

            const txHash = await donate(amount);

            toast.info("Transaction sent. Waiting for confirmation...");

            const txReceipt = await getPublicClient().waitForTransactionReceipt(
                {
                    hash: txHash,
                }
            );

            if (txReceipt.status !== "success") {
                throw new Error("Transaction failed");
            }

            // Show success message
            toast.success(`Successfully donated ${amount} ETH! Thank you!`);

            // Reset form
            setAmount("");
        } catch (err) {
            const error = err as WriteContractErrorType;
            toast.error(error.message);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
        >
            <Alert className="bg-rose-500/10 text-rose-600">
                <Info className="h-5 w-5 mt-0.5" />
                <AlertTitle className="font-medium mb-1">
                    Support the Community
                </AlertTitle>
                <AlertDescription className="text-rose-600/80">
                    Your donations help keep this faucet running. Any amount of
                    ETH is appreciated.
                </AlertDescription>
            </Alert>

            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="relative">
                        <div className="text-sm text-muted-foreground mb-1">
                            Your current balance:{" "}
                            {displayNumber(formattedBalance)} ETH
                        </div>
                        <NumericalInput
                            value={amount}
                            onUserInput={(value) => {
                                setAmount(value);
                            }}
                            placeholder="Enter amount to donate"
                            isError={isError}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground px-1">
                        Enter the amount of ETH you want to donate to the faucet
                    </p>
                </div>

                <Button
                    className="w-full h-12 text-base font-medium bg-rose-500 hover:bg-rose-600"
                    size="lg"
                    disabled={isError || isLoading || !Boolean(amount)}
                    onClick={handleDonate}
                >
                    Donate
                    <Heart className="w-5 h-5 ml-2" />
                </Button>
            </div>
        </motion.div>
    );
};

export default DonateForm;
