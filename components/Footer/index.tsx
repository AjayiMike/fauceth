const Footer = () => {
    return (
        <footer className="bg-white shadow-sm py-4 mt-auto">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                        © {new Date().getFullYear()} Faucet App
                    </span>
                    <a
                        href="https://github.com/ajayimike/faucet-app"
                        className="text-blue-500 cursor-pointer"
                    >
                        source code
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
