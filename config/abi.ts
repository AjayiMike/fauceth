export const FAUCET = [
    {
        inputs: [
            { internalType: "uint256", name: "_dropAmount", type: "uint256" },
            {
                internalType: "uint256",
                name: "_cooldownDuration",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "_ownerMinBalance",
                type: "uint256",
            },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
    },
    {
        inputs: [{ internalType: "address", name: "owner", type: "address" }],
        name: "OwnableInvalidOwner",
        type: "error",
    },
    {
        inputs: [{ internalType: "address", name: "account", type: "address" }],
        name: "OwnableUnauthorizedAccount",
        type: "error",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint256",
                name: "previousDuration",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "newDuration",
                type: "uint256",
            },
        ],
        name: "CooldownDurationChanged",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "donor",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
        ],
        name: "Donation",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "recipient",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
        ],
        name: "Drip",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint256",
                name: "previousAmount",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "newAmount",
                type: "uint256",
            },
        ],
        name: "DropAmountChanged",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint256",
                name: "previousMinBalance",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "newMinBalance",
                type: "uint256",
            },
        ],
        name: "OwnerMinBalanceChanged",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
        ],
        name: "OwnerTopUp",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "previousOwner",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "newOwner",
                type: "address",
            },
        ],
        name: "OwnershipTransferred",
        type: "event",
    },
    {
        inputs: [],
        name: "cooldownDuration",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "donate",
        outputs: [],
        stateMutability: "payable",
        type: "function",
    },
    {
        inputs: [],
        name: "dropAmount",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "getBalance",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "address", name: "", type: "address" }],
        name: "lastDrip",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "owner",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "ownerMinBalance",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "renounceOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { internalType: "address", name: "_recipient", type: "address" },
        ],
        name: "requestDrip",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_newCooldownDuration",
                type: "uint256",
            },
        ],
        name: "setCooldownDuration",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_newDropAmount",
                type: "uint256",
            },
        ],
        name: "setDropAmount",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_newMinBalance",
                type: "uint256",
            },
        ],
        name: "setOwnerMinBalance",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { internalType: "address", name: "_address", type: "address" },
        ],
        name: "timeUntilNextDrip",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { internalType: "address", name: "newOwner", type: "address" },
        ],
        name: "transferOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "withdrawAll",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    { stateMutability: "payable", type: "receive" },
] as const;
