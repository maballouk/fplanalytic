// Umami event tracking (TASKS.md 1.9). The script only loads when
// NEXT_PUBLIC_UMAMI_WEBSITE_ID is set (Netlify build env), so local dev and
// forks send nothing. track() is a safe no-op when the script is absent.

interface UmamiGlobal {
  track: (event: string, data?: Record<string, string | number>) => void;
}

export function track(event: string, data?: Record<string, string | number>): void {
  if (typeof window === 'undefined') return;
  const umami = (window as unknown as { umami?: UmamiGlobal }).umami;
  umami?.track(event, data);
}
