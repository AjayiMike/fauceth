export interface PassportScoreResponseSchema {
    address: string;
    score: string;
    passing_score: boolean;
    last_score_timestamp: string;
    expiration_timestamp: string | null;
    threshold: string;
    error: string | null;
    stamps: {
        [key: string]: {
            score: string;
            dedup: boolean;
            expiration_date: string;
        };
    };
}
