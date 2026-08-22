import { XpexErrorState } from './XpexPrimitives'

export function XpexStudentDenied() {
  return <main className="xpex-root grid min-h-screen place-items-center p-6"><XpexErrorState title="Conteúdo indisponível" description="Este curso não está publicado ou não pertence às suas matrículas autorizadas." /></main>
}
