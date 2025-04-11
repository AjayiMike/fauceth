import { createPublicClient, fallback, http, PublicClient } from "viem";
import { sepolia } from "viem/chains";

export const transport = fallback([
    http("https://ethereum-sepolia-rpc.publicnode.com"),
    http("https://eth-sepolia.public.blastapi.io"),
    http("https://endpoints.omniatech.io/v1/eth/sepolia/public"),
    http("https://0xrpc.io/sepolia"),
    http("https://api.zan.top/eth-sepolia"),
    http("https://gateway.tenderly.co/public/sepolia"),
]);

let publicClients: PublicClient;

export const getPublicClient = () => {
    if (!publicClients) {
        publicClients = createPublicClient({
            chain: sepolia,
            transport: transport,
        });
    }
    return publicClients;
};

export const TESTNET_KEYWORDS = [
    "test",
    "devnet",
    "sepolia",
    "goerli",
    "ropsten",
    "holesky",
];
