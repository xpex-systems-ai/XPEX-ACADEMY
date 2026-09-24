import fs from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('official XpeX landing contract', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'components/Landings/XpexAcademy/XpexAcademyLanding.tsx'), 'utf8')

  it('uses the official student journey instead of beta/demo entry points', () => {
    assert.ok(source.includes('/login?next=%2Fxpex%2Faluno'))
    assert.ok(source.includes('Inteligência Artificial — do Básico ao Avançado'))
    assert.ok(!source.includes('/beta/aluno'))
    assert.ok(!source.includes('Ver demonstração'))
    assert.ok(!source.includes('Preview Beta da XpeX Academy'))
    assert.ok(!source.includes('dados fictícios nas telas beta'))
  })
})

