import mongoose, { Schema } from "mongoose";
import { z } from "zod";
import { IBase } from "./base";

export interface IRequest extends IBase {
    userId: mongoose.Types.ObjectId; // References IUser._id
    ipAddressId: mongoose.Types.ObjectId; // References IIpAddress._id
    networkId: number;
    amount: number;
    txHash: string;
}

const requestSchema = new Schema<IRequest>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        ipAddressId: {
            type: Schema.Types.ObjectId,
            ref: "IpAddress",
            required: true,
        },
        networkId: {
            type: Number,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        txHash: {
            type: String,
            required: true,
            unique: true,
            match: /^0x[a-fA-F0-9]{64}$/,
        },
    },
    { timestamps: true }
);

requestSchema.index({ userId: 1, createdAt: -1 });
requestSchema.index({ ipAddressId: 1, createdAt: -1 });
requestSchema.index({ networkId: 1, createdAt: -1 });
requestSchema.index({ userId: 1, networkId: 1, createdAt: -1 });
requestSchema.index({ ipAddressId: 1, networkId: 1, createdAt: -1 });

// Safe model registration
export const Request =
    mongoose.models.Request ||
    mongoose.model<IRequest>("Request", requestSchema);

export const requestZodSchema = z.object({
    userId: z.instanceof(mongoose.Types.ObjectId),
    ipAddressId: z.instanceof(mongoose.Types.ObjectId),
    networkId: z.number().int().positive(),
    amount: z.number().positive(),
    txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
});
