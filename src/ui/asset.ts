/** URL of a built asset under public/assets (pnpm art:build). */
export const asset = (p: string): string => `${import.meta.env.BASE_URL}assets/${p}`;