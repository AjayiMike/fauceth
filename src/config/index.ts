import { AddEthereumChainParams, INetwork } from "@/types/network";

/**
 * @title EIP6963EventNames
 * @dev Enum defining EIP-6963 event names.
 */
export enum EIP6963EventNames {
    Announce = "eip6963:announceProvider",
    Request = "eip6963:requestProvider",
}

/**
 * @title LOCAL_STORAGE_KEYS
 * @dev Object containing local storage keys used in the dApp PREVIOUSLY_CONNECTED_PROVIDER_RDNS is the key under which the rdns of the previously connected provider is stored.
 * @
 */
export const LOCAL_STORAGE_KEYS = {
    PREVIOUSLY_CONNECTED_PROVIDER_RDNS: "PREVIOUSLY_CONNECTED_PROVIDER_RDNS",
};

/**
 * @title isPreviouslyConnectedProvider
 * @dev Function to check if a provider was previously connected by comparing its rdns to the rdns previously store in the local storage the last time a connection was made.
 * @param providerRDNS The provider RDNS string.
 * @returns True if the providerRDNS matches the rdns found in the local storage.
 */
export function isPreviouslyConnectedProvider(providerRDNS: string): boolean {
    return (
        localStorage.getItem(
            LOCAL_STORAGE_KEYS.PREVIOUSLY_CONNECTED_PROVIDER_RDNS
        ) === providerRDNS
    );
}

export const formatChainInfoToAddEthereumChainParams = (
    chainInfo: INetwork
): AddEthereumChainParams => {
    return {
        chainId: `0x${chainInfo.chainId.toString(16)}`,
        chainName: chainInfo.name,
        nativeCurrency: chainInfo.nativeCurrency,
        rpcUrls: chainInfo.rpc,
        blockExplorerUrls: chainInfo.explorers?.map((explorer) => explorer.url),
    };
};

/**
 * @title switchChain
 * @dev Function to switch to a supported chain.
 * @param chain The chain ID to switch to.
 * @param provider The EIP1193Provider instance.
 */
export const switchChain = async (
    chainInfo: INetwork,
    provider: EIP1193Provider
) => {
    try {
        await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${chainInfo.chainId.toString(16)}` }],
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.debug("error switching chain: ", error);
        if (error.code === 4902 || error.code === -32603) {
            try {
                const _chainInfo =
                    formatChainInfoToAddEthereumChainParams(chainInfo);
                await provider.request({
                    method: "wallet_addEthereumChain",
                    params: [_chainInfo],
                });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (_error: any) {
                console.debug("user rejected network addition: ", _error);
            }
        }
    }
};
