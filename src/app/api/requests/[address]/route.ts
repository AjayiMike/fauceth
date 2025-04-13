import { z } from "zod";
import { NextRequest } from "next/server";
import { success, error, validateRequest } from "@/lib/api/response";
import { getPaginatedUserRequests } from "@/lib/db/operations";
import { getAddress } from "viem";
import { Request } from "@/lib/db/models/types";
import { PaginatedResponse } from "@/lib/api/types";
import { withDB } from "@/lib/db/with-db";

const querySchema = z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()),
    limit: z
        .string()
        .transform(Number)
        .pipe(z.number().int().positive().max(100)),
    networkId: z
        .string()
        .transform(Number)
        .pipe(z.number().int().positive())
        .optional(),
});

type QueryParams = z.infer<typeof querySchema>;

export async function GET(
    req: NextRequest,
    { params }: { params: { address: string } }
) {
    return withDB(async () => {
        try {
            const searchParams = Object.fromEntries(req.nextUrl.searchParams);
            const { page, limit, networkId } = validateRequest<QueryParams>(
                searchParams,
                querySchema.parse
            );

            // Validate address parameter
            const address = params.address;
            if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
                return error("Invalid Ethereum address", 400);
            }

            const checkSummedAddress = getAddress(address);

            const result = await getPaginatedUserRequests(
                checkSummedAddress,
                page,
                limit,
                networkId
            );

            return success<PaginatedResponse<Request>>({
                data: result.data,
                total: result.total,
                page,
                limit,
                totalPages: result.totalPages,
            });
        } catch (err) {
            console.debug("Get user requests error:", err);
            return error(
                err instanceof Error ? err.message : "Internal server error",
                500
            );
        }
    });
}
