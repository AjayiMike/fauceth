import mongoose, { Schema } from "mongoose";
import { z } from "zod";
import { IBase } from "./base";

export interface IUser extends IBase {
    address: string;
    totalDonations: number;
    totalRequests: number;
    donationCount: number;
    requestCount: number;
    lastRequestAt: Date;
    lastDonationAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        address: {
            type: String,
            required: true,
            unique: true,
            match: /^0x[a-fA-F0-9]{40}$/,
        },
        totalDonations: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        totalRequests: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        donationCount: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        requestCount: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        lastRequestAt: {
            type: Date,
            required: true,
        },
        lastDonationAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

userSchema.index({ createdAt: -1 });
userSchema.index({ lastRequestAt: -1 });
userSchema.index({ lastDonationAt: -1 });

// Safe model registration
export const User =
    mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export const userZodSchema = z.object({
    address: z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
    totalDonations: z.number().nonnegative(),
    totalRequests: z.number().nonnegative(),
    donationCount: z.number().int().nonnegative(),
    requestCount: z.number().int().nonnegative(),
    lastRequestAt: z.date(),
    lastDonationAt: z.date(),
});
