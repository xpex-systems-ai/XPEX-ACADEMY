import fs from 'node:fs'
import path from 'node:path'

describe('official XpeX landing contract', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'components/Landings/XpexAcademy/XpexAcademyLanding.tsx'), 'utf8')

  it('uses the official student journey instead of beta/demo entry points', () => {
    expect(source).toContain('/login?next=%2Fxpex%2Faluno')
    expect(source).toContain('Inteligência Artificial — do Básico ao Avançado')
    expect(source).not.toContain('/beta/aluno')
    expect(source).not.toContain('Ver demonstração')
    expect(source).not.toContain('Preview Beta da XpeX Academy')
    expect(source).not.toContain('dados fictícios nas telas beta')
  })
})
