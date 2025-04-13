import { INetwork } from "@/types/network";
import { CommandItem } from "@/components/ui/command";
import { NetworkIcon } from "./NetworkIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { memo, forwardRef, useMemo } from "react";
import { getNetworkBalance } from "@/lib/cache/networkBalances";
import { ActiveIcon, InactiveIcon, PendingIcon } from "./StatusIcons";
import { useQuery } from "@tanstack/react-query";
import { displayNumber } from "@/lib/utils/formatting";
import { cn } from "@/lib/utils";

interface NetworkItemProps {
    network: INetwork;
    isSelected: boolean;
    onSelect: (network: INetwork) => void;
}

// Use memo and forwardRef to prevent unnecessary re-renders and forward refs
export const NetworkItem = memo(
    forwardRef<HTMLDivElement, NetworkItemProps>(
        ({ network, isSelected, onSelect }, ref) => {
            const { data, isLoading, isError } = useQuery({
                queryKey: [
                    "network-balance",
                    network.chainId,
                    network.rpc,
                    network.nativeCurrency?.decimals,
                ],
                queryFn: () =>
                    getNetworkBalance(
                        network.chainId,
                        network.rpc,
                        network.nativeCurrency?.decimals || 18
                    ),
                enabled: Boolean(network.chainId && network.rpc),
                refetchInterval: 3000,
            });

            const getStatusIcon = () => {
                if (
                    isLoading ||
                    !data ||
                    data.balance === null ||
                    data.isLoading
                )
                    return <PendingIcon className="text-gray-600" />;
                if (isError || data?.isError)
                    return <InactiveIcon className="text-destructive/50" />;
                return <ActiveIcon className="text-green-600" />;
            };

            const status = useMemo(() => {
                if (isLoading || data?.isLoading) return "Pending";
                if (isError || data?.isError) return "Inactive";
                return "Active";
            }, [isLoading, isError, data?.isLoading, data?.isError]);

            return (
                <CommandItem
                    ref={ref}
                    key={network.chainId}
                    data-index={network.chainId}
                    value={network.chainId.toString()}
                    onSelect={() => onSelect(network)}
                    className={cn(
                        "flex items-center justify-between py-3 cursor-pointer",
                        isSelected && "bg-green-300/50 pointer-events-none"
                    )}
                    disabled={isSelected}
                >
                    <div className="flex items-center space-x-3 max-w-[70%]">
                        <NetworkIcon name={network.name} />
                        <div className="flex flex-col">
                            <span className="font-medium whitespace-nowrap overflow-hidden overflow-ellipsis w-[200px]">
                                {network.name}
                            </span>
                            <span className="text-xs text-muted-foreground inline-block whitespace-nowrap overflow-hidden overflow-ellipsis">
                                Chain ID: {network.chainId}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div title={status}>{getStatusIcon()}</div>
                        {!data && isLoading ? (
                            <Skeleton className="h-4 w-16 mt-1" />
                        ) : (
                            <span className="text-xs text-muted-foreground mt-1 inline-block whitespace-nowrap overflow-hidden overflow-ellipsis">
                                {data?.balance !== null &&
                                data?.balance !== undefined
                                    ? `${displayNumber(data?.balance, 3)} ${
                                          network.nativeCurrency?.symbol ||
                                          "ETH"
                                      }`
                                    : "0 ETH"}
                            </span>
                        )}
                    </div>
                    {/* {isSelected && (
                        <Check className="h-4 w-4 text-green-600 ml-2" />
                    )} */}
                </CommandItem>
            );
        }
    )
);

// Add display name for debugging
NetworkItem.displayName = "NetworkItem";
