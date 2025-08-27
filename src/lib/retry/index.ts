// Configuration constants
const CONFIG = {
    MAX_RETRIES: 2,
    RETRY_DELAY: 1000, // milliseconds
} as const;

export const retry = async <T>(
    operation: () => Promise<T>,
    errorMessage: string
): Promise<T> => {
    let attempts = 0;
    while (attempts < CONFIG.MAX_RETRIES) {
        try {
            return await operation();
        } catch (error) {
            attempts++;
            console.debug(
                `${errorMessage} - Attempt ${attempts}: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
            if (attempts === CONFIG.MAX_RETRIES) throw error;
            await new Promise((resolve) =>
                setTimeout(resolve, CONFIG.RETRY_DELAY)
            );
        }
    }
    throw new Error("Retry failed");
};
