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
import { env } from "@/config/env";

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

const contactSupportMessage =
    " Please contact @0xAdek on x if the issue persists.";

export async function POST(req: NextRequest) {
    console.log("Donate endpoint hitd");

    const session = await mongoose.startSession();
    session.startTransaction();
    console.log("Session started");

    try {
        const body = await req.json();
        const { networkId, txHash } = validateRequest<DonateBody>(
            body,
            donateBodySchema.parse
        );
        console.log("Body validated");

        const checksummedTxHash = checksumAddress(txHash as Hex);
        console.log("Checksummed tx hash:", checksummedTxHash);

        // verify that the tx has not been used on this system in the past
        const existingDonation = await getDonationByNetworkIdAndTxHash(
            networkId,
            checksummedTxHash,
            session
        );
        console.log("Existing donation:", existingDonation);
        if (existingDonation) {
            await session.abortTransaction();
            return error(
                `This transaction has already been recorded as a donation. Please use a different transaction.${contactSupportMessage}`,
                400
            );
        }
        console.log("No existing donation of the same tx hash found");

        // fetch network details
        const networkDetails = await getNetworkInfo(networkId);
        if (!networkDetails.rpc.length) {
            await session.abortTransaction();
            return error(
                `The network (ID: ${networkId}) is not supported or lacks RPC configuration. Please try a different network.${contactSupportMessage}`,
                400
            );
        }
        console.log("Network details fetched");
        // filter working RPCs
        const workingRPCURLs = await filterWorkingRPCs(networkDetails.rpc);
        if (workingRPCURLs.length === 0) {
            await session.abortTransaction();
            return error(
                `Network connectivity issue with ${networkDetails.name}. We're unable to verify your transaction at this time. Please try again later.${contactSupportMessage}`,
                400
            );
        }
        console.log("Working RPCs filtered");
        // get transaction
        const { status, tx } = await getTransaction(
            checksummedTxHash,
            workingRPCURLs
        );
        console.log("Transaction fetched");
        // verify transaction status
        if (!status || status === "reverted") {
            await session.abortTransaction();
            return error(
                `The transaction was reverted or failed on the blockchain. Please provide a successful transaction.${contactSupportMessage}`,
                400
            );
        }
        console.log("Transaction status verified");
        // verify transaction is to faucet
        if (
            !tx.to ||
            !isMatchingAddress(tx.to, env.FAUCET_ADDRESS as Address)
        ) {
            await session.abortTransaction();
            return error(
                `This transaction wasn't sent to our faucet address (${env.FAUCET_ADDRESS}). Please use a transaction that was sent to our faucet.${contactSupportMessage}`,
                400
            );
        }
        console.log("Transaction to faucet verified");
        // verify transaction value is not 0
        if (BigInt(tx.value) === BigInt(0)) {
            await session.abortTransaction();
            return error(
                `The transaction didn't include any ETH. Please provide a transaction that sends ETH to our faucet.${contactSupportMessage}`,
                400
            );
        }
        console.log("Transaction value verified");
        // get or create user
        const user = await getOrCreateUser(getAddress(tx.from), session);
        console.log("User fetched or created");
        console.log("User donation count BEFORE:", user.donationCount);

        // Check if this is the user's first donation - must check BEFORE recordDonation
        const isFirstTimeDonor = user.donationCount === 0;
        console.log("Is first time donor:", isFirstTimeDonor);
        console.log("User donation count BEFORE:", user.donationCount);
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
        console.log("Donation recorded");
        // Verify user state after donation
        const userAfter = await User.findById(user._id).session(session);
        console.log("User donation count AFTER:", userAfter?.donationCount);
        console.log("Session committed");
        await session.commitTransaction();
        console.log("Session committed");
        // Log the final response for debugging
        const response = {
            success: true,
            isFirstTimeDonor: isFirstTimeDonor === true,
        };
        console.log("Response sent to client:", response);
        console.log("isFirstTimeDonor type:", typeof isFirstTimeDonor);
        console.log("isFirstTimeDonor value:", isFirstTimeDonor);
        console.log("Response sent to client");
        return success<DonateResponse>(response);
    } catch (err) {
        console.log("Donate error caught");
        await session.abortTransaction();
        console.debug("Donate error:", err);
        if (err instanceof z.ZodError) {
            // Handle validation errors specifically
            const errorMessage = err.errors
                .map((e) => `${e.path.join(".")}: ${e.message}`)
                .join(", ");
            return error(
                `Please check your donation details: ${errorMessage}.${contactSupportMessage}`,
                400
            );
        }
        return error(
            err instanceof Error
                ? `Something went wrong with your donation: ${err.message}.${contactSupportMessage}`
                : `An unexpected error occurred while processing your donation.${contactSupportMessage}`,
            500
        );
    } finally {
        session.endSession();
    }
}

// on vercel, serverless funtions are set to run for 10 seconds by default, but can be increased to up to 30 seconds
// we need to set the maxDuration to 20 seconds to allow for the donation verification and recording to complete
export const maxDuration = 20;
