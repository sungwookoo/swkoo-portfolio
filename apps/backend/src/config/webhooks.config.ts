import { registerAs } from '@nestjs/config';

export interface WebhooksConfig {
  dbPath: string;
  argocdSecret?: string;
  githubSecret?: string;
}

export const webhooksConfig = registerAs('webhooks', (): WebhooksConfig => ({
  dbPath: process.env.OBSERVATORY_DB_PATH ?? './observatory.sqlite',
  argocdSecret: process.env.ARGOCD_WEBHOOK_SECRET,
  githubSecret: process.env.GITHUB_WEBHOOK_SECRET
}));
