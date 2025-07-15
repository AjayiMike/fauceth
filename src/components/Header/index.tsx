import Image from "../Image";
import Link from "next/link";
import NetworkDropdown from "../NetworkDropdown";
import ToggleThemeMode from "../ToggleThemeMode";

const Header = () => {
    return (
        <header className="bg-background shadow-sm py-4 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <Link href="/" className="cursor-pointer">
                            <Image
                                alt="FaucETH logo"
                                width={32}
                                height={32}
                                className="w-8 h-8"
                            />
                        </Link>
                    </div>
                    <div className="flex align-center items-center  space-x-4">
                        <ToggleThemeMode />
                        <NetworkDropdown />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
