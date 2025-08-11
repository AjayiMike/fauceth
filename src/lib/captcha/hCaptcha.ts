interface HCaptchaVerifyResponse {
    success: boolean;
    challenge_ts?: string;
    hostname?: string;
    credit?: boolean;
    "error-codes"?: string[];
    score?: number;
    score_reason?: string[];
}

// Store used tokens to prevent reuse
const usedTokens = new Set<string>();

export const verifyHCaptcha = async (
    token: string,
    hCaptchaSecret: string,
    hCaptchaSiteKey: string,
    remoteip: string,
    expectedHostname?: string
): Promise<{
    success: boolean;
    message?: string;
    errorCode?: string;
    hostname?: string;
}> => {
    // Check if token has already been used
    if (usedTokens.has(token)) {
        console.warn("hCaptcha token reuse detected");
        return {
            success: false,
            message: "Token has already been used",
            errorCode: "token-reuse",
        };
    }

    const params = new URLSearchParams();
    params.append("secret", hCaptchaSecret);
    params.append("response", token);
    params.append("remoteip", remoteip);
    params.append("sitekey", hCaptchaSiteKey);

    try {
        const hcaptchaResponse = await fetch(
            "https://api.hcaptcha.com/siteverify",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params.toString(),
            }
        );

        const data = (await hcaptchaResponse.json()) as HCaptchaVerifyResponse;

        if (data.success) {
            // Verify hostname if expected hostname is provided
            if (
                expectedHostname &&
                data.hostname &&
                data.hostname !== expectedHostname
            ) {
                console.warn(
                    `hCaptcha hostname mismatch: expected ${expectedHostname}, got ${data.hostname}`
                );
                return {
                    success: false,
                    message: "Hostname verification failed",
                    errorCode: "hostname-mismatch",
                    hostname: data.hostname,
                };
            }

            // Add token to used tokens set to prevent reuse
            usedTokens.add(token);

            // Implement token cleanup to prevent memory leaks
            // Remove tokens after 10 minutes (hCaptcha tokens typically expire after 2 minutes)
            setTimeout(
                () => {
                    usedTokens.delete(token);
                },
                10 * 60 * 1000
            );

            return {
                success: true,
                hostname: data.hostname,
            };
        } else {
            // Token is invalid or other error
            console.warn("hCaptcha verification failed:", data["error-codes"]);
            return {
                success: false,
                message: "hCaptcha verification failed",
                errorCode: data["error-codes"]?.join(", "),
                hostname: data.hostname,
            };
        }
    } catch (error) {
        console.debug("hCaptcha verification error:", error);
        return { success: false, message: "Verification failed" };
    }
};
