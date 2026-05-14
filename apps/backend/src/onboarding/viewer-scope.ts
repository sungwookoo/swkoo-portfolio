import type { Request } from 'express';
import type { AuthedRequest } from './jwt-auth.guard';

/**
 * Observatory visibility tiers:
 *   - 'all'       → admin viewing everything (default for admin)
 *   - 'operator'  → operator-owned signals only (anonymous viewer, or admin with ?scope=mine)
 *   - {login}     → operator-owned + this user's own signals (signed-in non-admin)
 *
 * Owner derivation: a signal whose namespace is `user-<login>` belongs to that login;
 * anything else (swkoo, monitoring, argocd, kube-system, …) is operator-owned.
 */
export type ViewerScope = 'all' | 'operator' | { login: string };

export function viewerScopeFor(
  req: Request,
  adminLogins: string[],
  rawScopeQuery: string | undefined
): ViewerScope {
  const user = (req as AuthedRequest).user;
  if (!user) return 'operator';
  const isAdmin = adminLogins
    .map((s) => s.toLowerCase())
    .includes(user.githubLogin.toLowerCase());
  if (isAdmin) {
    return rawScopeQuery === 'mine' ? 'operator' : 'all';
  }
  return { login: user.githubLogin.toLowerCase() };
}

export function extractOwnerLogin(namespace: string | null | undefined): string | null {
  if (!namespace) return null;
  const prefix = 'user-';
  if (!namespace.startsWith(prefix)) return null;
  return namespace.slice(prefix.length).toLowerCase();
}

export function isVisibleToScope(
  namespace: string | null | undefined,
  scope: ViewerScope
): boolean {
  if (scope === 'all') return true;
  const owner = extractOwnerLogin(namespace);
  if (scope === 'operator') return owner === null;
  return owner === null || owner === scope.login;
}
