import React from 'react'
import HomeClient from './home'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { resolveXpexAccess, resolveXpexOrganization } from '@/lib/xpex/access'

export const metadata: Metadata = {
  title: 'Home',
}

// The hub decides a destination from the live authenticated session. Never
// cache an anonymous render here or a newly signed-in learner can be sent back
// through the generic LearnHouse organization flow (/new).
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function Home() {
  const session = await getServerSession()
  const organization = resolveXpexOrganization(session?.roles)
  const organizationSlug = organization?.slug

  if (session?.user && organizationSlug) {
    const access = resolveXpexAccess(session.roles, organizationSlug)

    // Learners go straight to the XPeX student catalog. This keeps them out of
    // the generic organization-creation/root flow and preserves tenant/RBAC
    // enforcement inside the destination page.
    if (access.includes('aluno')) {
      redirect('/xpex/courses')
    }

    // Polo managers/teachers stay in the unified XPeX operating experience.
    if (access.includes('polo') || access.includes('professora')) {
      redirect('/xpex/polo')
    }
  }

  return (
    <div>
      <HomeClient/>
    </div>
  )
}

export default Home
