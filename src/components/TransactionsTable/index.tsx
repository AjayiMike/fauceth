"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownUp, History, Loader2, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { truncateAddress } from "@/lib/utils/formatting";

interface Transaction {
    _id: string;
    userId: {
        address: string;
    };
    amount: number;
    createdAt: string;
}

const TransactionsTable = () => {
    const [activeTab, setActiveTab] = useState<"requests" | "donations">(
        "requests"
    );
    const [requests, setRequests] = useState<Transaction[]>([]);
    const [donations, setDonations] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTransactions = async (type: "requests" | "donations") => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/${type}?page=1&limit=10`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error("Failed to fetch transactions");
            }

            // Extract data from nested structure
            const transactions = result.data.data;

            if (type === "requests") {
                setRequests(transactions);
            } else {
                setDonations(transactions);
            }
        } catch (err) {
            console.error(`Error fetching ${type}:`, err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to fetch transactions"
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions(activeTab);
    }, [activeTab]);

    const MotionTableRow = motion(TableRow);

    const renderTransactions = (transactions: Transaction[]) => {
        if (isLoading) {
            return (
                <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
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
                        colSpan={3}
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
                        colSpan={3}
                        className="text-center py-8 text-muted-foreground"
                    >
                        No transactions found
                    </TableCell>
                </TableRow>
            );
        }

        return transactions.map((tx, index) => (
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
                <TableCell>{tx.amount} ETH</TableCell>
                <TableCell className="text-right text-muted-foreground">
                    {formatDistanceToNow(new Date(tx.createdAt), {
                        addSuffix: true,
                    })}
                </TableCell>
            </MotionTableRow>
        ));
    };

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
                                    <TableHead scope="col" className="w-[40%]">
                                        Address
                                    </TableHead>
                                    <TableHead scope="col">Amount</TableHead>
                                    <TableHead
                                        scope="col"
                                        className="text-right"
                                    >
                                        Time
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {renderTransactions(requests)}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
                <TabsContent value="donations" className="mt-0">
                    <div className="p-6">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead scope="col" className="w-[40%]">
                                        Address
                                    </TableHead>
                                    <TableHead scope="col">Amount</TableHead>
                                    <TableHead
                                        scope="col"
                                        className="text-right"
                                    >
                                        Time
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {renderTransactions(donations)}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default TransactionsTable;
