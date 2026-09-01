export interface AuthoritativeSessionUser {
  username?: string
  first_name?: string
  last_name?: string
  is_superadmin?: boolean
  [key: string]: unknown
}

/**
 * Merge profile data without allowing token/profile claims to override the
 * canonical /users/session superadmin flag. The session endpoint is rebuilt
 * from the database user row and is the only authority for platform-wide
 * superadmin access.
 */
export function mergeAuthoritativeSessionUser(
  canonicalSessionUser: AuthoritativeSessionUser | undefined,
  profileUser: AuthoritativeSessionUser | undefined,
): AuthoritativeSessionUser | undefined {
  if (!canonicalSessionUser) return undefined

  return {
    ...(profileUser ?? {}),
    ...canonicalSessionUser,
    is_superadmin: canonicalSessionUser.is_superadmin === true,
  }
}
