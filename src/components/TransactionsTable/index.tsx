"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowDownUp,
    History,
    Loader2,
    Wallet,
    ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useState, memo, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { truncateAddress } from "@/lib/utils/formatting";
import { useNetworksStore } from "@/lib/store/networksStore";
import { getPreferredExplorer } from "@/lib/networks";
import { useQuery } from "@tanstack/react-query";

interface Transaction {
    _id: string;
    userId: {
        address: string;
    };
    amount: number;
    networkId: number;
    txHash: string;
    createdAt: string;
}

const TransactionsTable = () => {
    const [activeTab, setActiveTab] = useState<"requests" | "donations">(
        "requests"
    );
    const [requests, setRequests] = useState<Transaction[]>([]);
    const [donations, setDonations] = useState<Transaction[]>([]);
    const [limit, setLimit] = useState<number>(10);
    const [page, setPage] = useState<number>(1);
    const [error, setError] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);
    const networks = useNetworksStore((state) => state.networks);

    const {
        data,
        isLoading,
        error: queryError,
    } = useQuery({
        queryKey: ["transactions", activeTab, page, limit],
        queryFn: async () => {
            const response = await fetch(
                `/api/${activeTab}?page=${page}&limit=${limit}`
            );
            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Failed to fetch transactions"
                );
            }

            return {
                transactions: result.data.data,
                totalPages: result.data.totalPages,
                total: result.data.total,
            };
        },
        refetchInterval: 4000,
    });

    useEffect(() => {
        if (data) {
            if (activeTab === "requests") {
                setRequests(data.transactions);
            } else {
                setDonations(data.transactions);
            }
            setTotalPages(data.totalPages);
            setTotalItems(data.total);
            setError(null);
        }
    }, [data, activeTab]);

    useEffect(() => {
        if (queryError) {
            const errorMessage =
                queryError instanceof Error
                    ? queryError.message
                    : "Failed to fetch transactions";
            setError(errorMessage);
            console.error(`Error fetching ${activeTab}:`, queryError);
        }
    }, [queryError, activeTab]);

    const MotionTableRow = motion(TableRow);

    const renderTransactions = useCallback(
        (transactions: Transaction[]) => {
            if (isLoading) {
                return (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                            <div className="flex items-center justify-center">
                                <Loader2
                                    className="h-6 w-6 animate-spin text-muted-foreground"
                                    aria-hidden="true"
                                />
                            </div>
                        </TableCell>
                    </TableRow>
                );
            }

            if (error) {
                return (
                    <TableRow>
                        <TableCell
                            colSpan={5}
                            className="text-center py-8 text-red-500"
                        >
                            {error}
                        </TableCell>
                    </TableRow>
                );
            }

            if (!transactions.length) {
                return (
                    <TableRow>
                        <TableCell
                            colSpan={5}
                            className="text-center py-8 text-muted-foreground"
                        >
                            No transactions found
                        </TableCell>
                    </TableRow>
                );
            }

            return transactions.map((tx, index) => {
                const network = networks.find(
                    (n) => n.chainId === tx.networkId
                );
                const amountInUnits = tx.amount;
                const explorer = getPreferredExplorer(network);

                return (
                    <MotionTableRow
                        key={tx._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.2,
                            delay: index * 0.1,
                        }}
                        className={`hover:bg-${
                            activeTab === "requests" ? "blue" : "rose"
                        }-500/5`}
                    >
                        <TableCell className="font-mono">
                            {truncateAddress(tx.userId.address)}
                        </TableCell>
                        <TableCell>
                            {network?.name ?? "Unknown Network"}
                        </TableCell>
                        <TableCell>{`${amountInUnits} ${network?.nativeCurrency.symbol ?? ""}`}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                            {formatDistanceToNow(new Date(tx.createdAt), {
                                addSuffix: true,
                            })}
                        </TableCell>
                        <TableCell className="font-mono text-right">
                            <a
                                href={
                                    explorer
                                        ? `${explorer.url}/tx/${tx.txHash}`
                                        : "#"
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 hover:underline"
                            >
                                {truncateAddress(tx.txHash)}
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </TableCell>
                    </MotionTableRow>
                );
            });
        },
        [isLoading, error, activeTab, networks, MotionTableRow]
    );

    return (
        <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-6 flex items-center gap-3 border-b">
                <History
                    className="h-5 w-5 text-muted-foreground"
                    aria-hidden="true"
                />
                <h2 className="font-semibold">Recent Transactions</h2>
            </div>
            <Tabs
                defaultValue="requests"
                className="w-full"
                onValueChange={(value) =>
                    setActiveTab(value as "requests" | "donations")
                }
            >
                <div className="px-6 py-4 border-b">
                    <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                        <TabsTrigger
                            value="requests"
                            className="inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-blue-600 data-[state=active]:shadow hover:text-blue-600"
                        >
                            <ArrowDownUp
                                className="w-4 h-4 mr-2"
                                aria-hidden="true"
                            />
                            Requests
                        </TabsTrigger>
                        <TabsTrigger
                            value="donations"
                            className="inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-rose-600 data-[state=active]:shadow hover:text-rose-600"
                        >
                            <Wallet
                                className="w-4 h-4 mr-2"
                                aria-hidden="true"
                            />
                            Donations
                        </TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="requests" className="mt-0">
                    <div className="p-6">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead scope="col">Address</TableHead>
                                    <TableHead scope="col">Network</TableHead>
                                    <TableHead scope="col">Amount</TableHead>
                                    <TableHead
                                        scope="col"
                                        className="text-right"
                                    >
                                        Time
                                    </TableHead>
                                    <TableHead
                                        scope="col"
                                        className="text-right"
                                    >
                                        Tx Hash
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {renderTransactions(requests)}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={5} className="py-2">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span>Rows per page:</span>
                                                <select
                                                    className="border rounded px-2 py-1 bg-background"
                                                    value={limit}
                                                    onChange={(e) => {
                                                        setLimit(
                                                            Number(
                                                                e.target.value
                                                            )
                                                        );
                                                        setPage(1);
                                                    }}
                                                >
                                                    {[5, 10, 20, 50].map(
                                                        (opt) => (
                                                            <option
                                                                key={opt}
                                                                value={opt}
                                                            >
                                                                {opt}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    className="px-2 py-1 border rounded disabled:opacity-50"
                                                    onClick={() =>
                                                        setPage(page - 1)
                                                    }
                                                    disabled={
                                                        page <= 1 || isLoading
                                                    }
                                                >
                                                    Previous
                                                </button>
                                                <span>
                                                    Page {page} of {totalPages}{" "}
                                                    ({totalItems} total)
                                                </span>
                                                <button
                                                    className="px-2 py-1 border rounded disabled:opacity-50"
                                                    onClick={() =>
                                                        setPage(page + 1)
                                                    }
                                                    disabled={
                                                        page >= totalPages ||
                                                        isLoading
                                                    }
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </TabsContent>
                <TabsContent value="donations" className="mt-0">
                    <div className="p-6">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead scope="col">Address</TableHead>
                                    <TableHead scope="col">Network</TableHead>
                                    <TableHead scope="col">Amount</TableHead>
                                    <TableHead
                                        scope="col"
                                        className="text-right"
                                    >
                                        Time
                                    </TableHead>
                                    <TableHead
                                        scope="col"
                                        className="text-right"
                                    >
                                        Tx Hash
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {renderTransactions(donations)}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={5} className="py-2">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span>Rows per page:</span>
                                                <select
                                                    className="border rounded px-2 py-1 bg-background"
                                                    value={limit}
                                                    onChange={(e) => {
                                                        setLimit(
                                                            Number(
                                                                e.target.value
                                                            )
                                                        );
                                                        setPage(1);
                                                    }}
                                                >
                                                    {[5, 10, 20, 50].map(
                                                        (opt) => (
                                                            <option
                                                                key={opt}
                                                                value={opt}
                                                            >
                                                                {opt}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    className="px-2 py-1 border rounded disabled:opacity-50"
                                                    onClick={() =>
                                                        setPage(page - 1)
                                                    }
                                                    disabled={
                                                        page <= 1 || isLoading
                                                    }
                                                >
                                                    Previous
                                                </button>
                                                <span>
                                                    Page {page} of {totalPages}{" "}
                                                    ({totalItems} total)
                                                </span>
                                                <button
                                                    className="px-2 py-1 border rounded disabled:opacity-50"
                                                    onClick={() =>
                                                        setPage(page + 1)
                                                    }
                                                    disabled={
                                                        page >= totalPages ||
                                                        isLoading
                                                    }
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default memo(TransactionsTable);
