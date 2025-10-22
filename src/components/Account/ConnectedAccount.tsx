import { LogOut } from "lucide-react";
import Image from "next/image";
import { useConnection } from "@/providers/ConnectionProvider";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";

export const ConnectedAccount = () => {
    const { account, connectedProvider, handleDisconnect } = useConnection();

    const shortenedAddress = account
        ? `${account.slice(0, 6)}...${account.slice(-4)}`
        : "";

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="bg-accent hover:bg-accent/80 border-input text-accent-foreground gap-2 cursor-pointer"
                >
                    <Image
                        src={connectedProvider?.info.icon || ""}
                        alt={connectedProvider?.info.name || ""}
                        width={20}
                        height={20}
                        className="w-5 h-5 rounded hidden sm:block"
                    />
                    <span>{shortenedAddress}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end" sideOffset={5}>
                <div className="flex flex-col gap-4">
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
                        variant="outline"
                        className="w-full border-input hover:bg-accent hover:text-accent-foreground"
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
