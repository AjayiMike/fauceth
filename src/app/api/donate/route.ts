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
    getETHBalance,
    getNetworkInfo,
    getTransaction,
    isMatchingAddress,
} from "@/lib/networks";
import { DonateResponse } from "@/lib/api/types";
import { env } from "@/config/env";
import { withTransaction } from "@/lib/db/with-db";
import { ClientSession } from "mongodb";

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

export const POST = async (req: NextRequest) =>
    withTransaction(req, async (session: ClientSession, req: NextRequest) => {
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
                return error(
                    `This transaction has already been recorded as a donation. Please use a different transaction.${contactSupportMessage}`,
                    400
                );
            }

            // fetch network details
            const networkDetails = await getNetworkInfo(networkId);
            if (!networkDetails.rpc.length) {
                return error(
                    `The network (ID: ${networkId}) is not supported or lacks RPC configuration. Please try a different network.${contactSupportMessage}`,
                    400
                );
            }

            // filter working RPCs
            const { urls: workingRPCURLs } = await getETHBalance(
                env.FAUCET_ADDRESS as `0x${string}`,
                networkDetails.rpc
            );
            if (workingRPCURLs.length === 0) {
                return error(
                    `Network connectivity issue with ${networkDetails.name}. We're unable to verify your transaction at this time. Please try again later.${contactSupportMessage}`,
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
                return error(
                    `The transaction was reverted or failed on the blockchain. Please provide a successful transaction.${contactSupportMessage}`,
                    400
                );
            }

            // verify transaction is to faucet
            if (
                !tx.to ||
                !isMatchingAddress(tx.to, env.FAUCET_ADDRESS as Address)
            ) {
                return error(
                    `This transaction wasn't sent to our faucet address (${env.FAUCET_ADDRESS}). Please use a transaction that was sent to our faucet.${contactSupportMessage}`,
                    400
                );
            }

            // verify transaction value is not 0
            if (BigInt(tx.value) === BigInt(0)) {
                return error(
                    `The transaction didn't include any ETH. Please provide a transaction that sends ETH to our faucet.${contactSupportMessage}`,
                    400
                );
            }

            // get or create user
            const user = await getOrCreateUser(getAddress(tx.from), session);

            // Check if this is the user's first donation - must check BEFORE recordDonation
            const isFirstTimeDonor = user.donationCount === 0;

            // record donation
            await recordDonation(
                user._id.toString(),
                networkId,
                Number(
                    formatUnits(
                        tx.value,
                        networkDetails.nativeCurrency.decimals
                    )
                ),
                checksummedTxHash,
                session
            );

            // Log the final response for debugging
            const response = {
                success: true,
                isFirstTimeDonor: isFirstTimeDonor === true,
            };

            return success<DonateResponse>(response);
        } catch (err) {
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
        }
    });

// on vercel, serverless funtions are set to run for 10 seconds by default, but can be increased to up to 30 seconds
// we need to set the maxDuration to 20 seconds to allow for the donation verification and recording to complete
export const maxDuration = 20;
