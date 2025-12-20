import { registerAs } from '@nestjs/config';

export const githubConfig = registerAs('github', () => ({
  token: process.env.GITHUB_TOKEN ?? null,
  owner: process.env.GITHUB_OWNER ?? null,
  repo: process.env.GITHUB_REPO ?? null
}));

