import { connectDB } from "./mongodb";
import mongoose from "mongoose";
import { ClientSession } from "mongodb";
import { NextRequest } from "next/server";

export async function withDB<T>(fn: () => Promise<T>): Promise<T> {
    await connectDB();
    return fn();
}

export async function withTransaction<T>(
    req: NextRequest,
    operation: (session: ClientSession, req: NextRequest) => Promise<T>
): Promise<T> {
    await connectDB();
    const session = await mongoose.startSession();

    try {
        session.startTransaction({
            readConcern: { level: "local" },
            writeConcern: { w: "majority" },
            readPreference: "primary",
            maxCommitTimeMS: 30000, // 30 seconds
        });

        const result = await operation(session, req);

        try {
            await session.commitTransaction();
        } catch (commitError) {
            // If commit fails, try to abort
            try {
                await session.abortTransaction();
            } catch (abortError) {
                console.error("Failed to abort transaction:", abortError);
            }
            throw commitError;
        }

        return result;
    } catch (error) {
        // If the error is not a transaction error, try to abort
        if (
            !(error instanceof Error && "code" in error && error.code === 251)
        ) {
            try {
                if (session.inTransaction()) {
                    await session.abortTransaction();
                }
            } catch (abortError) {
                console.error("Failed to abort transaction:", abortError);
            }
        }
        throw error;
    } finally {
        await session.endSession();
    }
}
