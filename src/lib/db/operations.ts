import { IUser, IDonation, IRequest } from "./models";
import { ClientSession } from "mongodb";
import { User, Request, Donation, IpAddress } from "./models";
import { env } from "@/config/env";

export async function checkRateLimitForIpAddress(
    ipAddress: string,
    networkId: number,
    session?: ClientSession
) {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Find latest request using this IP address
    const ipAddressDoc = await IpAddress.findOne({
        address: ipAddress,
    }).session(session || null);

    if (!ipAddressDoc) {
        return { canRequest: true };
    }

    // First check if there's a request for this specific network within the last 24 hours
    const recentNetworkRequest = await Request.findOne({
        ipAddressId: ipAddressDoc._id,
        networkId: networkId,
        createdAt: { $gte: oneDayAgo },
    })
        .sort({ createdAt: -1 })
        .session(session || null);

    if (recentNetworkRequest) {
        return {
            canRequest: false,
            nextAvailableAt: new Date(
                recentNetworkRequest.createdAt.getTime() + 24 * 60 * 60 * 1000
            ),
            reason: "network_specific",
        };
    }

    // Then check if the IP has requested from 3 different networks already
    const distinctNetworks = await Request.distinct("networkId", {
        ipAddressId: ipAddressDoc._id,
        createdAt: { $gte: oneDayAgo },
    }).session(session || null);

    if (distinctNetworks.length >= Number(env.DISTINCT_NETWORK_LIMIT)) {
        // Find earliest request to calculate when a slot will free up
        const earliestRequest = await Request.findOne({
            ipAddressId: ipAddressDoc._id,
            createdAt: { $gte: oneDayAgo },
        })
            .sort({ createdAt: 1 })
            .session(session || null);

        return {
            canRequest: false,
            nextAvailableAt: new Date(
                earliestRequest.createdAt.getTime() + 24 * 60 * 60 * 1000
            ),
            reason: "max_networks",
        };
    }

    return { canRequest: true };
}

export async function checkRateLimitForWalletAddress(
    address: string,
    networkId: number,
    session?: ClientSession
) {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const user = await User.findOne({ address }).session(session || null);

    if (!user) {
        return { canRequest: true };
    }

    // First check if there's a request for this specific network within the last 24 hours
    const recentNetworkRequest = await Request.findOne({
        userId: user._id,
        networkId: networkId,
        createdAt: { $gte: oneDayAgo },
    })
        .sort({ createdAt: -1 })
        .session(session || null);

    if (recentNetworkRequest) {
        return {
            canRequest: false,
            nextAvailableAt: new Date(
                recentNetworkRequest.createdAt.getTime() + 24 * 60 * 60 * 1000
            ),
            reason: "network_specific",
        };
    }

    // Then check if the wallet has requested from 3 different networks already
    const distinctNetworks = await Request.distinct("networkId", {
        userId: user._id,
        createdAt: { $gte: oneDayAgo },
    }).session(session || null);

    if (distinctNetworks.length >= Number(env.DISTINCT_NETWORK_LIMIT)) {
        // Find earliest request to calculate when a slot will free up
        const earliestRequest = await Request.findOne({
            userId: user._id,
            createdAt: { $gte: oneDayAgo },
        })
            .sort({ createdAt: 1 })
            .session(session || null);

        return {
            canRequest: false,
            nextAvailableAt: new Date(
                earliestRequest.createdAt.getTime() + 24 * 60 * 60 * 1000
            ),
            reason: "max_networks",
        };
    }

    return { canRequest: true };
}

export async function checkUserExistsAndDonations(
    address: string,
    session?: ClientSession
): Promise<[boolean, number]> {
    const user = await getUser(address, session);
    return [!!user, user?.totalDonations || 0];
}

export async function getUser(
    address: string,
    session?: ClientSession
): Promise<IUser | null> {
    return User.findOne({ address }).session(session || null);
}

export async function createUser(
    address: string,
    session?: ClientSession
): Promise<IUser> {
    const now = new Date();
    const newUser = await User.create(
        [
            {
                address,
                totalDonations: 0,
                totalRequests: 0,
                donationCount: 0,
                requestCount: 0,
                lastRequestAt: now,
                lastDonationAt: now,
            },
        ],
        { session: session || null }
    );

    return newUser[0];
}

