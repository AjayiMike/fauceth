export const verifyHCaptcha = async (
    token: string,
    hCaptchaSecret: string,
    hCaptchaSiteKey: string,
    remoteip: string
): Promise<{ success: boolean; message?: string; errorCode?: string }> => {
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

        const data = await hcaptchaResponse.json();

        if (data.success) {
            return { success: true };
        } else {
            // Token is invalid or other error
            console.warn("hCaptcha verification failed:", data["error-codes"]);
            return {
                success: false,
                message: "hCaptcha verification failed",
                errorCode: data["error-codes"],
            };
        }
    } catch (error) {
        console.debug("hCaptcha verification error:", error);
        return { success: false, message: "Verification failed" };
    }
};
