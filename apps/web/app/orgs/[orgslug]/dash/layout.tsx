import { Metadata } from 'next'
import React from 'react'
import ClientAdminLayout from './ClientAdminLayout'
import './xpex-native-admin.css'
import './xpex-native-v7-2.css'
import './xpex-native-brand-mask.css'

export const metadata: Metadata = {
  title: 'XpeX Academy · Operação Acadêmica',
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ClientAdminLayout>{children}</ClientAdminLayout>
}

export default DashboardLayout
