import mongoose from "mongoose";
import { User, IpAddress, Donation, Request } from "./models";
import { env } from "@/config/env";

if (!env.MONGODB_URI) {
    throw new Error(
        "Please define the MONGODB_URI environment variable inside .env(.*) file"
    );
}

let isConnected = false;

export async function connectDB() {
    if (isConnected) {
        return;
    }

    try {
        await mongoose.connect(env.MONGODB_URI!, {
            dbName: env.DB_NAME,
        });

        isConnected = true;
        console.log("Connected to MongoDB");

        // Create indexes
        await Promise.all([
            User.createIndexes(),
            Donation.createIndexes(),
            Request.createIndexes(),
            IpAddress.createIndexes(),
        ]);
    } catch (error) {
        console.debug("MongoDB connection error:", error);
        throw error;
    }
}

// Handle connection errors after initial connection
mongoose.connection.on("error", (err) => {
    console.debug("MongoDB connection error:", err);
    isConnected = false;
});

mongoose.connection.on("disconnected", () => {
    console.log("MongoDB disconnected");
    isConnected = false;
});

// Handle process termination
process.on("SIGINT", async () => {
    try {
        await mongoose.connection.close();
        console.log("MongoDB connection closed through app termination");
        process.exit(0);
    } catch (err) {
        console.debug("Error closing MongoDB connection:", err);
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
