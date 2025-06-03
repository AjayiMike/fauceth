import { INetwork } from "@/types/network";
import { CommandItem } from "@/components/ui/command";
import { NetworkIcon } from "./NetworkIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { memo, forwardRef, useMemo } from "react";
import { ActiveIcon, InactiveIcon, PendingIcon } from "./StatusIcons";
import { displayNumber } from "@/lib/utils/formatting";
import { cn } from "@/lib/utils";

// Augmented INetwork type for the props
interface AugmentedNetwork extends INetwork {
    balance: number | null;
    isBalanceLoading: boolean;
    isBalanceError: boolean;
}

interface NetworkStatusDataFromProps {
    isLoading: boolean;
    isError: boolean;
    balance: number | null;
}

export const getStatusIcon = ({
    // Modified to accept simplified props
    isLoading,
    isError,
    balance,
}: NetworkStatusDataFromProps) => {
    if (isLoading) return <PendingIcon className="text-gray-600" />;
    if (isError || balance === null)
        return <InactiveIcon className="text-destructive/50" />;
    return <ActiveIcon className="text-green-600" />;
};

interface NetworkItemProps {
    network: AugmentedNetwork; // Use the augmented type
    isSelected: boolean;
    onSelect: (network: AugmentedNetwork) => void; // onSelect now receives the augmented network
}

// Use memo and forwardRef to prevent unnecessary re-renders and forward refs
export const NetworkItem = memo(
    forwardRef<HTMLDivElement, NetworkItemProps>(
        ({ network, isSelected, onSelect }, ref) => {
            const status = useMemo(() => {
                if (network.isBalanceLoading) return "Pending";
                if (network.isBalanceError || network.balance === null)
                    return "Inactive";
                return "Active";
            }, [
                network.isBalanceLoading,
                network.isBalanceError,
                network.balance,
            ]);

            return (
                <CommandItem
                    ref={ref}
                    key={network.chainId}
                    data-index={network.chainId}
                    value={network.chainId.toString()}
                    onSelect={() => onSelect(network)} // Pass the augmented network to onSelect
                    className={cn(
                        "flex items-center justify-between py-3 cursor-pointer",
                        isSelected && "bg-green-300/50 pointer-events-none"
                    )}
                    disabled={isSelected}
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
                        <div title={status}>
                            {/* Use props directly for getStatusIcon */}
                            {getStatusIcon({
                                isLoading: network.isBalanceLoading,
                                isError: network.isBalanceError,
                                balance: network.balance,
                            })}
                        </div>
                        {network.isBalanceLoading &&
                        network.balance === null ? ( // Show skeleton if loading and no balance yet
                            <Skeleton className="h-4 w-16 mt-1" />
                        ) : (
                            <span className="text-xs text-muted-foreground mt-1 inline-block whitespace-nowrap overflow-hidden overflow-ellipsis">
                                {network.balance !== null
                                    ? `${displayNumber(network.balance, 3)} ${
                                          network.nativeCurrency?.symbol ||
                                          "ETH"
                                      }`
                                    : "0 ETH"}
                            </span>
                        )}
                    </div>
                </CommandItem>
            );
        }
    )
);

// Add display name for debugging
NetworkItem.displayName = "NetworkItem";
