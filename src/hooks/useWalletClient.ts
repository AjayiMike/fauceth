import { useConnection } from "@/providers/ConnectionProvider";
import { createWalletClient, custom, Hex } from "viem";
const useWalletClient = () => {
    const { connectedProvider, account } = useConnection();
    if (!connectedProvider || !account) {
        return null;
    }

    const walletClient = createWalletClient({
        account: account as Hex,
        transport: custom(connectedProvider.provider),
    });

    return walletClient;
};

export default useWalletClient;
