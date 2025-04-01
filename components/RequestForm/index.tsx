"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Info } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

const RequestForm = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
        >
            <Alert className="bg-blue-500/10 text-blue-600">
                <Info className="h-5 w-5 mt-0.5" />
                <AlertTitle className="font-medium mb-1">
                    Request Information
                </AlertTitle>
                <AlertDescription className="text-blue-600/80">
                    You can request 0.1 ETH every 24 hours. Make sure to provide
                    a valid Ethereum address.
                </AlertDescription>
            </Alert>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Input
                        placeholder="Enter your Ethereum address (0x...)"
                        className="h-12 text-base px-4"
                    />
                    <p className="text-xs text-muted-foreground px-1">
                        Enter the Ethereum address where you want to receive the
                        tokens
                    </p>
                </div>

                <Button className="w-full h-12 text-base font-medium" size="lg">
                    Request Tokens
                    <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
            </div>
        </motion.div>
    );
};

export default RequestForm;
