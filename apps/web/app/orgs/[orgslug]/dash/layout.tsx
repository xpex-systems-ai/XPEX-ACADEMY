import { Metadata } from 'next'
import React from 'react'
import ClientAdminLayout from './ClientAdminLayout'
import './xpex-native-admin.css'

export const metadata: Metadata = {
  title: 'XpeX Academy · Operação Acadêmica',
}

async function DashboardLayout(
  props: {
    children: React.ReactNode
    params: Promise<any>
  }
) {
  const params = await props.params
  const { children } = props

  return (
    <ClientAdminLayout params={params}>
      {children}
    </ClientAdminLayout>
  )
}

export default DashboardLayout
