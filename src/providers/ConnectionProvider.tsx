"use client";

import {
    EIP6963EventNames,
    isPreviouslyConnectedProvider,
    LOCAL_STORAGE_KEYS,
    switchChain,
} from "@/config";
import { useNetworksStore } from "@/lib/store/networksStore";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

type StateType = {
    isConnected: boolean;
    account?: string;
    chainId?: number;
    connectedProvider?: EIP6963ProviderDetail;
    availableProviders?: EIP6963ProviderDetail[];
    handleConnect: (provider: EIP6963ProviderDetail) => Promise<void>;
    handleSwitchChain: (chainId: number) => Promise<void>;
    handleDisconnect: () => Promise<void>;
    isSupportedChain: (chainId: number) => boolean;
};

const ConnectionContext = createContext<StateType | undefined>(undefined);

export const ConnectionProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    /**
     * @title injectedProviders
     * @dev State variable to store injected providers we have recieved from the extension as a map.
     */
    const [injectedProviders, setInjectedProviders] = useState<
        Map<string, EIP6963ProviderDetail>
    >(new Map());

    /**
     * @title connection
     * @dev State variable to store connection information.
     */
    const [connection, setConnection] = useState<{
        providerUUID: string;
        accounts: string[];
        chainId: number;
    } | null>(null);

    const { networks } = useNetworksStore();

    const isSupportedChain = useCallback(
        (chainId: number) => {
            return networks.some((network) => network.chainId === chainId);
        },
        [networks]
    );

    async function handleConnect(
        selectedProviderDetails: EIP6963ProviderDetail
    ) {
        const { provider, info } = selectedProviderDetails;
        try {
            const accounts = (await provider.request({
                method: "eth_requestAccounts",
            })) as string[];
            const chainId = await provider.request({ method: "eth_chainId" });
            setConnection({
                providerUUID: info.uuid,
                accounts,
                chainId: Number(chainId),
            });
            localStorage.setItem(
                LOCAL_STORAGE_KEYS.PREVIOUSLY_CONNECTED_PROVIDER_RDNS,
                info.rdns
            );
        } catch (error) {
            console.debug(error);
        }
    }

    /**
     * @title handleSwitchChain
     * @dev Function to handle switching the chain.
     */
    const handleSwitchChain = async (chainId: number) => {
        try {
            if (!connection) return;
            const provider = injectedProviders.get(
                connection.providerUUID
            )!.provider;

            if (!isSupportedChain(chainId))
                throw new Error("attempt to switch to a wrong chain!");

            await switchChain(
                networks.find((network) => network.chainId === chainId)!,
                provider
            );
        } catch (error) {
            console.debug(error);
        }
    };

    /**
     * @title handleDisconnect
     * @dev Function to handle disconnecting from the provider.
     */
    const handleDisconnect = async () => {
        try {
            if (!connection) return;
            const provider = injectedProviders.get(
                connection!.providerUUID
            )!.provider;
            await provider.request({
                method: "wallet_revokePermissions",
                params: [
                    {
                        eth_accounts: {},
                    },
                ],
            });
            setConnection(null);
            localStorage.removeItem(
                LOCAL_STORAGE_KEYS.PREVIOUSLY_CONNECTED_PROVIDER_RDNS
            );
        } catch (error) {
            console.debug(error);
        }
    };

    const handleAccountsChanged = useCallback(
        (accounts: string[]) => {
            if (!connection) return;
            if (connection.accounts[0] !== accounts[0]) {
                setConnection({
                    ...connection,
                    accounts,
                });
            }
        },
        [connection]
    );

    const handleChainChanged = useCallback(
        (chainId: string) => {
            if (!connection) return;
            if (connection.chainId !== Number(chainId)) {
                setConnection({
                    ...connection,
                    chainId: Number(chainId),
                });
            }
        },
        [connection]
    );

    useEffect(() => {
        /**
         * @title onAnnounceProvider
         * @dev Event listener for EIP-6963 announce provider event.
         * @param event The announce provider event.
         */
        const onAnnounceProvider = (event: EIP6963AnnounceProviderEvent) => {
            const { icon, rdns, uuid, name } = event.detail.info;

            if (!icon || !rdns || !uuid || !name) {
                console.debug("invalid eip6963 provider info received!");
                return;
            }
            setInjectedProviders((prevProviders) => {
                const providers = new Map(prevProviders);
                providers.set(uuid, event.detail);
                return providers;
            });

            // This ensures that on page reload, the provider that was previously connected is automatically connected again.
            // It help prevent the need to manually reconnect again when the page reloads
            if (isPreviouslyConnectedProvider(rdns)) {
                handleConnect(event.detail);
            }
        };

        // Add event listener for EIP-6963 announce provider event
        window.addEventListener(
            EIP6963EventNames.Announce,
            onAnnounceProvider as EventListener
        );

        // Dispatch the request for EIP-6963 provider
        window.dispatchEvent(new Event(EIP6963EventNames.Request));

        // Clean up by removing the event listener and resetting injected providers
        return () => {
            window.removeEventListener(
                EIP6963EventNames.Announce,
                onAnnounceProvider as EventListener
            );
            setInjectedProviders(new Map());
        };
    }, []);

    useEffect(() => {}, [connection]);

    const connectedInjectectProvider =
        connection && injectedProviders.get(connection.providerUUID);

    useEffect(() => {
        if (!connectedInjectectProvider) return;
        connectedInjectectProvider.provider.on?.(
            "accountsChanged",
            (accounts) => {
                handleAccountsChanged(accounts);
            }
        );
        connectedInjectectProvider.provider.on?.("chainChanged", (chainId) => {
            handleChainChanged(chainId);
        });

        return () => {
            connectedInjectectProvider.provider.removeListener?.(
                "accountsChanged",
                handleAccountsChanged
            );
            connectedInjectectProvider.provider.removeListener?.(
                "chainChanged",
                handleChainChanged
            );
        };
    }, [connectedInjectectProvider, handleAccountsChanged, handleChainChanged]);

    return (
        <ConnectionContext.Provider
            value={{
                isConnected: !!connection,
                account: connection?.accounts[0],
                chainId: connection?.chainId,
                connectedProvider: connection?.providerUUID
                    ? injectedProviders.get(connection.providerUUID)
                    : undefined,
                availableProviders: Array.from(injectedProviders.values()),
                handleConnect,
                handleSwitchChain,
                handleDisconnect,
                isSupportedChain,
            }}
        >
            {children}
        </ConnectionContext.Provider>
    );
};

export function useConnection() {
    const store = useContext(ConnectionContext);
    if (!store) {
        throw new Error(
            "useConnectionStore must be used within a ConnectionProvider"
        );
    }
    return store;
}
