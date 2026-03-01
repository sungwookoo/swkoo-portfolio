import { registerAs } from '@nestjs/config';

export interface PipelinesConfig {
  baseUrl?: string;
  authToken?: string;
  username?: string;
  password?: string;
  projects: string[];
  cacheTtl: number;
}

function parseProjects(raw?: string): string[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizeToken(raw?: string): string | undefined {
  if (!raw) {
    return undefined;
  }

  return raw.startsWith('Bearer ') ? raw : `Bearer ${raw}`;
}

export const pipelinesConfig = registerAs('pipelines', (): PipelinesConfig => {
  const cacheTtl = Number(process.env.PIPELINES_CACHE_TTL ?? '15');

  return {
    baseUrl: process.env.ARGOCD_BASE_URL,
    authToken: normalizeToken(process.env.ARGOCD_AUTH_TOKEN),
    username: process.env.ARGOCD_USERNAME,
    password: process.env.ARGOCD_PASSWORD,
    projects: parseProjects(process.env.ARGOCD_PROJECTS),
    cacheTtl: Number.isFinite(cacheTtl) && cacheTtl > 0 ? cacheTtl : 15
  };
});
