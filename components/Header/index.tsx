import Account from "../Account";
import Image from "next/image";
import Link from "next/link";

const Header = () => {
    return (
        <header className="bg-white shadow-sm py-4 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <Link href="/" className="cursor-pointer">
                            <Image
                                src="/faucet.svg"
                                alt="logo"
                                width={32}
                                height={32}
                                className="w-8 h-8"
                            />
                        </Link>
                    </div>
                    <div className="flex items-center">
                        <Account />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
