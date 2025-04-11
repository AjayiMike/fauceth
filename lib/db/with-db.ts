import { connectDB } from "./mongodb";
import mongoose from "mongoose";

export async function withDB<T>(fn: () => Promise<T>): Promise<T> {
    await connectDB();
    return fn();
}

export async function withTransaction<T>(
    fn: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> {
    await connectDB();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const result = await fn(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}
