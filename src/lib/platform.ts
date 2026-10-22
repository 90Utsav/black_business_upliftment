const configuredUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, '');

export function getTelegramBotUrl(): string | null {
  if (!configuredUsername || !/^[A-Za-z0-9_]{5,32}$/.test(configuredUsername)) {
    return null;
  }

  return `https://t.me/${configuredUsername}`;
}

export const backendUrl =
  import.meta.env.VITE_BACKEND_URL?.trim().replace(/\/+$/, '') || 'http://127.0.0.1:8000';

export function isLocalBackendUrl(): boolean {
  try {
    const { hostname } = new URL(backendUrl);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  } catch {
    return false;
  }
}
