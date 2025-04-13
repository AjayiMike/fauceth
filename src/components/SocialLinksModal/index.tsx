"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Twitter, Github, Linkedin } from "lucide-react";

interface SocialLinksModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (links: {
        twitter?: string;
        github?: string;
        linkedin?: string;
    }) => Promise<void>;
}

export const SocialLinksModal = ({
    isOpen,
    onClose,
    onSubmit,
}: SocialLinksModalProps) => {
    const [links, setLinks] = useState({
        twitter: "",
        github: "",
        linkedin: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            await onSubmit(links);
            onClose();
        } catch (error) {
            console.error("Failed to save social links:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Share Your Social Media</DialogTitle>
                    <DialogDescription>
                        Thank you for your donation! Share your social media
                        handles to get recognized in our leaderboard.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex items-center gap-4">
                        <Twitter className="h-5 w-5 text-[#1DA1F2]" />
                        <Input
                            placeholder="Twitter username"
                            value={links.twitter}
                            onChange={(e) =>
                                setLinks((prev) => ({
                                    ...prev,
                                    twitter: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <Github className="h-5 w-5" />
                        <Input
                            placeholder="GitHub username"
                            value={links.github}
                            onChange={(e) =>
                                setLinks((prev) => ({
                                    ...prev,
                                    github: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <Linkedin className="h-5 w-5 text-[#0A66C2]" />
                        <Input
                            placeholder="LinkedIn username"
                            value={links.linkedin}
                            onChange={(e) =>
                                setLinks((prev) => ({
                                    ...prev,
                                    linkedin: e.target.value,
                                }))
                            }
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Skip
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        Save
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
