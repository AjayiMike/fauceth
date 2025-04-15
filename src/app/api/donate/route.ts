import { NextRequest } from "next/server";
import { success, error, validateRequest } from "@/lib/api/response";
import {
    getDonationByNetworkIdAndTxHash,
    getOrCreateUser,
    recordDonation,
} from "@/lib/db/operations";
import { donationZodSchema } from "@/lib/db/models/donation";
import { z } from "zod";
import { Address, checksumAddress, formatUnits, Hex, getAddress } from "viem";
import {
    filterWorkingRPCs,
    getNetworkInfo,
    getTransaction,
    isMatchingAddress,
} from "@/lib/networks";
import mongoose from "mongoose";
import { DonateResponse } from "@/lib/api/types";

const donateBodySchema = donationZodSchema
    .pick({
        networkId: true,
        txHash: true,
    })
    .extend({
        txHash: z
            .string()
            .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid Ethereum transaction hash"),
    });

type DonateBody = z.infer<typeof donateBodySchema>;

export async function POST(req: NextRequest) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const body = await req.json();
        const { networkId, txHash } = validateRequest<DonateBody>(
            body,
            donateBodySchema.parse
        );

        const checksummedTxHash = checksumAddress(txHash as Hex);

        // verify that the tx has not been used on this system in the past
        const existingDonation = await getDonationByNetworkIdAndTxHash(
            networkId,
            checksummedTxHash,
            session
        );
        if (existingDonation) {
            await session.abortTransaction();
            return error("Transaction already recorded", 400);
        }

        // fetch network details
        const networkDetails = await getNetworkInfo(networkId);
        if (!networkDetails.rpc.length) {
            await session.abortTransaction();
            return error("No RPC URLs found for network", 400);
        }

        // filter working RPCs
        const workingRPCURLs = await filterWorkingRPCs(networkDetails.rpc);
        if (workingRPCURLs.length === 0) {
            await session.abortTransaction();
            return error("No working RPC URLs found for network", 400);
        }

        // get transaction
        const { status, tx } = await getTransaction(
            checksummedTxHash,
            workingRPCURLs
        );

        // verify transaction status
        if (!status || status === "reverted") {
            await session.abortTransaction();
            return error("Transaction was reverted", 400);
        }

        // verify transaction is to faucet
        if (
            !tx.to ||
            !isMatchingAddress(
                tx.to,
                process.env.NEXT_PUBLIC_FAUCET_ADDRESS as Address
            )
        ) {
            await session.abortTransaction();
            return error("Transaction was not to faucet", 400);
        }

        // verify transaction value is not 0
        if (BigInt(tx.value) === BigInt(0)) {
            await session.abortTransaction();
            return error("No ETH sent with this transaction", 400);
        }

        // get or create user
        const user = await getOrCreateUser(getAddress(tx.from), session);

        // record donation
        await recordDonation(
            user._id.toString(),
            networkId,
            Number(
                formatUnits(tx.value, networkDetails.nativeCurrency.decimals)
            ),
            checksummedTxHash,
            session
        );

        await session.commitTransaction();
        return success<DonateResponse>({
            success: true,
        });
    } catch (err) {
        await session.abortTransaction();
        console.debug("Donate error:", err);
        return error(
            err instanceof Error ? err.message : "Internal server error",
            500
        );
    } finally {
        session.endSession();
    }
}
