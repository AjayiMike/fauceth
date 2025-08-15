const getEnvValue = (
    key: string,
    value?: string,
    required: boolean = true,
    fallback?: string
) => {
    if (typeof value === "undefined") {
        if (required) {
            throw new Error(`Missing env variable for: ${key}`);
        } else {
            return fallback;
        }
    } else {
        return value;
    }
};

export const env = {
    MONGODB_URI: getEnvValue("MONGODB_URI", process.env.MONGODB_URI, false),
    DB_NAME: getEnvValue("DB_NAME", process.env.DB_NAME, false),
    FAUCET_PK: getEnvValue(
        "FAUCET_PRIVATE_KEY",
        process.env.FAUCET_PRIVATE_KEY,
        false
    ),
    PASSPORT_API_BASE_URL: getEnvValue(
        "PASSPORT_API_BASE_URL",
        process.env.PASSPORT_API_BASE_URL,
        false
    ),
    PASSPORT_API_KEY: getEnvValue(
        "PASSPORT_API_KEY",
        process.env.PASSPORT_API_KEY,
        false
    ),
    PASSPORT_SCORER_ID: getEnvValue(
        "PASSPORT_SCORER_ID",
        process.env.PASSPORT_SCORER_ID,
        false
    ),
    PASSPORT_SCORE_THRESHOLD: getEnvValue(
        "PASSPORT_SCORE_THRESHOLD",
        process.env.PASSPORT_SCORE_THRESHOLD,
        false
    ),
    HCAPTCHA_SECRET: getEnvValue(
        "HCAPTCHA_SECRET",
        process.env.HCAPTCHA_SECRET,
        false
    ),

    FAUCET_ADDRESS: getEnvValue(
        "NEXT_PUBLIC_FAUCET_ADDRESS",
        process.env.NEXT_PUBLIC_FAUCET_ADDRESS
    ),
    WALLET_CONNECT_PROJECT_ID: getEnvValue(
        "NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID",
        process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
    ),
    MAX_CLAIM: getEnvValue(
        "NEXT_PUBLIC_MAX_CLAIM",
        process.env.NEXT_PUBLIC_MAX_CLAIM
    ),
    MIN_BALANCE: getEnvValue(
        "NEXT_PUBLIC_MIN_BALANCE",
        process.env.NEXT_PUBLIC_MIN_BALANCE
    ),
    WARNING_BALANCE: getEnvValue(
        "NEXT_PUBLIC_WARNING_BALANCE",
        process.env.NEXT_PUBLIC_WARNING_BALANCE
    ),
    OPTIMAL_BALANCE: getEnvValue(
        "NEXT_PUBLIC_OPTIMAL_BALANCE",
        process.env.NEXT_PUBLIC_OPTIMAL_BALANCE
    ),
    MIN_DONATION_REQUIRED_FOR_VERIFICATION: getEnvValue(
        "NEXT_PUBLIC_MIN_DONATION_REQUIRED_FOR_VERIFICATION",
        process.env.NEXT_PUBLIC_MIN_DONATION_REQUIRED_FOR_VERIFICATION
    ),
    HCAPTCHA_SITE_KEY: getEnvValue(
        "NEXT_PUBLIC_HCAPTCHA_SITE_KEY",
        process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY
    ),
    DISTINCT_NETWORK_LIMIT: getEnvValue(
        "NEXT_PUBLIC_DISTINCT_NETWORK_LIMIT",
        process.env.NEXT_PUBLIC_DISTINCT_NETWORK_LIMIT || "2"
    ),

    NEXT_PUBLIC_MAX_ALLOWED_BALANCE: getEnvValue(
        "NEXT_PUBLIC_MAX_ALLOWED_BALANCE",
        process.env.NEXT_PUBLIC_MAX_ALLOWED_BALANCE,
        false, //set required to false since there's a default value
        "2"
    ),
};
