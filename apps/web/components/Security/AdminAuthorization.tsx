'use client';
import React, { useEffect, useCallback, useMemo } from 'react';
import { useLHSession } from '@components/Contexts/LHSessionContext';
import useAdminStatus from '@components/Hooks/useAdminStatus';
import { usePathname, useRouter } from 'next/navigation';
import PageLoading from '@components/Objects/Loaders/PageLoading';
import { getUriWithOrg } from '@services/config/config';
import { useOrg } from '@components/Contexts/OrgContext';

type AuthorizationProps = {
  children: React.ReactNode;
  authorizationMode: 'component' | 'page';
};

const ADMIN_PATHS = [
  '/dash/org/*',
  '/dash/org',
  '/dash/users/*',
  '/dash/users',
  '/dash/courses/*',
  '/dash/courses',
  '/dash/org/settings/general',
];

const AdminAuthorization: React.FC<AuthorizationProps> = ({ children, authorizationMode }) => {
  const session = useLHSession() as any;
  const org = useOrg() as any;
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, loading } = useAdminStatus() as any;

  const isUserAuthenticated = useMemo(() => session.status === 'authenticated', [session.status]);
  const sessionPending = session.status !== 'authenticated' && session.status !== 'unauthenticated';
  const orgPending = isUserAuthenticated && !org?.slug;

  const checkPathname = useCallback((pattern: string, currentPathname: string) => {
    if (typeof pattern !== 'string' || typeof currentPathname !== 'string') return false;
    const regexPattern = new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*')}$`);
    return regexPattern.test(currentPathname);
  }, []);

  // Next.js exposes organization-scoped routes as /orgs/:slug/dash/....
  // Normalize only the organization prefix before matching the existing admin
  // policy so nested admin pages cannot fall through as public dashboard routes.
  const normalizedPathname = useMemo(
    () => pathname.replace(/^\/orgs\/[^/]+(?=\/|$)/, ''),
    [pathname],
  );

  const isAdminPath = useMemo(
    () => ADMIN_PATHS.some(path => checkPathname(path, normalizedPathname)),
    [normalizedPathname, checkPathname],
  );

  const isAuthorized = useMemo(() => {
    if (loading || sessionPending || orgPending || !isUserAuthenticated) return false;
    if (authorizationMode === 'component') return Boolean(isAdmin);
    return !isAdminPath || Boolean(isAdmin);
  }, [authorizationMode, isAdmin, isAdminPath, isUserAuthenticated, loading, orgPending, sessionPending]);

  useEffect(() => {
    if (loading || sessionPending || orgPending) return;

    if (!isUserAuthenticated) {
      router.replace(org?.slug ? getUriWithOrg(org.slug, '/login') : '/login');
      return;
    }

    if (authorizationMode === 'page' && isAdminPath && !isAdmin) {
      router.replace(org?.slug ? getUriWithOrg(org.slug, '/dash') : '/dash');
    }
  }, [authorizationMode, isAdmin, isAdminPath, isUserAuthenticated, loading, org?.slug, orgPending, router, sessionPending]);

  // Pending session/org resolution and redirect transitions are loading states,
  // never temporary authorization failures.
  if (loading || sessionPending || orgPending || !isUserAuthenticated) {
    return (
      <div className="flex justify-center items-center h-screen" role="status" aria-live="polite">
        <PageLoading />
        <span className="sr-only">Carregando acesso administrativo…</span>
      </div>
    );
  }

  if (authorizationMode === 'page' && !isAuthorized) {
    return (
      <div className="flex justify-center items-center h-screen">
        <h1 className="text-2xl">Acesso administrativo indisponível</h1>
      </div>
    );
  }

  return <>{isAuthorized ? children : null}</>;
};

export default AdminAuthorization;
