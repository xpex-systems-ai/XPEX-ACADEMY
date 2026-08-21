import React from 'react'
import HomeClient from './home'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { resolveXpexAccess } from '@/lib/xpex/access'
 
export const metadata: Metadata = {
  title: 'Home',
}
const PILOT_ORG_SLUG = 'kelle-digital-lab'

async function Home() {
  const session = await getServerSession()
  if (session?.user && resolveXpexAccess(session.roles, PILOT_ORG_SLUG).length > 0) {
    redirect('/xpex')
  }

  return (
    <div>
      <HomeClient/>
    </div>
  )
}

export default Home
