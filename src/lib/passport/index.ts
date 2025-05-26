import { env } from "@/config/env";
import { PassportScoreResponseSchema } from "./types";

export async function getPassportScore(
    address: string
): Promise<[boolean, number]> {
    const response = await fetch(
        `${env.PASSPORT_API_BASE_URL}/v2/stamps/${env.PASSPORT_SCORER_ID}/score/${address}`,
        {
            headers: {
                "X-API-Key": env.PASSPORT_API_KEY as string,
            },
        }
    );
    const data: PassportScoreResponseSchema = await response.json();
    const score = parseFloat(data.score);
    const threshold = parseFloat(env.PASSPORT_SCORE_THRESHOLD || "0");
    return [score >= threshold, score];
}
