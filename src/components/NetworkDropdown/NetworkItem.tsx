import { IAugmentedNetwork, NetworkHealth, FaucetState } from "@/types/network";
import { CommandItem } from "@/components/ui/command";
import { NetworkIcon } from "./NetworkIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { memo, forwardRef } from "react";
import { ActiveIcon, InactiveIcon, PendingIcon } from "./StatusIcons";
import { displayNumber } from "@/lib/utils/formatting";
import { cn } from "@/lib/utils";

interface GetStatusIconProps {
    health: NetworkHealth;
    faucetState: FaucetState;
}

export const getStatusIcon = ({ health, faucetState }: GetStatusIconProps) => {
    if (health === "offline" || faucetState === "error") {
        return <InactiveIcon className="text-destructive/50" />;
    }
    if (health === "pending" || faucetState === "loading") {
        return <PendingIcon className="text-muted-foreground" />;
    }
    // Network is 'online' and faucet is 'ok', 'low', or 'empty'
    return <ActiveIcon className="text-primary" />;
};

const getStatusTooltip = ({
    health,
    faucetState,
}: GetStatusIconProps): string => {
    switch (health) {
        case "offline":
            return "Network is offline";
        case "pending":
            return "Checking network status...";
        case "online":
            switch (faucetState) {
                case "loading":
                    return "Fetching faucet balance...";
                case "ok":
                    return "Faucet is active";
                case "low":
                    return "Faucet balance is low";
                case "empty":
                    return "Faucet is empty, but you can still donate";
                case "error":
                    return "Could not retrieve faucet balance";
                default:
                    return "Online";
            }
        default:
            return "Unknown status";
    }
};

interface NetworkItemProps {
    network: IAugmentedNetwork;
    isSelected: boolean;
    onSelect: (network: IAugmentedNetwork) => void;
}

export const NetworkItem = memo(
    forwardRef<HTMLDivElement, NetworkItemProps>(
        ({ network, isSelected, onSelect }, ref) => {
            const isSelectable = network.health === "online";

            return (
                <CommandItem
                    ref={ref}
                    key={network.chainId}
                    data-index={network.chainId}
                    value={network.chainId.toString()}
                    onSelect={() => {
                        if (isSelectable) onSelect(network);
                    }}
                    disabled={!isSelectable || isSelected}
                    className={cn(
                        "flex items-center justify-between py-3 cursor-pointer",
                        !isSelectable && "opacity-50 cursor-not-allowed",
                        isSelected && "bg-accent pointer-events-none"
                    )}
                >
                    <div className="flex items-center space-x-3 max-w-[70%]">
                        <NetworkIcon name={network.name} />
                        <div className="flex flex-col">
                            <span className="font-medium whitespace-nowrap overflow-hidden overflow-ellipsis w-[200px] text-sm">
                                {network.name}
                            </span>
                            <span className="text-xs text-muted-foreground inline-block whitespace-nowrap overflow-hidden overflow-ellipsis">
                                Chain ID: {network.chainId}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div title={getStatusTooltip(network)}>
                            {getStatusIcon(network)}
                        </div>
                        {network.health === "pending" ||
                        (network.health === "online" &&
                            network.faucetState === "loading") ? (
                            <Skeleton className="h-4 w-16 mt-1" />
                        ) : (
                            <span className="text-xs text-muted-foreground mt-1 inline-block whitespace-nowrap overflow-hidden overflow-ellipsis">
                                {network.health === "online" &&
                                network.balance !== null
                                    ? `${displayNumber(network.balance, 3)} ${
                                          network.nativeCurrency?.symbol ||
                                          "ETH"
                                      }`
                                    : "---"}
                            </span>
                        )}
                    </div>
                </CommandItem>
            );
        }
    )
);

NetworkItem.displayName = "NetworkItem";
