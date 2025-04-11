import { ObjectId } from "mongodb";

export interface User {
    _id: ObjectId;
    address: string;
    createdAt: Date;
    totalDonations: number;
    totalRequests: number;
    lastRequestAt: Date;
    lastDonationAt: Date;
}

export interface IPAddress {
    _id: ObjectId;
    ipAddress: string;
    userId: ObjectId;
    firstSeen: Date;
    lastSeen: Date;
    totalRequests: number;
}

export interface Donation {
    _id: ObjectId;
    userId: ObjectId;
    amount: number;
    networkId: number;
    txHash: string;
    createdAt: Date;
}

export interface Request {
    _id: ObjectId;
    userId: ObjectId;
    ipAddressId: ObjectId;
    networkId: number;
    amount: number;
    txHash: string;
    createdAt: Date;
}
export interface RateLimit {
    _id: ObjectId;
    walletAddress: string;
    ipAddress: string;
    networkId: number;
    lastRequestAt: Date;
    requestCount: number;
    intervalStart: Date;
}
