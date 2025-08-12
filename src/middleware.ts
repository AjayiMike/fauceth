import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
    const res = NextResponse.next();

    // If we already have a csrf cookie → nothing to do
    if (req.cookies.has("csrf_token")) return res;

    // Generate a CSRF token in the Edge runtime (no Node 'crypto' or 'Buffer')
    const token = crypto.randomUUID().replace(/-/g, ""); // 32-char hex string

    res.cookies.set({
        name: "csrf_token",
        value: token,
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/",
    });

    // duplicate, readable by JS
    res.cookies.set({
        name: "csrf_token_read",
        value: token,
        httpOnly: false,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/",
    });

    return res;
}
