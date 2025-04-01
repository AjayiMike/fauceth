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
import { ArrowDownUp, History, Wallet } from "lucide-react";
import { motion } from "framer-motion";

const TransactionsTable = () => {
    // Dummy data
    const requests = [
        {
            address: "0x1234...5678",
            amount: "0.1 ETH",
            timestamp: "2 hours ago",
        },
        {
            address: "0x8765...4321",
            amount: "0.1 ETH",
            timestamp: "5 hours ago",
        },
    ];

    const donations = [
        {
            address: "0xabcd...efgh",
            amount: "0.5 ETH",
            timestamp: "1 day ago",
        },
        {
            address: "0xijkl...mnop",
            amount: "1 ETH",
            timestamp: "2 days ago",
        },
    ];

    const MotionTableRow = motion(TableRow);

    return (
        <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-6 flex items-center gap-3 border-b">
                <History className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold">Recent Transactions</h2>
            </div>
            <Tabs defaultValue="requests" className="w-full">
                <div className="px-6 py-4 border-b">
                    <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                        <TabsTrigger
                            value="requests"
                            className="inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-blue-600 data-[state=active]:shadow hover:text-blue-600"
                        >
                            <ArrowDownUp className="w-4 h-4 mr-2" />
                            Requests
                        </TabsTrigger>
                        <TabsTrigger
                            value="donations"
                            className="inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-rose-600 data-[state=active]:shadow hover:text-rose-600"
                        >
                            <Wallet className="w-4 h-4 mr-2" />
                            Donations
                        </TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="requests" className="mt-0">
                    <div className="p-6">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[40%]">
                                        Address
                                    </TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead className="text-right">
                                        Time
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((request, index) => (
                                    <MotionTableRow
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 0.2,
                                            delay: index * 0.1,
                                        }}
                                        className="hover:bg-blue-500/5"
                                    >
                                        <TableCell className="font-mono">
                                            {request.address}
                                        </TableCell>
                                        <TableCell>{request.amount}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {request.timestamp}
                                        </TableCell>
                                    </MotionTableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
                <TabsContent value="donations" className="mt-0">
                    <div className="p-6">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[40%]">
                                        Address
                                    </TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead className="text-right">
                                        Time
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {donations.map((donation, index) => (
                                    <MotionTableRow
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 0.2,
                                            delay: index * 0.1,
                                        }}
                                        className="hover:bg-rose-500/5"
                                    >
                                        <TableCell className="font-mono">
                                            {donation.address}
                                        </TableCell>
                                        <TableCell>{donation.amount}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {donation.timestamp}
                                        </TableCell>
                                    </MotionTableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default TransactionsTable;
