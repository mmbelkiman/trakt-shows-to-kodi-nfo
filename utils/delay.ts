export const DELAY_BETWEEN_REQUESTS_MS = parseInt(process.env.DELAY_BETWEEN_REQUESTS_MS || '1500', 10);

export function delay(ms: number = DELAY_BETWEEN_REQUESTS_MS) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
