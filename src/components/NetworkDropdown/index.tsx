"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
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
import { IAugmentedNetwork } from "@/types/network";

const NetworkDropdown = () => {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const {
        networks,
        networkDetails,
        selectedNetwork,
        setSelectedNetwork,
        isLoading,
        initializeNetworks,
    } = useNetworksStore();

    useEffect(() => {
        // Initialize network fetching when the component mounts
        initializeNetworks();
    }, [initializeNetworks]);

    const [parentNode, setParentNode] = useState<HTMLDivElement | null>(null);

    const filteredAndSortedNetworks = useMemo(() => {
        // First, compose the augmented networks from the two separate state slices
        let processedNetworks: IAugmentedNetwork[] = networks.map(
            (network) => ({
                ...network,
                ...networkDetails[network.chainId],
            })
        );

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

        // Sort by health (online > pending > offline), then by balance
        return processedNetworks.sort((a, b) => {
            const healthPriority = { online: 1, pending: 2, offline: 3 };
            const priorityA = healthPriority[a.health];
            const priorityB = healthPriority[b.health];

            if (priorityA !== priorityB) return priorityA - priorityB;

            // If health is the same, sort by balance (desc) for online networks
            if (a.health === "online" && b.health === "online") {
                return (b.balance ?? -1) - (a.balance ?? -1);
            }

            // Otherwise, sort alphabetically
            return a.name.localeCompare(b.name);
        });
    }, [debouncedSearchTerm, networks, networkDetails]);

    const rowVirtualizer = useVirtualizer({
        count: filteredAndSortedNetworks.length,
        getScrollElement: () => parentNode,
        estimateSize: () => 60,
        overscan: 10,
        enabled: Boolean(parentNode),
    });

    const refCallback = useCallback((node: HTMLDivElement) => {
        if (node) setParentNode(node);
    }, []);

    const items = rowVirtualizer.getVirtualItems();

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-accent hover:bg-accent/80 transition-colors cursor-pointer text-sm">
                    {isLoading ? (
                        <span className="font-medium">Loading...</span>
                    ) : selectedNetwork ? (
                        <>
                            <div className="flex items-center space-x-2">
                                <NetworkIcon name={selectedNetwork.name} />
                                <span className="max-w-[100px] font-medium whitespace-nowrap overflow-hidden overflow-ellipsis">
                                    {selectedNetwork.name}
                                </span>
                            </div>
                            <div className="ml-2">
                                {getStatusIcon(selectedNetwork)}
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
                            {isLoading && networks.length === 0 ? (
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
                                        const network =
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
                                                    network={network}
                                                    isSelected={
                                                        selectedNetwork?.chainId ===
                                                        network.chainId
                                                    }
                                                    onSelect={(
                                                        net: IAugmentedNetwork
                                                    ) => {
                                                        setSelectedNetwork(net);
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
