import mongoose, { Schema } from "mongoose";
import { z } from "zod";
import { IBase } from "./base";

export interface IRateLimit extends IBase {
    walletAddress: string;
    ipAddress: string;
    networkId: number;
    lastRequestAt: Date;
    requestCount: number;
    intervalStart: Date;
}

const rateLimitSchema = new Schema<IRateLimit>(
    {
        walletAddress: {
            type: String,
            required: true,
            match: /^0x[a-fA-F0-9]{40}$/,
        },
        ipAddress: {
            type: String,
            required: true,
        },
        networkId: {
            type: Number,
            required: true,
        },
        lastRequestAt: {
            type: Date,
            required: true,
        },
        requestCount: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        intervalStart: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

rateLimitSchema.index(
    { walletAddress: 1, ipAddress: 1, networkId: 1 },
    { unique: true }
);
rateLimitSchema.index({ lastRequestAt: -1 });

// Safe model registration
export const RateLimit =
    mongoose.models.RateLimit ||
    mongoose.model<IRateLimit>("RateLimit", rateLimitSchema);

export const rateLimitZodSchema = z.object({
    walletAddress: z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
    ipAddress: z.string().ip(),
    networkId: z.number().int().positive(),
    lastRequestAt: z.date(),
    requestCount: z.number().int().nonnegative(),
    intervalStart: z.date(),
});
