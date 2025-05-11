import { NextRequest } from "next/server";
import { success, error, validateRequest } from "@/lib/api/response";
import { z } from "zod";
import { getAddress } from "viem";
import { User } from "@/lib/db/models/user";

const socialLinksSchema = z.object({
    x: z.string().optional(),
    github: z.string().optional(),
    farcaster: z.string().optional(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { address, ...links } = validateRequest(
            body,
            z.object({
                address: z
                    .string()
                    .regex(
                        /^0x[a-fA-F0-9]{40}$/,
                        "Please provide a valid Ethereum address (starting with 0x followed by 40 hexadecimal characters)"
                    ),
                ...socialLinksSchema.shape,
            }).parse
        );

        console.log("Links:", links);

        const user = await User.findOneAndUpdate(
            { address: getAddress(address) },
            { $set: { socialLinks: links } },
            { new: true }
        );

        if (!user) {
            return error(
                "We couldn't find your user profile. Please make sure you've connected the correct wallet address.",
                404
            );
        }

        return success({ success: true });
    } catch (err) {
        console.error("Social links update error:", err);
        if (err instanceof z.ZodError) {
            // Handle validation errors specifically
            const errorMessage = err.errors
                .map((e) => `${e.path.join(".")}: ${e.message}`)
                .join(", ");
            return error(
                `Please check your social link details: ${errorMessage}`,
                400
            );
        }
        return error(
            err instanceof Error
                ? `Something went wrong while saving your social links: ${err.message}. Please try again.`
                : "An unexpected error occurred while saving your social links. Please try again later.",
            500
        );
    }
}
