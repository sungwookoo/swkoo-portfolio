import { registerAs } from '@nestjs/config';

export interface OnboardingConfig {
  githubAppId: string | undefined;
  githubAppClientId: string | undefined;
  githubAppClientSecret: string | undefined;
  githubAppPrivateKey: string | undefined;
  jwtSecret: string | undefined;
  appBaseUrl: string;
  brandName: string;
  // CSV of github logins allowed to call POST /api/deploy/register.
  // Empty list = nobody can deploy (everyone can still sign in for waitlist).
  deployAllowlist: string[];
}

export const onboardingConfig = registerAs(
  'onboarding',
  (): OnboardingConfig => ({
    githubAppId: process.env.GITHUB_APP_ID,
    githubAppClientId: process.env.GITHUB_APP_CLIENT_ID,
    githubAppClientSecret: process.env.GITHUB_APP_CLIENT_SECRET,
    githubAppPrivateKey: process.env.GITHUB_APP_PRIVATE_KEY,
    jwtSecret: process.env.JWT_SECRET,
    appBaseUrl: process.env.APP_BASE_URL ?? 'https://swkoo.kr',
    brandName: process.env.BRAND_NAME ?? 'swkoo.kr',
    deployAllowlist: (process.env.DEPLOY_ALLOWLIST ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  })
);
