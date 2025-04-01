"use client";

import { useConnection } from "@/providers/ConnectionProvider";
import WalletModal from "../WalletModal";
import { ConnectedAccount } from "./ConnectedAccount";

const Account = () => {
    const { isConnected } = useConnection();
    return isConnected ? <ConnectedAccount /> : <WalletModal />;
};

export default Account;
