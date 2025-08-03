"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getCookieValue } from "@/lib/utils/cookies";

const ConsentModal = () => {
    const [isOpen, setIsOpen] = useState(!getCookieValue("cookieConsent"));
    const [advancedConsent, setAdvancedConsent] = useState(true);
    const isMobile = useMediaQuery("(max-width: 768px)");

    const handleAccept = () => {
        document.cookie = `cookieConsent=basic; max-age=31536000; path=/`;
        document.cookie = `advancedConsent=${advancedConsent ? "true" : "false"}; max-age=31536000; path=/`;
        localStorage.setItem("cookieConsent", "accepted");
        setIsOpen(false);
    };

    const handleOpenChange = (open: boolean) => {
        if (!open && !getCookieValue("cookieConsent")) {
            alert(
                "Basic analytics consent is required to use FaucETH. Please accept to continue."
            );
            return;
        }
        setIsOpen(open);
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent
                className={`sm:max-w-[425px] ${isMobile ? "p-4" : "p-6"}`}
            >
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                        Cookie Consent
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Accepting cookies helps us improve user experience,
                        prevent abuse, and enhance the faucet&apos;s
                        functionality.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="basic" className="font-medium">
                                Required (Basic Analytics)
                            </Label>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Essential for functionality, security, and basic
                            tracking (e.g., visits, sessions). Required to
                            proceed.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="advanced" className="font-medium">
                                Advanced Analytics
                            </Label>
                            <Switch
                                id="advanced"
                                checked={advancedConsent}
                                onCheckedChange={setAdvancedConsent}
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Detailed tracking for clicks, behavior, and
                            personalization. Optional.
                        </p>
                    </div>
                </div>
                <div className="w-full">
                    <Button onClick={handleAccept} className="w-full">
                        Save Selection & Agree
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ConsentModal;
