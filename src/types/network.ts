export type INetwork = {
    chainId: number;
    name: string;
    rpc: string[];
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    explorers: Explorer[];
};

export interface ChainFeature {
    name: string;
}

export interface NativeCurrency {
    name: string;
    symbol: string;
    decimals: number;
}

export interface Explorer {
    name: string;
    url: string;
    standard: string;
    icon?: string;
}

export interface ENS {
    registry: string;
}

export interface ChainidNetworkAPIResponseType {
    name: string;
    title?: string;
    status?: string;
    chain: string;
    icon?: string;
    rpc: string[];
    faucets: string[];
    features?: ChainFeature[];
    nativeCurrency: NativeCurrency;
    infoURL: string;
    shortName: string;
    chainId: number;
    networkId: number;
    slip44?: number;
    ens?: ENS;
    explorers?: Explorer[];
}

// If the response is an array of those objects:
export type ChainsResponse = ChainidNetworkAPIResponseType[];
