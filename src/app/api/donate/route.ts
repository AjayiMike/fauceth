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
import { User } from "@/lib/db/models/user";

const donateBodySchema = donationZodSchema
    .pick({
        networkId: true,
        txHash: true,
    })
    .extend({
        txHash: z
            .string()
            .regex(
                /^0x[a-fA-F0-9]{64}$/,
                "Please provide a valid Ethereum transaction hash (starting with 0x followed by 64 hexadecimal characters)"
            ),
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
            return error(
                "This transaction has already been recorded as a donation. Please use a different transaction.",
                400
            );
        }

        // fetch network details
        const networkDetails = await getNetworkInfo(networkId);
        if (!networkDetails.rpc.length) {
            await session.abortTransaction();
            return error(
                `The network (ID: ${networkId}) is not supported or lacks RPC configuration. Please try a different network.`,
                400
            );
        }

        // filter working RPCs
        const workingRPCURLs = await filterWorkingRPCs(networkDetails.rpc);
        if (workingRPCURLs.length === 0) {
            await session.abortTransaction();
            return error(
                `Network connectivity issue with ${networkDetails.name}. We're unable to verify your transaction at this time. Please try again later.`,
                400
            );
        }

        // get transaction
        const { status, tx } = await getTransaction(
            checksummedTxHash,
            workingRPCURLs
        );

        // verify transaction status
        if (!status || status === "reverted") {
            await session.abortTransaction();
            return error(
                "The transaction was reverted or failed on the blockchain. Please provide a successful transaction.",
                400
            );
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
            return error(
                `This transaction wasn't sent to our faucet address (${process.env.NEXT_PUBLIC_FAUCET_ADDRESS}). Please use a transaction that was sent to our faucet.`,
                400
            );
        }

        // verify transaction value is not 0
        if (BigInt(tx.value) === BigInt(0)) {
            await session.abortTransaction();
            return error(
                "The transaction didn't include any ETH. Please provide a transaction that sends ETH to our faucet.",
                400
            );
        }

        // get or create user
        const user = await getOrCreateUser(getAddress(tx.from), session);

        console.log("User donation count BEFORE:", user.donationCount);

        // Check if this is the user's first donation - must check BEFORE recordDonation
        const isFirstTimeDonor = user.donationCount === 0;
        console.log("Is first time donor:", isFirstTimeDonor);

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

        // Verify user state after donation
        const userAfter = await User.findById(user._id).session(session);
        console.log("User donation count AFTER:", userAfter?.donationCount);

        await session.commitTransaction();

        // Log the final response for debugging
        const response = {
            success: true,
            isFirstTimeDonor: isFirstTimeDonor === true,
        };
        console.log("Response sent to client:", response);
        console.log("isFirstTimeDonor type:", typeof isFirstTimeDonor);
        console.log("isFirstTimeDonor value:", isFirstTimeDonor);

        return success<DonateResponse>(response);
    } catch (err) {
        await session.abortTransaction();
        console.debug("Donate error:", err);
        if (err instanceof z.ZodError) {
            // Handle validation errors specifically
            const errorMessage = err.errors
                .map((e) => `${e.path.join(".")}: ${e.message}`)
                .join(", ");
            return error(
                `Please check your donation details: ${errorMessage}`,
                400
            );
        }
        return error(
            err instanceof Error
                ? `Something went wrong with your donation: ${err.message}. Please try again or contact @0xadek on x if the issue persists.`
                : "An unexpected error occurred while processing your donation. Please try again later.",
            500
        );
    } finally {
        session.endSession();
    }
}
