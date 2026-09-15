export type SignupRouteDecision =
  | { ok: true; path: string }
  | { ok: false; reason: 'invite_requires_org' }

/**
 * Pure routing contract for account creation. Keeping this decision free of
 * network/database state lets CI verify invite consumption targets without
 * consuming a real production invite code.
 */
export function buildSignupBackendPath(
  orgId?: string | number,
  inviteCode?: string,
): SignupRouteDecision {
  if (inviteCode) {
    if (!orgId) return { ok: false, reason: 'invite_requires_org' }
    return {
      ok: true,
      path: `users/${orgId}/invite/${encodeURIComponent(inviteCode)}`,
    }
  }

  if (orgId) return { ok: true, path: `users/${orgId}` }
  return { ok: true, path: 'users/' }
}
