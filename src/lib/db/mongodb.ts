import mongoose from "mongoose";
import { User, IpAddress, Donation, Request } from "./models";
import { env } from "@/config/env";

if (!env.MONGODB_URI) {
    throw new Error(
        "Please define the MONGODB_URI environment variable inside .env(.*) file"
    );
}

// A global promise to ensure we only connect once during an invocation
let mongooseConnectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDB() {
    // If the connection is already established, reuse it
    if (mongoose.connection.readyState === 1) {
        return;
    }

    // If we've already started connecting, wait for that promise to resolve
    if (mongooseConnectionPromise) {
        await mongooseConnectionPromise;
        return;
    }

    try {
        mongooseConnectionPromise = mongoose.connect(env.MONGODB_URI!, {
            dbName: env.DB_NAME,
            bufferCommands: false, // Disable Mongoose's buffering. Fails fast if not connected.
        });

        await mongooseConnectionPromise;
        console.log("Connected to MongoDB");

        // Create indexes - this is generally fine as Mongoose won't recreate them if they exist
        await Promise.all([
            User.createIndexes(),
            Donation.createIndexes(),
            Request.createIndexes(),
            IpAddress.createIndexes(),
        ]);
    } catch (error) {
        console.debug("MongoDB connection error:", error);
        // Reset the promise on error so we can try again
        mongooseConnectionPromise = null;
        throw error;
    }
}

// Handle process termination gracefully
process.on("SIGINT", async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log(
                "MongoDB connection closed successfully due to app termination"
            );
        }
        process.exit(0);
    } catch (err) {
        console.error("Error closing MongoDB connection:", err);
        process.exit(1);
    }
});

// Export collections
export const collections = {
    users: User,
    ipAddresses: IpAddress,
    donations: Donation,
    requests: Request,
} as const;
