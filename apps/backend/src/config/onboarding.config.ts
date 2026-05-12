import { registerAs } from '@nestjs/config';

export interface OnboardingConfig {
  githubAppId: string | undefined;
  githubAppClientId: string | undefined;
  githubAppClientSecret: string | undefined;
  githubAppPrivateKey: string | undefined;
  jwtSecret: string | undefined;
  appBaseUrl: string;
  brandName: string;
  // CSV of github logins seeded into users.is_allowed on boot (Phase 2.7+).
  // Empty list = no auto-seed; everyone signs in but nobody passes the deploy
  // gate until granted via /admin.
  deployAllowlist: string[];
  // CSV of github logins authorized for /admin/* routes. Always env-managed
  // (no DB or UI flow to elevate admin). Empty = nobody is admin.
  adminLogins: string[];
  // Where /api/deploy/register commits the rendered manifests.
  manifestRepo: string; // "<owner>/<name>", e.g. "sungwookoo/swkoo-portfolio"
  manifestBranch: string;
  appsDomain: string; // for subdomain construction, e.g. "apps.swkoo.kr"
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
    adminLogins: (process.env.ADMIN_LOGINS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    manifestRepo: process.env.MANIFEST_REPO ?? 'sungwookoo/swkoo-portfolio',
    manifestBranch: process.env.MANIFEST_BRANCH ?? 'main',
    appsDomain: process.env.APPS_DOMAIN ?? 'apps.swkoo.kr',
  })
);
