import { registerAs } from '@nestjs/config';

export interface AlertmanagerConfig {
  baseUrl?: string;
  authToken?: string;
  cacheTtl: number;
}

function normalizeToken(raw?: string): string | undefined {
  if (!raw) {
    return undefined;
  }

  return raw.startsWith('Bearer ') ? raw : `Bearer ${raw}`;
}

export const alertmanagerConfig = registerAs('alertmanager', (): AlertmanagerConfig => {
  const cacheTtl = Number(process.env.ALERTS_CACHE_TTL ?? '15');

  return {
    baseUrl: process.env.ALERTMANAGER_BASE_URL,
    authToken: normalizeToken(process.env.ALERTMANAGER_AUTH_TOKEN),
    cacheTtl: Number.isFinite(cacheTtl) && cacheTtl > 0 ? cacheTtl : 15
  };
});
