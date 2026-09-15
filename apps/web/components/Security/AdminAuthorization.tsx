'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  const [isAuthorized, setIsAuthorized] = useState(false);

  const isUserAuthenticated = useMemo(() => session.status === 'authenticated', [session.status]);
  const sessionPending = session.status !== 'authenticated' && session.status !== 'unauthenticated';
  const orgPending = isUserAuthenticated && !org?.slug;

  const checkPathname = useCallback((pattern: string, pathname: string) => {
    if (typeof pattern !== 'string' || typeof pathname !== 'string') {
      return false;
    }

    const regexPattern = new RegExp(`^${pattern.replace(/[\/.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*')}$`);
    return regexPattern.test(pathname);
  }, []);

  const isAdminPath = useMemo(() => ADMIN_PATHS.some(path => checkPathname(path, pathname)), [pathname, checkPathname]);

  const authorizeUser = useCallback(() => {
    // Never classify a session/org hydration state as an authorization failure.
    if (loading || sessionPending || orgPending) return;

    if (!isUserAuthenticated) {
      router.replace(org?.slug ? getUriWithOrg(org.slug, '/login') : '/login');
      return;
    }

    if (authorizationMode === 'page') {
      if (isAdminPath) {
        if (isAdmin) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          router.replace('/dash');
        }
      } else {
        setIsAuthorized(true);
      }
    } else if (authorizationMode === 'component') {
      setIsAuthorized(Boolean(isAdmin));
    }
  }, [loading, sessionPending, orgPending, isUserAuthenticated, isAdmin, isAdminPath, authorizationMode, router, org?.slug]);

  useEffect(() => {
    authorizeUser();
  }, [authorizeUser]);

  if (loading || sessionPending || orgPending) {
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

  return <>{isAuthorized && children}</>;
};

export default AdminAuthorization;
