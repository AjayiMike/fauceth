export interface RequestFaucetResponse {
    success: boolean;
    txHash?: string;
    error?: string;
}

export interface DonateResponse {
    success: boolean;
    error?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface RateLimitCheckResponse {
    canRequest: boolean;
    nextAvailableAt?: Date;
}

export interface NetworkFaucetState {
    dailyClaimAmount: number;
    faucetBalance: number;
    claimInterval: number;
    networkId: number;
    timestamp: Date;
}

// Application Stats Types
export interface ApplicationStats {
    networkId?: number;
    donationCount: number;
    requestCount: number;
    totalDonations: number;
    totalRequests: number;
    uniqueDonors: number;
    uniqueRequesters: number;
    timestamp: Date;
}

// User Stats Types
export interface UserStats {
    address: string;
    networkId?: number;
    donationCount: number;
    requestCount: number;
    totalDonations: number;
    totalRequests: number;
    timestamp: Date;
}

export enum HealthCheckStatus {
    Healthy = "healthy",
    Degraded = "degraded",
    Down = "down",
}

// Health Check Types
export interface HealthCheckResponse {
    status: HealthCheckStatus;
    timestamp: Date;
}
