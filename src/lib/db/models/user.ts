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
    socialLinks?: {
        twitter?: string;
        github?: string;
        linkedin?: string;
    };
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
        socialLinks: {
            type: {
                twitter: String,
                github: String,
                linkedin: String,
            },
            required: false,
        },
    },
    { timestamps: true }
);

userSchema.index({ createdAt: -1 });
userSchema.index({ lastRequestAt: -1 });
userSchema.index({ lastDonationAt: -1 });
userSchema.index({ totalDonations: -1 }); // Add index for leaderboard queries

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
    socialLinks: z
        .object({
            twitter: z.string().optional(),
            github: z.string().optional(),
            linkedin: z.string().optional(),
        })
        .optional(),
});
