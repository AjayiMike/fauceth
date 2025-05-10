import { Button } from "../../ui/button";
import Image from "next/image";

const WalletButton: React.FC<{
    handleConnect: (walletDetails: EIP6963ProviderDetail) => void;
    walletDetails: EIP6963ProviderDetail;
    isConneted?: boolean;
}> = ({ walletDetails, handleConnect, isConneted }) => {
    return (
        <Button
            onClick={() => handleConnect(walletDetails)}
            className="flex"
            disabled={isConneted}
        >
            <Image
                width={20}
                height={20}
                className="w-5 h-5 rounded cursor-pointer"
                src={walletDetails.info.icon.trim()}
                alt={walletDetails.info.name}
            />
            <span>{walletDetails.info.name}</span>
        </Button>
    );
};

export default WalletButton;
