import { NextRequest } from "next/server";
import { success, error, validateRequest } from "@/lib/api/response";
import { getPaginatedRequests } from "@/lib/db/operations";
import { z } from "zod";
import { PaginatedResponse, Request } from "@/lib/api/types";
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

export async function GET(req: NextRequest) {
    return withDB(async () => {
        try {
            const searchParams = Object.fromEntries(req.nextUrl.searchParams);
            const { page, limit, networkId } = validateRequest<QueryParams>(
                searchParams,
                querySchema.parse
            );

            const result = await getPaginatedRequests(page, limit, networkId);
            return success<PaginatedResponse<Request>>({
                data: result.data,
                total: result.total,
                page,
                limit,
                totalPages: result.totalPages,
            });
        } catch (err) {
            console.debug("Get requests error:", err);
            return error(
                err instanceof Error ? err.message : "Internal server error",
                500
            );
        }
    });
}
