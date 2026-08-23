'use client'

import React from 'react'
import { getOrgLogoMediaDirectory } from '@services/media/media'

export default function AuthMobileHeader({ org }: { org: any }) {
  return (
    <header aria-label="XpeX Academy" className="relative overflow-hidden border-b border-white/10 bg-[#0B1220] px-5 py-4 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(255,122,0,.24),transparent_42%),radial-gradient(circle_at_90%_0%,rgba(0,212,255,.20),transparent_40%)]" />
      <div className="relative z-10 flex items-center gap-3 pr-20">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#FF7A00] text-sm font-black shadow-[0_0_24px_rgba(255,122,0,.24)]">XP</span>
        <span>
          <strong className="block text-sm tracking-[.18em]">XpeX</strong>
          <small className="text-[9px] font-bold uppercase tracking-[.22em] text-white/55">Academy</small>
        </span>
        {org?.logo_image && (
          <img
            src={getOrgLogoMediaDirectory(org.org_uuid, org.logo_image)}
            alt="Identidade da organização"
            className="ml-auto h-10 max-w-32 rounded-lg bg-white/95 object-contain p-1.5"
          />
        )}
      </div>
    </header>
  )
}
