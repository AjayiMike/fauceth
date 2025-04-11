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
import { NetworkItem } from "./NetworkItem";
import { NetworkIcon } from "./NetworkIcon";
import { useNetworksStore } from "@/lib/store/networksStore";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDebounce } from "@/hooks/useDebounce";

const NetworkDropdown = () => {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const { networks, selectedNetwork, setSelectedNetwork, isLoading } =
        useNetworksStore();
    const [parentNode, setParentNode] = useState<HTMLDivElement | null>(null);

    // Handle dropdown open/close
    const handleOpenChange = useCallback((isOpen: boolean) => {
        setOpen(isOpen);
    }, []);

    // Filter networks based on search term
    const filteredNetworks = useMemo(() => {
        if (!debouncedSearchTerm) return networks;

        const searchLower = debouncedSearchTerm.toLowerCase().trim();

        const filtered = networks.filter((network) => {
            const nameMatch = network.name.toLowerCase().includes(searchLower);
            const chainIdMatch = network.chainId
                .toString()
                .includes(debouncedSearchTerm);

            return nameMatch || chainIdMatch;
        });

        return filtered;
    }, [debouncedSearchTerm, networks]);

    const rowVirtualizer = useVirtualizer({
        count: filteredNetworks.length,
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
                <button className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-accent hover:bg-accent/80 transition-colors cursor-pointer">
                    {selectedNetwork ? (
                        <>
                            <NetworkIcon name={selectedNetwork.name} />
                            <span className="font-medium">
                                {selectedNetwork.name}
                            </span>
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
                            {isLoading ? (
                                <div className="p-2 text-sm text-muted-foreground">
                                    Loading networks...
                                </div>
                            ) : filteredNetworks.length === 0 ? (
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
                                            filteredNetworks[virtualRow.index];
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
                                                    onSelect={(network) => {
                                                        setSelectedNetwork(
                                                            network
                                                        );
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
