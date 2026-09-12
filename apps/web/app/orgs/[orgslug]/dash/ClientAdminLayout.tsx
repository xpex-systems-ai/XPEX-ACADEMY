'use client'

import AdminAuthorization from '@components/Security/AdminAuthorization'
import { SessionGate } from '@components/Contexts/LHSessionContext'
import { CommandPaletteProvider } from '@components/Dashboard/CommandPalette/CommandPaletteContext'
import CommandPalette from '@components/Dashboard/CommandPalette/CommandPalette'
import React from 'react'
import XpexNativeAdminMenu from './XpexNativeAdminMenu'

function ClientAdminLayout({
  children,
}: {
  children: React.ReactNode
  params?: any
}) {
  return (
    <SessionGate>
      <AdminAuthorization authorizationMode="page">
        <CommandPaletteProvider>
          <div className="xpex-native-admin">
            <XpexNativeAdminMenu />
            <div className="xpex-native-admin-main">
              {children}
            </div>
            <CommandPalette />
          </div>
        </CommandPaletteProvider>
      </AdminAuthorization>
    </SessionGate>
  )
}

export default ClientAdminLayout
