import { cookies } from "next/headers";
import Cookies from "js-cookie";
import { NextResponse, type NextRequest } from "next/server";

export async function validateCsrf(
    req: NextRequest
): Promise<NextResponse | null> {
    if (req.method === "GET" || req.method === "HEAD") return null; // safe methods

    const tokenCookie = (await cookies()).get("csrf_token")?.value;
    const tokenHeader = req.headers.get("x-csrf-token");

    if (!tokenCookie || tokenCookie !== tokenHeader) {
        return NextResponse.json(
            { error: "Invalid CSRF token" },
            { status: 403 }
        );
    }
    return null; // validated
}

export const getCsrfToken = () => Cookies.get("csrf_token_read") || "";
