import mongoose, { Schema } from "mongoose";
import { z } from "zod";
import { IBase } from "./base";

export interface IDonation extends IBase {
    userId: mongoose.Types.ObjectId; // References IUser._id
    networkId: number;
    amount: number;
    txHash: string;
}

const donationSchema = new Schema<IDonation>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
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

// Indexes for leaderboard queries
donationSchema.index({ userId: 1, createdAt: -1 });
donationSchema.index({ networkId: 1, createdAt: -1 });
donationSchema.index({ createdAt: -1 });
donationSchema.index({ amount: -1 });
donationSchema.index({ userId: 1, amount: -1 }); // For top donors aggregation

// Safe model registration
export const Donation =
    mongoose.models.Donation ||
    mongoose.model<IDonation>("Donation", donationSchema);

export const donationZodSchema = z.object({
    userId: z.instanceof(mongoose.Types.ObjectId),
    networkId: z.number().int().positive(),
    amount: z.number().positive(),
    txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
});
