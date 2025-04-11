import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function success<T>(data: T) {
    return NextResponse.json({ success: true, data });
}

export function error(message: string, status = 400) {
    return NextResponse.json({ success: false, error: message }, { status });
}

export function validateRequest<T>(
    body: unknown,
    schema: (data: unknown) => T
): T {
    try {
        return schema(body);
    } catch (error) {
        if (error instanceof ZodError) {
            const messages = error.errors.map(
                (err) => `${err.path.join(".")}: ${err.message}`
            );
            throw new Error(`Validation error: ${messages.join(", ")}`);
        }
        throw error;
    }
}

export function validateQueryParams<T>(
    searchParams: URLSearchParams,
    schema: (data: unknown) => T
): T {
    const params = Object.fromEntries(searchParams);
    return validateRequest(params, schema);
}
