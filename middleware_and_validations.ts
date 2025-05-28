// middleware.ts (na raiz do projeto)
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase/types'

// Rotas que requerem autenticação
const protectedRoutes = ['/dashboard', '/produtos', '/receitas', '/compras', '/relatorios', '/configuracoes']

// Rotas que redirecionam usuários autenticados
const authRoutes = ['/login', '/register', '/forgot-password']

// Rotas públicas (não requerem autenticação)
const publicRoutes = ['/', '/sobre', '/contato', '/termos', '/privacidade']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  // Pular middleware para arquivos estáticos e API routes específicas
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.includes('.') // arquivos estáticos
  ) {
    return res
  }

  try {
    // Criar cliente Supabase para middleware
    const supabase = createMiddlewareClient<Database>({ req, res })
    
    // Verificar sessão atual
    const { data: { session }, error } = await supabase.auth.getSession()

    // Log para debug (remover em produção)
    if (process.env.NODE_ENV === 'development') {
      console.log(`Middleware - Path: ${pathname}, Authenticated: ${!!session?.user}`)
    }

    // Se há erro na verificação da sessão
    if (error) {
      console.error('Middleware auth error:', error)
      // Redirecionar para login se estiver tentando acessar rota protegida
      if (protectedRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
      return res
    }

    const isAuthenticated = !!session?.user

    // Verificar se é uma rota protegida
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    
    // Verificar se é uma rota de autenticação
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

    // Verificar se é rota pública
    const isPublicRoute = publicRoutes.includes(pathname) || pathname === '/'

    // Lógica de redirecionamento
    if (isProtectedRoute && !isAuthenticated) {
      // Usuário não autenticado tentando acessar rota protegida
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (isAuthRoute && isAuthenticated) {
      // Usuário autenticado tentando acessar rotas de auth
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Verificar se o usuário completou o onboarding
    if (isAuthenticated && isProtectedRoute) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single()

        // Se não completou onboarding e não está na página de onboarding
        if (profile && !profile.onboarding_completed && !pathname.startsWith('/onboarding')) {
          return NextResponse.redirect(new URL('/onboarding', req.url))
        }

        // Se completou onboarding mas está na página de onboarding
        if (profile && profile.onboarding_completed && pathname.startsWith('/onboarding')) {
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
      } catch (profileError) {
        console.error('Error checking profile:', profileError)
        // Se não conseguir verificar perfil, permitir acesso mas não redirecionar
      }
    }

    // Redirecionar raiz para dashboard se autenticado
    if (pathname === '/' && isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // Em caso de erro, permitir acesso mas logar o problema
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

// src/lib/validations/auth.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email é obrigatório' })
    .email('Email inválido')
    .min(1, 'Email é obrigatório'),
  password: z
    .string({ required_error: 'Senha é obrigatória' })
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha muito longa'),
})

export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email é obrigatório' })
    .email('Email inválido')
    .min(1, 'Email é obrigatório'),
  password: z
    .string({ required_error: 'Senha é obrigatória' })
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha muito longa')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'
    ),
  confirmPassword: z.string({ required_error: 'Confirmação de senha é obrigatória' }),
  nomeCompleto: z
    .string({ required_error: 'Nome completo é obrigatório' })
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  nomeRestaurante: z
    .string({ required_error: 'Nome do restaurante é obrigatório' })
    .min(2, 'Nome do restaurante deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  termsAccepted: z
    .boolean({ required_error: 'Você deve aceitar os termos' })
    .refine((val) => val === true, 'Você deve aceitar os termos de uso'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email é obrigatório' })
    .email('Email inválido')
    .min(1, 'Email é obrigatório'),
})

export const resetPasswordSchema = z.object({
  password: z
    .string({ required_error: 'Nova senha é obrigatória' })
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha muito longa')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'
    ),
  confirmPassword: z.string({ required_error: 'Confirmação de senha é obrigatória' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

// src/lib/validations/profile.ts
import { z } from 'zod'

export const profileSchema = z.object({
  nomeCompleto: z
    .string({ required_error: 'Nome completo é obrigatório' })
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  nomeRestaurante: z
    .string({ required_error: 'Nome do restaurante é obrigatório' })
    .min(2, 'Nome do restaurante deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  email: z
    .string({ required_error: 'Email é obrigatório' })
    .email('Email inválido'),
  metaCmvMensal: z
    .number({ required_error: 'Meta de CMV é obrigatória' })
    .min(1, 'Meta deve ser maior que 0%')
    .max(100, 'Meta deve ser menor que 100%'),
  timezone: z.string().optional(),
  moeda: z.string().optional(),
  formatoData: z.string().optional(),
  tema: z.enum(['light', 'dark', 'system']).optional(),
  notificacoesAtivas: z.boolean().optional(),
  backupAutomatico: z.boolean().optional(),
})

export const onboardingProfileSchema = z.object({
  nomeCompleto: z
    .string({ required_error: 'Nome completo é obrigatório' })
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  nomeRestaurante: z
    .string({ required_error: 'Nome do restaurante é obrigatório' })
    .min(2, 'Nome do restaurante deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  metaCmvMensal: z
    .number({ required_error: 'Meta de CMV é obrigatória' })
    .min(5, 'Meta deve ser pelo menos 5%')
    .max(80, 'Meta deve ser no máximo 80%')
    .default(30),
  tipoRestaurante: z
    .string({ required_error: 'Tipo de restaurante é obrigatório' })
    .min(1, 'Selecione o tipo de restaurante'),
})

export type ProfileInput = z.infer<typeof profileSchema>
export type OnboardingProfileInput = z.infer<typeof onboardingProfileSchema>

// src/lib/validations/product.ts
import { z } from 'zod'

export const productSchema = z.object({
  nome: z
    .string({ required_error: 'Nome do produto é obrigatório' })
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  descricao: z.string().optional(),
  codigoInterno: z.string().optional(),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
  unidade: z
    .string({ required_error: 'Unidade é obrigatória' })
    .min(1, 'Selecione uma unidade'),
  precoAtual: z
    .number({ required_error: 'Preço é obrigatório' })
    .min(0.01, 'Preço deve ser maior que zero'),
  estoqueAtual: z
    .number()
    .min(0, 'Estoque não pode ser negativo')
    .optional()
    .default(0),
  estoqueMinimo: z
    .number()
    .min(0, 'Estoque mínimo não pode ser negativo')
    .optional()
    .default(0),
  dataValidade: z.string().optional().nullable(),
  ativo: z.boolean().optional().default(true),
})

export const categorySchema = z.object({
  nome: z
    .string({ required_error: 'Nome da categoria é obrigatório' })
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome muito longo'),
  cor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal')
    .optional()
    .default('#3B82F6'),
  descricao: z.string().optional(),
  ativo: z.boolean().optional().default(true),
})

export const supplierSchema = z.object({
  nome: z
    .string({ required_error: 'Nome do fornecedor é obrigatório' })
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  contato: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  cnpj: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true
      // Validação básica de CNPJ (apenas formato)
      const cnpj = val.replace(/\D/g, '')
      return cnpj.length === 14
    }, 'CNPJ deve ter 14 dígitos'),
  observacoes: z.string().optional(),
  ativo: z.boolean().optional().default(true),
})

export type ProductInput = z.infer<typeof productSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type SupplierInput = z.infer<typeof supplierSchema>

// src/lib/constants/app.ts
export const APP_CONFIG = {
  name: 'CMV Control',
  description: 'Sistema inteligente para controle de CMV e gestão de custos em restaurantes',
  version: '1.0.0',
  author: 'CMV Control Team',
  email: 'contato@cmvcontrol.app',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const

export const ROUTES = {
  public: {
    home: '/',
    about: '/sobre',
    contact: '/contato',
    terms: '/termos',
    privacy: '/privacidade',
  },
  auth: {
    login: '/login',
    register: '/register',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
  },
  protected: {
    dashboard: '/dashboard',
    products: '/produtos',
    recipes: '/receitas',
    purchases: '/compras',
    reports: '/relatorios',
    settings: '/configuracoes',
  },
  onboarding: {
    root: '/onboarding',
    welcome: '/onboarding/welcome',
    profile: '/onboarding/profile',
    demoData: '/onboarding/demo-data',
    firstProduct: '/onboarding/first-product',
    firstRecipe: '/onboarding/first-recipe',
    complete: '/onboarding/complete',
  },
} as const

export const TOAST_MESSAGES = {
  success: {
    login: 'Login realizado com sucesso!',
    logout: 'Logout realizado com sucesso!',
    register: 'Conta criada com sucesso! Verifique seu email.',
    profileUpdated: 'Perfil atualizado com sucesso!',
    productCreated: 'Produto criado com sucesso!',
    productUpdated: 'Produto atualizado com sucesso!',
    productDeleted: 'Produto excluído com sucesso!',
  },
  error: {
    general: 'Algo deu errado. Tente novamente.',
    network: 'Erro de conexão. Verifique sua internet.',
    unauthorized: 'Acesso negado. Faça login novamente.',
    notFound: 'Item não encontrado.',
    validation: 'Dados inválidos. Verifique os campos.',
  },
} as const

export const DEFAULT_VALUES = {
  profile: {
    metaCmvMensal: 30,
    timezone: 'America/Sao_Paulo',
    moeda: 'BRL',
    formatoData: 'dd/MM/yyyy',
    tema: 'system',
    notificacoesAtivas: true,
    backupAutomatico: false,
  },
  product: {
    estoqueAtual: 0,
    estoqueMinimo: 0,
    ativo: true,
  },
  category: {
    cor: '#3B82F6',
    ativo: true,
  },
  supplier: {
    ativo: true,
  },
} as const

// src/lib/constants/units.ts
export const UNITS = {
  peso: [
    { value: 'g', label: 'Gramas (g)', factor: 0.001 },
    { value: 'kg', label: 'Quilogramas (kg)', factor: 1 },
    { value: 't', label: 'Toneladas (t)', factor: 1000 },
  ],
  volume: [
    { value: 'ml', label: 'Mililitros (ml)', factor: 0.001 },
    { value: 'L', label: 'Litros (L)', factor: 1 },
  ],
  unidade: [
    { value: 'un', label: 'Unidade (un)', factor: 1 },
    { value: 'dz', label: 'Dúzia (dz)', factor: 12 },
    { value: 'cx', label: 'Caixa (cx)', factor: 24 },
    { value: 'pct', label: 'Pacote (pct)', factor: 1 },
    { value: 'sc', label: 'Saco (sc)', factor: 1 },
  ],
} as const

export const ALL_UNITS = [
  ...UNITS.peso,
  ...UNITS.volume,
  ...UNITS.unidade,
] as const

export const RESTAURANT_TYPES = [
  { value: 'restaurante', label: 'Restaurante Tradicional' },
  { value: 'fast-food', label: 'Fast Food' },
  { value: 'pizzaria', label: 'Pizzaria' },
  { value: 'lanchonete', label: 'Lanchonete' },
  { value: 'padaria', label: 'Padaria' },
  { value: 'confeitaria', label: 'Confeitaria' },
  { value: 'sorveteria', label: 'Sorveteria' },
  { value: 'food-truck', label: 'Food Truck' },
  { value: 'delivery', label: 'Delivery/Ghost Kitchen' },
  { value: 'bar', label: 'Bar/Pub' },
  { value: 'cafeteria', label: 'Cafeteria' },
  { value: 'outro', label: 'Outro' },
] as const