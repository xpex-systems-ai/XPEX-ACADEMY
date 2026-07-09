# Fase 02 — Landing Premium XpeX Academy

## Escopo

A Fase 02 cria a primeira experiência pública premium da XpeX Academy na rota `/`, com narrativa institucional em português do Brasil, identidade visual dark premium e comunicação clara do ecossistema.

Esta fase é visual e institucional. Não implementa IA real, pagamentos, marketplace, vagas, freelas, banco novo, integrações externas ou captura real de leads.

## Rota pública

- Rota criada: `/`
- Arquivo de rota: `apps/web/app/page.tsx`
- Componente principal: `apps/web/components/Landings/XpexAcademy/XpexAcademyLanding.tsx`
- Constantes de marca e conteúdo: `apps/web/lib/xpex-brand.ts`

## Módulos exibidos

- Global Skills Hub
- Trilhas XpeX
- Cursos Oficiais
- Cursos Próprios
- Hub de Ferramentas
- Professor IA
- Certificados
- Portfólio
- XpeX TV
- Blog
- Comunidade
- Jobs & Freelance Hub

## Decisões de segurança

- A rota `/home` foi preservada como hub autenticado.
- Os fluxos `/login`, `/signup`, `/admin`, `/orgs`, `/api`, `/payments` e áreas internas não foram alterados.
- O formulário de lista de espera é apenas visual e contém TODO para integração futura segura.
- Não foram adicionadas dependências externas, secrets, migrações ou novas tabelas.
- Não há uso de logos ou claims de parceria oficial com marcas externas.

## Próximos passos técnicos

1. Definir backend seguro para captação da lista de espera.
2. Criar páginas públicas específicas para Global Skills Hub, trilhas e ferramentas.
3. Planejar modelo de conteúdo para módulos estratégicos sem alterar permissões existentes.
4. Mapear como certificados e portfólio serão expostos publicamente sem vazar dados privados.
5. Definir governança para textos que citem plataformas externas, sempre sem afirmar parceria oficial.
