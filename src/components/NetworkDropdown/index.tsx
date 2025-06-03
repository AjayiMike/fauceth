"use client";

import { useState, useCallback, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Command,
    CommandGroup,
    CommandInput,
    CommandList,
} from "@/components/ui/command";
import { NetworkItem, getStatusIcon } from "./NetworkItem";
import { NetworkIcon } from "./NetworkIcon";
import { useNetworksStore } from "@/lib/store/networksStore";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDebounce } from "@/hooks/useDebounce";
import { useQuery, useQueries } from "@tanstack/react-query";
import { getNetworkBalance } from "@/lib/cache/networkBalances";
import { INetwork } from "@/types/network";

const NetworkDropdown = () => {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const {
        networks,
        selectedNetwork,
        setSelectedNetwork,
        isLoading: isLoadingNetworks,
    } = useNetworksStore();
    const [parentNode, setParentNode] = useState<HTMLDivElement | null>(null);

    // Get status for selected network
    const {
        data,
        isLoading: balanceLoading,
        isError,
    } = useQuery({
        queryKey: [
            "network-balance",
            selectedNetwork?.chainId,
            selectedNetwork?.rpc,
            selectedNetwork?.nativeCurrency?.decimals,
        ],
        queryFn: () =>
            getNetworkBalance(
                selectedNetwork!.chainId,
                selectedNetwork!.rpc,
                selectedNetwork!.nativeCurrency?.decimals || 18
            ),
        enabled: Boolean(selectedNetwork?.chainId && selectedNetwork?.rpc),
        refetchInterval: 3000,
    });

    // Fetch balances for all networks in the list
    const balanceQueries = useQueries({
        queries: isLoadingNetworks
            ? []
            : networks.map((network) => ({
                  queryKey: [
                      "network-balance",
                      network.chainId,
                      network.rpc?.join(","),
                      network.nativeCurrency?.decimals,
                  ],
                  queryFn: () =>
                      getNetworkBalance(
                          network.chainId,
                          network.rpc,
                          network.nativeCurrency?.decimals || 18
                      ),
                  enabled: Boolean(
                      network.chainId &&
                          network.rpc &&
                          network.rpc.length > 0 &&
                          !isLoadingNetworks
                  ),
                  staleTime: 30000,
                  refetchInterval: 60000,
              })),
    });

    const networksWithBalances = useMemo(() => {
        if (isLoadingNetworks) return [];
        return networks.map((network, index) => {
            const queryResult = balanceQueries[index];
            return {
                ...network,
                balance: queryResult?.data?.balance ?? null,
                isBalanceLoading: queryResult?.isLoading ?? true,
                isBalanceError: queryResult?.isError ?? false,
            };
        });
    }, [networks, isLoadingNetworks, balanceQueries]);

    // Handle dropdown open/close
    const handleOpenChange = useCallback((isOpen: boolean) => {
        setOpen(isOpen);
    }, []);

    // Filter networks based on search term and sort by balance
    const filteredAndSortedNetworks = useMemo(() => {
        let processedNetworks = networksWithBalances;

        if (debouncedSearchTerm) {
            const searchLower = debouncedSearchTerm.toLowerCase().trim();
            processedNetworks = processedNetworks.filter((network) => {
                const nameMatch = network.name
                    .toLowerCase()
                    .includes(searchLower);
                const chainIdMatch = network.chainId
                    .toString()
                    .includes(debouncedSearchTerm);
                return nameMatch || chainIdMatch;
            });
        }

        const getSortPriority = (network: (typeof networksWithBalances)[0]) => {
            if (network.isBalanceLoading) return 3;
            if (network.isBalanceError || network.balance === null) return 2;
            return 1;
        };

        return [...processedNetworks].sort((a, b) => {
            const priorityA = getSortPriority(a);
            const priorityB = getSortPriority(b);

            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }

            if (priorityA === 1 && a.balance !== null && b.balance !== null) {
                return b.balance - a.balance;
            }

            return a.name.localeCompare(b.name);
        });
    }, [debouncedSearchTerm, networksWithBalances]);

    const rowVirtualizer = useVirtualizer({
        count: filteredAndSortedNetworks.length,
        getScrollElement: () => parentNode,
        estimateSize: () => 60,
        overscan: 10,
        enabled: Boolean(parentNode),
    });

    const refCallback = useCallback((node: HTMLDivElement) => {
        if (node) {
            setParentNode(node);
        }
    }, []);

    const items = rowVirtualizer.getVirtualItems();

    return (
        <DropdownMenu open={open} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-accent hover:bg-accent/80 transition-colors cursor-pointer text-sm">
                    {selectedNetwork ? (
                        <>
                            <div className="flex items-center space-x-2">
                                <NetworkIcon name={selectedNetwork.name} />
                                <span className="font-medium">
                                    {selectedNetwork.name}
                                </span>
                            </div>
                            <div className="ml-2">
                                {getStatusIcon({
                                    isLoading: balanceLoading,
                                    isError,
                                    balance: data?.balance ?? 0,
                                })}
                            </div>
                        </>
                    ) : (
                        <span className="font-medium">Select Network</span>
                    )}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                className="w-[300px] p-0"
                align="end"
                sideOffset={4}
            >
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search networks..."
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                    />
                    <CommandList
                        ref={refCallback}
                        className="h-[300px] overflow-auto"
                    >
                        <CommandGroup>
                            {isLoadingNetworks ? (
                                <div className="p-2 text-sm text-muted-foreground">
                                    Loading networks...
                                </div>
                            ) : filteredAndSortedNetworks.length === 0 ? (
                                <div className="p-2 text-sm text-muted-foreground">
                                    No networks found.
                                </div>
                            ) : (
                                <div
                                    style={{
                                        height: `${rowVirtualizer.getTotalSize()}px`,
                                        width: "100%",
                                        position: "relative",
                                    }}
                                >
                                    {items.map((virtualRow) => {
                                        const networkWithBalance =
                                            filteredAndSortedNetworks[
                                                virtualRow.index
                                            ];
                                        return (
                                            <div
                                                key={virtualRow.key}
                                                data-index={virtualRow.index}
                                                style={{
                                                    position: "absolute",
                                                    top: 0,
                                                    left: 0,
                                                    width: "100%",
                                                    transform: `translateY(${virtualRow.start}px)`,
                                                }}
                                            >
                                                <NetworkItem
                                                    ref={
                                                        rowVirtualizer.measureElement
                                                    }
                                                    network={networkWithBalance}
                                                    isSelected={
                                                        selectedNetwork?.chainId ===
                                                        networkWithBalance.chainId
                                                    }
                                                    onSelect={(
                                                        selectedNwFromItem
                                                    ) => {
                                                        const originalNetwork =
                                                            networks.find(
                                                                (n) =>
                                                                    n.chainId ===
                                                                    selectedNwFromItem.chainId
                                                            );
                                                        if (originalNetwork) {
                                                            setSelectedNetwork(
                                                                originalNetwork
                                                            );
                                                        } else {
                                                            setSelectedNetwork(
                                                                selectedNwFromItem as INetwork
                                                            );
                                                        }
                                                        setOpen(false);
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default NetworkDropdown;
