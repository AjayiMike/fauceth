/// <reference types="vite/client" />

/**
 * Represents the assets needed to display and identify a wallet.
 *
 * @type EIP6963ProviderInfo
 * @property uuid - A locally unique identifier for the wallet. MUST be a v4 UUID.
 * @property name - The name of the wallet.
 * @property icon - The icon for the wallet. MUST be data URI.
 * @property rdns - The reverse syntax domain name identifier for the wallet.
 */
type EIP6963ProviderInfo = {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
};

/**
 * @type EIP1193Provider
 * @dev a minimal interface of EIP1193 Provider
 */
type EIP1193Provider = {
    request: (payload: {
        method: string;
        params?: unknown[] | object;
    }) => Promise<unknown>;
};

/**
 * Represents a provider and the information relevant for the dapp.
 *
 * @type EIP6963ProviderDetail
 * @property info - The EIP6963ProviderInfo object.
 * @property provider - The provider instance.
 */
type EIP6963ProviderDetail = {
    info: EIP6963ProviderInfo;
    provider: EIP1193Provider;
};

type EIP6963AnnounceProviderEvent = Event & {
    detail: EIP6963ProviderDetail;
};
