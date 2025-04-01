import { LogOut } from "lucide-react";
import Image from "next/image";

import { networkInfoMap, SupportedChainId } from "@/config";
import useCopyClipboard from "@/hooks/useCopyClipboard";
import { useConnection } from "@/providers/ConnectionProvider";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { AlertCircle, CheckCheck, Copy, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";

export const ConnectedAccount = () => {
    const {
        account,
        chainId,
        connectedProvider,
        handleSwitchChain,
        handleDisconnect,
    } = useConnection();
    const [copied, copy] = useCopyClipboard();

    const shortenedAddress = account
        ? `${account.slice(0, 6)}...${account.slice(-4)}`
        : "";

    const explorerUrl = chainId
        ? networkInfoMap[chainId as SupportedChainId]?.blockExplorerUrls[0]
        : "";

    const isSepolia = chainId === SupportedChainId.SEPOLIA;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 cursor-pointer">
                    <Image
                        src={connectedProvider?.info.icon || ""}
                        alt={connectedProvider?.info.name || ""}
                        width={20}
                        height={20}
                        className="w-5 h-5 rounded"
                    />
                    <span>{shortenedAddress}</span>
                    {!isSepolia && (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60" align="end" sideOffset={5}>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Image
                                src={connectedProvider?.info.icon || ""}
                                alt={connectedProvider?.info.name || ""}
                                width={24}
                                height={24}
                                className="w-6 h-6 rounded"
                            />
                            <span className="font-medium">
                                {connectedProvider?.info.name}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copy(account || "")}
                            className="h-8 w-8"
                        >
                            {copied ? (
                                <CheckCheck className="h-4 w-4" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            {shortenedAddress}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-2"
                            onClick={() =>
                                window.open(
                                    `${explorerUrl}/address/${account}`,
                                    "_blank"
                                )
                            }
                        >
                            <ExternalLink className="h-4 w-4" />
                            View
                        </Button>
                    </div>
                    {!isSepolia && (
                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={handleSwitchChain}
                        >
                            Switch to Sepolia
                        </Button>
                    )}
                    <Button
                        variant="destructive"
                        className="w-full"
                        onClick={handleDisconnect}
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Disconnect
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};
