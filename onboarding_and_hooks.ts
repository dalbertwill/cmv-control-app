// src/lib/hooks/useDebounce.ts
import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// src/lib/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue]
}

// src/lib/hooks/useOnline.ts
import { useState, useEffect } from 'react'

export function useOnline(): boolean {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Update the state based on navigator.onLine
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

// src/app/onboarding/layout.tsx
'use client'

import { useAuth } from '@/components/providers/providers'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const ONBOARDING_STEPS = [
  { path: '/onboarding/welcome', title: 'Boas-vindas', step: 1 },
  { path: '/onboarding/profile', title: 'Perfil', step: 2 },
  { path: '/onboarding/demo-data', title: 'Dados de exemplo', step: 3 },
  { path: '/onboarding/complete', title: 'Finalização', step: 4 },
]

interface OnboardingLayoutProps {
  children: React.ReactNode
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const { user, profile } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)

  useEffect(() => {
    const step = ONBOARDING_STEPS.find(s => s.path === pathname)?.step || 1
    setCurrentStep(step)
  }, [pathname])

  // Redirect se já completou onboarding
  useEffect(() => {
    if (profile?.onboarding_completed) {
      router.push('/dashboard')
    }
  }, [profile, router])

  const progress = (currentStep / ONBOARDING_STEPS.length) * 100
  const canGoBack = currentStep > 1
  const currentStepData = ONBOARDING_STEPS.find(s => s.step === currentStep)

  const handleBack = () => {
    if (currentStep > 1) {
      const prevStep = ONBOARDING_STEPS.find(s => s.step === currentStep - 1)
      if (prevStep) {
        router.push(prevStep.path)
      }
    }
  }

  const handleSkip = () => {
    router.push('/dashboard')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground">CMV Control</h1>
            <Button variant="ghost" onClick={handleSkip}>
              <X className="h-4 w-4 mr-2" />
              Pular configuração
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Passo {currentStep} de {ONBOARDING_STEPS.length}</span>
              <span>{Math.round(progress)}% completo</span>
            </div>
            <Progress value={progress} className="h-2" />
            {currentStepData && (
              <p className="text-sm font-medium">{currentStepData.title}</p>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-background rounded-lg shadow-xl p-8">
            {/* Back Button */}
            {canGoBack && (
              <Button 
                variant="ghost" 
                onClick={handleBack}
                className="mb-6"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}

            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

// src/components/ui/progress.tsx
import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }

// src/app/onboarding/welcome/page.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/components/providers/providers'
import { useRouter } from 'next/navigation'
import { Utensils, Calculator, TrendingUp, Clock } from 'lucide-react'

const FEATURES = [
  {
    icon: Calculator,
    title: 'Controle de CMV',
    description: 'Calcule automaticamente o custo da mercadoria vendida de cada receita'
  },
  {
    icon: Utensils,
    title: 'Fichas Técnicas',
    description: 'Crie receitas detalhadas com cálculo automático de custos'
  },
  {
    icon: TrendingUp,
    title: 'Relatórios Inteligentes',
    description: 'Analise tendências e otimize seus custos com insights precisos'
  },
  {
    icon: Clock,
    title: 'Economia de Tempo',
    description: 'Automatize cálculos complexos e foque no que realmente importa'
  }
]

export default function WelcomePage() {
  const { profile } = useAuth()
  const router = useRouter()

  const handleNext = () => {
    router.push('/onboarding/profile')
  }

  return (
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          Bem-vindo ao CMV Control, {profile?.nome_completo?.split(' ')[0] || 'Chef'}! 👋
        </h1>
        <p className="text-lg text-muted-foreground">
          Vamos configurar sua conta para começar a otimizar os custos do seu restaurante.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        {FEATURES.map((feature, index) => {
          const Icon = feature.icon
          return (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-left">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-6">
        <h3 className="font-semibold mb-2">🎯 O que você vai conseguir:</h3>
        <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-md mx-auto">
          <li>• Reduzir seu CMV em até 15% nos primeiros 3 meses</li>
          <li>• Identificar produtos com maior rentabilidade</li>
          <li>• Acompanhar variações de preços automaticamente</li>
          <li>• Tomar decisões baseadas em dados precisos</li>
        </ul>
      </div>

      <div className="pt-4">
        <Button onClick={handleNext} size="lg" className="w-full sm:w-auto px-8">
          Vamos começar! 🚀
        </Button>
      </div>
    </div>
  )
}

// src/app/onboarding/profile/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'

import { useAuth } from '@/components/providers/providers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { onboardingProfileSchema, type OnboardingProfileInput } from '@/lib/validations/profile'
import { RESTAURANT_TYPES } from '@/lib/constants/units'

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { profile, updateProfile } = useAuth()
  const { toast } = useToast()

  const form = useForm<OnboardingProfileInput>({
    resolver: zodResolver(onboardingProfileSchema),
    defaultValues: {
      nomeCompleto: profile?.nome_completo || '',
      nomeRestaurante: profile?.nome_restaurante || '',
      metaCmvMensal: profile?.meta_cmv_mensal || 30,
      tipoRestaurante: '',
    },
  })

  const onSubmit = async (data: OnboardingProfileInput) => {
    setIsLoading(true)
    
    try {
      const { error } = await updateProfile({
        nome_completo: data.nomeCompleto,
        nome_restaurante: data.nomeRestaurante,
        meta_cmv_mensal: data.metaCmvMensal,
      })
      
      if (error) {
        toast({
          title: 'Erro ao salvar perfil',
          description: error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Perfil salvo com sucesso!',
        description: 'Suas informações foram atualizadas.',
      })
      
      router.push('/onboarding/demo-data')
      
    } catch (error) {
      toast({
        title: 'Erro ao salvar perfil',
        description: 'Algo deu errado. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Configure seu perfil</h1>
        <p className="text-muted-foreground">
          Algumas informações sobre você e seu restaurante para personalizar sua experiência.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="nomeCompleto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nomeRestaurante"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do restaurante</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="tipoRestaurante"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de estabelecimento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo do seu restaurante" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {RESTAURANT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Isso nos ajuda a personalizar relatórios e sugestões para o seu tipo de negócio.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="metaCmvMensal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meta de CMV mensal (%)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type="number"
                      min="5"
                      max="80"
                      step="0.5"
                      disabled={isLoading}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </FormControl>
                <FormDescription>
                  Percentual ideal de CMV para o seu restaurante. A média do setor é entre 25-35%.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                'Continuar'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

// src/app/onboarding/demo-data/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Database, Loader2, Package, ShoppingCart, Utensils, X } from 'lucide-react'

const DEMO_OPTIONS = [
  {
    id: 'basic',
    title: 'Dados Básicos',
    description: 'Produtos e receitas essenciais para começar rapidamente',
    items: ['10 produtos básicos', '5 receitas simples', '2 fornecedores'],
    icon: Package,
    recommended: true,
  },
  {
    id: 'restaurant',
    title: 'Restaurante Completo',
    description: 'Dataset abrangente para restaurantes tradicionais',
    items: ['50+ produtos', '20+ receitas', '5+ fornecedores', 'Categorias organizadas'],
    icon: Utensils,
    recommended: false,
  },
  {
    id: 'pizzaria',
    title: 'Pizzaria',
    description: 'Especializado para pizzarias e similares',
    items: ['Ingredientes para pizza', '15+ sabores', 'Massas e molhos', 'Fornecedores especializados'],
    icon: ShoppingCart,
    recommended: false,
  },
]

export default function DemoDataPage() {
  const [selectedOption, setSelectedOption] = useState<string | null>('basic')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSkip = () => {
    router.push('/onboarding/complete')
  }

  const handleImportData = async () => {
    if (!selectedOption) return

    setIsLoading(true)
    
    try {
      // Simulação de importação de dados
      // Em produção, isso faria uma chamada para API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: 'Dados importados com sucesso!',
        description: 'Seus dados de exemplo foram adicionados à sua conta.',
      })
      
      router.push('/onboarding/complete')
      
    } catch (error) {
      toast({
        title: 'Erro ao importar dados',
        description: 'Algo deu errado. Você pode adicionar dados manualmente depois.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Dados de exemplo</h1>
        <p className="text-muted-foreground">
          Quer começar com alguns dados de exemplo? Isso vai te ajudar a explorar o sistema mais rapidamente.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {DEMO_OPTIONS.map((option) => {
          const Icon = option.icon
          const isSelected = selectedOption === option.id
          
          return (
            <Card 
              key={option.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary border-primary' : ''
              }`}
              onClick={() => setSelectedOption(option.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {option.title}
                        {option.recommended && (
                          <Badge variant="success" className="text-xs">
                            Recomendado
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{option.description}</CardDescription>
                    </div>
                  </div>
                  
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-primary bg-primary' : 'border-muted'
                  }`}>
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {option.items.map((item, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Database className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
              Não se preocupe!
            </p>
            <p className="text-yellow-700 dark:text-yellow-300">
              Você pode sempre adicionar, editar ou remover dados depois. 
              Os dados de exemplo são apenas um ponto de partida.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          variant="outline"
          onClick={handleSkip}
          disabled={isLoading}
          className="flex-1 sm:flex-none"
        >
          <X className="h-4 w-4 mr-2" />
          Pular e começar do zero
        </Button>
        
        <Button
          onClick={handleImportData}
          disabled={!selectedOption || isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Importando dados...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Importar dados selecionados
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// src/app/onboarding/complete/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/providers/providers'
import { useToast } from '@/hooks/use-toast'
import { 
  CheckCircle, 
  Loader2, 
  Rocket, 
  BookOpen, 
  BarChart3, 
  Package,
  ArrowRight
} from 'lucide-react'

const NEXT_STEPS = [
  {
    icon: Package,
    title: 'Adicionar seus produtos',
    description: 'Cadastre os ingredientes que você usa no seu restaurante',
    action: '/produtos/novo',
  },
  {
    icon: BookOpen,
    title: 'Criar suas receitas',
    description: 'Monte fichas técnicas com cálculo automático de CMV',
    action: '/receitas/nova',
  },
  {
    icon: BarChart3,
    title: 'Ver relatórios',
    description: 'Analise seus custos e encontre oportunidades de otimização',
    action: '/relatorios',
  },
]

export default function CompletePage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { updateProfile } = useAuth()
  const { toast } = useToast()

  const handleComplete = async () => {
    setIsLoading(true)
    
    try {
      // Marcar onboarding como completo
      const { error } = await updateProfile({
        onboarding_completed: true,
      })
      
      if (error) {
        toast({
          title: 'Erro ao finalizar configuração',
          description: error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Configuração concluída! 🎉',
        description: 'Bem-vindo ao CMV Control!',
      })
      
      // Pequeno delay para mostrar o toast
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
      
    } catch (error) {
      toast({
        title: 'Erro ao finalizar configuração',
        description: 'Algo deu errado. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="text-center space-y-6">
      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Tudo pronto! 🎉</h1>
          <p className="text-lg text-muted-foreground">
            Sua conta está configurada e você está pronto para começar a otimizar os custos do seu restaurante.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-lg p-6">
        <h3 className="font-semibold mb-2 flex items-center justify-center gap-2">
          <Rocket className="h-5 w-5" />
          Próximos passos recomendados
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Para aproveitar ao máximo o CMV Control, sugerimos que você:
        </p>
        
        <div className="grid grid-cols-1 gap-3">
          {NEXT_STEPS.map((step, index) => {
            const Icon = step.icon
            return (
              <Card key={index} className="border-2 hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-medium">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-6">
        <h3 className="font-semibold mb-2">💡 Dica importante</h3>
        <p className="text-sm text-muted-foreground">
          Para obter resultados precisos no cálculo do CMV, mantenha sempre os preços dos seus produtos atualizados. 
          O sistema enviará lembretes automáticos quando detectar variações significativas nos preços.
        </p>
      </div>

      <div className="pt-6">
        <Button 
          onClick={handleComplete} 
          size="lg" 
          disabled={isLoading}
          className="w-full sm:w-auto px-8"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Finalizando...
            </>
          ) : (
            <>
              Ir para o Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground mt-4">
          Você pode sempre acessar este tutorial novamente nas configurações.
        </p>
      </div>
    </div>
  )
}