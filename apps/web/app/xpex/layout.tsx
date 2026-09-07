import type { ReactNode } from 'react'
import '../../components/Xpex/xpex-premium.css'
import '../../components/Xpex/xpex-premium-root.css'

// Every XPeX route is session/tenant aware. Force request-time rendering for
// the whole segment so child routes never reuse an anonymous/static render
// and accidentally bounce an authenticated learner back to /login.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function XpexLayout({ children }: { children: ReactNode }) {
  return <div className="xpex-premium xpex-premium-shell">{children}</div>
}
