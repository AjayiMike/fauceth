import { NextRequest } from "next/server";
import { success, error, validateRequest } from "@/lib/api/response";
import { z } from "zod";
import { getAddress } from "viem";
import { User } from "@/lib/db/models/user";

const socialLinksSchema = z.object({
    twitter: z.string().optional(),
    github: z.string().optional(),
    linkedin: z.string().optional(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { address, ...links } = validateRequest(
            body,
            z.object({
                address: z.string(),
                ...socialLinksSchema.shape,
            }).parse
        );

        const user = await User.findOneAndUpdate(
            { address: getAddress(address) },
            { $set: { socialLinks: links } },
            { new: true }
        );

        if (!user) {
            return error("User not found", 404);
        }

        return success({ success: true });
    } catch (err) {
        console.error("Social links update error:", err);
        return error(
            err instanceof Error ? err.message : "Internal server error",
            500
        );
    }
}
