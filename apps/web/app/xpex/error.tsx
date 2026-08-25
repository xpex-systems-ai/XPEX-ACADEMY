'use client'

import { RefreshCw } from 'lucide-react'
import { XpexErrorState } from '@components/Xpex/XpexPrimitives'
import '@components/Xpex/xpex.css'

export default function XpexError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="xpex-root xpex-route-state"><div><XpexErrorState title="Academy temporariamente indisponível" description="Não foi possível carregar sua área agora. Tente novamente sem perder seu progresso."/><button type="button" className="xpex-primary xpex-retry" onClick={reset}><RefreshCw aria-hidden="true" size={17}/>Tentar novamente</button></div></main>
}
