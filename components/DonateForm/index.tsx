"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Info } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

const DonateForm = () => {
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
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Enter amount to donate"
                            className="h-12 text-base px-4 pr-12"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            ETH
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground px-1">
                        Enter the amount of ETH you want to donate to the faucet
                    </p>
                </div>

                <Button
                    className="w-full h-12 text-base font-medium bg-rose-500 hover:bg-rose-600"
                    size="lg"
                >
                    Donate
                    <Heart className="w-5 h-5 ml-2" />
                </Button>
            </div>
        </motion.div>
    );
};

export default DonateForm;
