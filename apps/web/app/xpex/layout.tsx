import type { ReactNode } from 'react'
import '../../components/Xpex/xpex-premium.css'
import '../../components/Xpex/xpex-premium-root.css'

export default function XpexLayout({ children }: { children: ReactNode }) {
  return <div className="xpex-premium xpex-premium-shell">{children}</div>
}
