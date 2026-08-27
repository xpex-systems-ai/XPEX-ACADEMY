# XPEX-ADMIN-SESSION-AUTHORITY

The XPeX administrative control plane must honor the canonical platform `User.is_superadmin` authority even when the same identity carries a learner membership in an organization.

The fix is server-side and fail-closed for ordinary users. It does not elevate global Instructor/member roles or use client-side role labels as authorization.

Production PASS still requires CI and a real login -> XPeX -> Painel Admin -> Course Studio smoke against the canonical deployment.
