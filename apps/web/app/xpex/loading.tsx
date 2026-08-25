import { XpexLoadingState } from '@components/Xpex/XpexPrimitives'
import '@components/Xpex/xpex.css'

export default function XpexLoading() {
  return <main className="xpex-root xpex-route-state"><div className="xpex-loading-shell" aria-hidden="true"><span/><span/><span/></div><XpexLoadingState/></main>
}
