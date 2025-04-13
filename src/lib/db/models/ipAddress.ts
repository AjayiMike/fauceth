import mongoose, { Schema } from "mongoose";
import { z } from "zod";
import { IBase } from "./base";

export interface IIpAddress extends IBase {
    address: string;
    lastSeenAt: Date;
    requestCount: number;
}

const ipAddressSchema = new Schema<IIpAddress>(
    {
        address: {
            type: String,
            required: true,
            unique: true,
        },
        lastSeenAt: {
            type: Date,
            required: true,
        },
        requestCount: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
    },
    { timestamps: true }
);

ipAddressSchema.index({ lastSeenAt: -1 });

// Safe model registration
export const IpAddress =
    mongoose.models.IpAddress ||
    mongoose.model<IIpAddress>("IpAddress", ipAddressSchema);

export const ipAddressZodSchema = z.object({
    address: z.string().ip(),
    lastSeenAt: z.date(),
    requestCount: z.number().int().nonnegative(),
});
