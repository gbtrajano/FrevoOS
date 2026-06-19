# ÓticaOS — Sistema de Gestão para Óticas

Sistema de gestão completo para óticas, construído com **Next.js 14**, **TypeScript**, **Tailwind CSS** e **Supabase**.

## Funcionalidades

- **Painel** — Indicadores de clientes, produtos, orçamentos e contas a vencer; atalhos de ação rápida; últimas OS e orçamentos
- **Orçamentos** — Cadastro com seleção de clientes e produtos, totais automáticos; conversão para OS com um clique
- **Ordens de Serviço** — Acompanhamento por status (Solicitado → Laboratório → Pronto → Concluído); gráfico de rosca por status
- **Clientes** — CRUD completo com máscara de CPF e telefone
- **Produtos** — CRUD com categorias, controle de estoque e alerta de estoque mínimo; gráfico de estoque crítico
- **Financeiro** — Contas a pagar, contas a receber, relatório com gráficos e resultado líquido

---

## Pré-requisitos

- [Node.js 18+](https://nodejs.org/)
- [Bun](https://bun.sh/) (`npm install -g bun`)
- Conta no [Supabase](https://supabase.com/) (gratuita)

---

## Configuração

### 1. Configure o banco de dados no Supabase

1. Crie um novo projeto em [supabase.com](https://supabase.com/)
2. Acesse **SQL Editor** no painel do projeto
3. Cole o conteúdo de `supabase/schema.sql` e execute
4. Isso criará todas as tabelas, funções, triggers e RLS

### 2. Crie um usuário para login

No painel do Supabase:
1. Vá em **Authentication → Users**
2. Clique em **Add user → Create new user**
3. Informe e-mail e senha (este será o login do sistema)

### 3. Configure as variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Abra `.env.local` e preencha com suas credenciais:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

Encontre esses valores em: **Supabase → Project Settings → API**.

### 4. Instale as dependências

```bash
bun install
```

### 5. Inicie o servidor de desenvolvimento

```bash
bun dev
```

Acesse [http://localhost:3000](http://localhost:3000) e faça login com o usuário criado no Supabase.

---

## Build para produção

```bash
bun run build
bun start
```

---

## Estrutura do projeto

```
otica-frevo/
├── supabase/
│   └── schema.sql              # Schema completo do banco
├── src/
│   ├── app/
│   │   ├── login/              # Página de login
│   │   └── (dashboard)/        # Rotas protegidas
│   │       ├── painel/         # Dashboard
│   │       ├── clientes/       # Gestão de clientes
│   │       ├── produtos/       # Gestão de produtos
│   │       ├── orcamentos/     # Orçamentos
│   │       ├── os/             # Ordens de serviço
│   │       └── financeiro/     # Financeiro (CP, CR, Relatório)
│   ├── components/
│   │   ├── ui.tsx              # Componentes base (Button, Modal, Badge...)
│   │   ├── navbar.tsx          # Barra de navegação
│   │   ├── lens-mark.tsx       # Logo SVG
│   │   ├── itens-editor.tsx    # Editor de itens (orçamentos/OS)
│   │   ├── orcamento-form.tsx  # Formulário de orçamento
│   │   └── os-form.tsx         # Formulário de OS
│   └── lib/
│       ├── supabase/client.ts  # Cliente Supabase
│       ├── auth-context.tsx    # Contexto de autenticação
│       ├── toast-context.tsx   # Notificações toast
│       ├── types.ts            # Tipos TypeScript
│       └── utils.ts            # Utilitários (formatação, máscaras)
└── .env.local.example
```

---

## Tecnologias

| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js | 14 | Framework React (App Router) |
| TypeScript | 5 | Tipagem estática |
| Tailwind CSS | 3 | Estilização utilitária |
| Supabase | 2 | Banco de dados, Auth, RLS |
| Recharts | — | Gráficos |
| Lucide React | — | Ícones |
| Bun | 1.3+ | Package manager e runtime |
