import React from 'react'
import HomeClient from './home'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { resolveXpexAccess, resolveXpexOrganization } from '@/lib/xpex/access'
 
export const metadata: Metadata = {
  title: 'Home',
}
async function Home() {
  const session = await getServerSession()
  const organizationSlug = resolveXpexOrganization(session?.roles)?.slug
  if (session?.user && organizationSlug && resolveXpexAccess(session.roles, organizationSlug).length > 0) {
    redirect('/xpex')
  }

  return (
    <div>
      <HomeClient/>
    </div>
  )
}

export default Home
