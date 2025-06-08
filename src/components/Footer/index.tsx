import { memo } from "react";

const Footer = () => {
    return (
        <footer className="bg-white shadow-sm py-4 mt-auto">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center">
                    <span className="text-xs md:text-sm text-gray-500">
                        © {new Date().getFullYear()} Fauceth | By the community,
                        for the community
                    </span>
                    <a
                        href="https://github.com/ajayimike/fauceth"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-muted-foreground transition-colors"
                        aria-label="GitHub Repository"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={24}
                            height={24}
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            focusable="false"
                        >
                            <path
                                fill="currentColor"
                                d="M11.963 2.382C.554 2.621-1.82 17.93 8.852 21.602c.498.093.684-.219.684-.478v-1.68c-2.79.601-3.38-1.317-3.38-1.317a2.6 2.6 0 0 0-1.121-1.442c-.902-.612.072-.602.072-.602a2.07 2.07 0 0 1 1.536 1.038a2.167 2.167 0 0 0 2.924.819c.052-.5.275-.965.633-1.317c-2.23-.25-4.564-1.1-4.564-4.875a3.76 3.76 0 0 1 1.038-2.645a3.46 3.46 0 0 1 .103-2.634s.84-.26 2.76 1.037a9.6 9.6 0 0 1 5.02 0c1.908-1.276 2.748-1.038 2.748-1.038c.365.828.398 1.763.093 2.614a3.75 3.75 0 0 1 1.037 2.645c0 3.786-2.344 4.626-4.574 4.865c1.038.55.602 4.086.664 4.522c0 .259.176.57.695.477c10.642-3.64 8.152-18.97-3.257-19.209"
                            ></path>
                        </svg>
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default memo(Footer);
