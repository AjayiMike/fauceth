import { FAUCET } from "@/config/abi";
import { getPublicClient, transport } from "@/config/networks";
import { NextRequest, NextResponse } from "next/server";
import { createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

export async function POST(request: NextRequest) {
    try {
        const { address } = await request.json();

        if (!address) {
            return NextResponse.json(
                { error: "Address is required" },
                { status: 400 }
            );
        }

        const results = await getPublicClient().multicall({
            contracts: [
                {
                    address: process.env
                        .NEXT_PUBLIC_FAUCET_ADDRESS as `0x${string}`,
                    abi: FAUCET,
                    functionName: "lastDrip",
                    args: [address],
                },
                {
                    address: process.env
                        .NEXT_PUBLIC_FAUCET_ADDRESS as `0x${string}`,
                    abi: FAUCET,
                    functionName: "cooldownDuration",
                    args: [],
                },
            ],
            multicallAddress: process.env
                .NEXT_PUBLIC_MULTICALL_ADDRESS as `0x${string}`,
        });

        console.log("results: ", results);

        const lastRequestTime = results[0].result;
        const cooldownDuration = results[1].result;

        if (lastRequestTime === undefined || cooldownDuration === undefined) {
            return NextResponse.json(
                {
                    error: "Failed to get last request time or cooldown duration",
                },
                { status: 500 }
            );
        }

        const canRequest =
            lastRequestTime + cooldownDuration < Math.floor(Date.now() / 1000);
        const secondsRemaining = Math.floor(
            (Number(lastRequestTime) +
                Number(cooldownDuration) -
                Math.floor(Date.now() / 1000)) /
                1000
        );

        if (!canRequest) {
            return NextResponse.json(
                {
                    error:
                        "You can request again in " +
                        secondsRemaining +
                        " seconds",
                },
                { status: 400 }
            );
        }

        const account = privateKeyToAccount(
            `0x${process.env.OWNER_PRIVATE_KEY as `0x${string}`}`
        );

        const client = createWalletClient({
            account,
            chain: sepolia,
            transport,
        });

        const txHash = await client.writeContract({
            address: process.env.NEXT_PUBLIC_FAUCET_ADDRESS as `0x${string}`,
            abi: FAUCET,
            functionName: "requestDrip",
            args: [address],
        });

        return NextResponse.json({ txHash });
    } catch (error) {
        console.error("Error requesting tokens", error);
        return NextResponse.json({ error: error }, { status: 500 });
    }
}