export async function getOrCreateUser(
    address: string,
    session?: ClientSession
): Promise<IUser> {
    const user = await getUser(address, session);
    if (user) return user;
    const newUser = await createUser(address, session);
    return newUser;
}

export async function recordDonation(
    userId: string,
    networkId: number,
    amount: number,
    txHash: string,
    session?: ClientSession
): Promise<IDonation> {
    const donation = await Donation.create(
        [
            {
                userId,
                networkId,
                amount,
                txHash,
            },
        ],
        { session: session || null }
    );

    await User.findByIdAndUpdate(
        userId,
        {
            $inc: {
                totalDonations: amount,
                donationCount: 1,
            },
            $set: { lastDonationAt: new Date() },
        },
        { session: session || null }
    );

    return donation[0];
}

export async function getDonationByNetworkIdAndTxHash(
    networkId: number,
    txHash: string,
    session?: ClientSession
): Promise<IDonation | null> {
    return Donation.findOne({ networkId, txHash }).session(session || null);
}

export async function recordRequest(
    userId: string,
    ipAddressId: string,
    networkId: number,
    amount: number,
    txHash: string,
    session?: ClientSession
): Promise<IRequest> {
    const request = await Request.create(
        [
            {
                userId,
                ipAddressId,
                networkId,
                amount,
                txHash,
            },
        ],
        { session: session || null }
    );

    const now = new Date();

    await Promise.all([
        // Update user record
        User.findByIdAndUpdate(
            userId,
            {
                $inc: {
                    totalRequests: amount,
                    requestCount: 1,
                },
                $set: { lastRequestAt: now },
            },
            { session: session || null }
        ),

        // Update IP address record
        IpAddress.findByIdAndUpdate(
            ipAddressId,
            {
                $inc: { requestCount: 1 },
                $set: { lastSeenAt: now },
            },
            { session: session || null }
        ),
    ]);

    return request[0];
}

export async function getPaginatedRequests(
    page: number,
    limit: number,
    networkId?: number,
    session?: ClientSession
) {
    const query = networkId ? { networkId } : {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        Request.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({
                path: "userId",
                select: "address",
            })
            .session(session || null)
            .exec(),
        Request.countDocuments(query).session(session || null),
    ]);

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

export async function getPaginatedUserRequests(
    address: string,
    page: number,
    limit: number,
    networkId?: number,
    session?: ClientSession
) {
    const user = await User.findOne({ address }).session(session || null);
    if (!user) {
        return {
            data: [],
            total: 0,
            page,
            limit,
            totalPages: 0,
        };
    }

    const query = networkId
        ? { networkId, userId: user._id }
        : { userId: user._id };
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        Request.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({
                path: "userId",
                select: "address",
            })
            .session(session || null)
            .exec(),
        Request.countDocuments(query).session(session || null),
    ]);

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

export async function getPaginatedDonations(
    page: number,
    limit: number,
    networkId?: number,
    session?: ClientSession
) {
    const query = networkId ? { networkId } : {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        Donation.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({
                path: "userId",
                select: "address",
            })
            .session(session || null)
            .exec(),
        Donation.countDocuments(query).session(session || null),
    ]);

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

export async function getPaginatedUserDonations(
    address: string,
    page: number,
    limit: number,
    networkId?: number,
    session?: ClientSession
) {
    const user = await User.findOne({ address }).session(session || null);
    if (!user) {
        return {
            data: [],
            total: 0,
            page,
            limit,
            totalPages: 0,
        };
    }

    const query = networkId
        ? { networkId, userId: user._id }
        : { userId: user._id };
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        Donation.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({
                path: "userId",
                select: "address",
            })
            .session(session || null)
            .exec(),
        Donation.countDocuments(query).session(session || null),
    ]);

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

export async function getOrCreateIpAddress(
    ipAddress: string,
    session?: ClientSession
): Promise<string> {
    const ipRecord = await IpAddress.findOne({ address: ipAddress }).session(
        session || null
    );
    if (ipRecord) return ipRecord._id.toString();

    const now = new Date();
    const [newIpRecord] = await IpAddress.create(
        [
            {
                address: ipAddress,
                lastSeenAt: now,
                requestCount: 0,
            },
        ],
        { session: session || null }
    );

    return newIpRecord._id.toString();
}
