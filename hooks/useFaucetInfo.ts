import { FAUCET } from "@/config/abi";
import { getPublicClient } from "@/config/networks";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";

export const useFaucetInfo = (account?: Address) => {
    const publicClient = getPublicClient();
    const getData = async () => {
        try {
            const data = await publicClient.multicall({
                contracts: [
                    {
                        abi: FAUCET,
                        address: process.env
                            .NEXT_PUBLIC_FAUCET_ADDRESS as Address,
                        functionName: "cooldownDuration",
                        args: [],
                    },
                    {
                        abi: FAUCET,
                        address: process.env
                            .NEXT_PUBLIC_FAUCET_ADDRESS as Address,
                        functionName: "dropAmount",
                        args: [],
                    },
                    {
                        abi: FAUCET,
                        address: process.env
                            .NEXT_PUBLIC_FAUCET_ADDRESS as Address,
                        functionName: "getBalance",
                        args: [],
                    },
                    {
                        abi: FAUCET,
                        address: process.env
                            .NEXT_PUBLIC_FAUCET_ADDRESS as Address,
                        functionName: "lastDrip",
                        args: [account as Address],
                    },
                ],
                multicallAddress: process.env
                    .NEXT_PUBLIC_MULTICALL_ADDRESS as Address,
                allowFailure: true,
            });

            return {
                cooldownDuration: data[0].result,
                dropAmount: data[1].result,
                balance: data[2].result,
                lastDrip: data[3].result,
            };
        } catch (error) {
            console.error(error);
        }
    };

    return useQuery({
        queryKey: ["faucetInfo", account],
        queryFn: getData,
    });
};
