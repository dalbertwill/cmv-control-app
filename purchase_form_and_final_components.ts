// src/app/(protected)/compras/nova/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PurchaseForm } from '@/components/purchases/PurchaseForm'
import { useCreatePurchase } from '@/lib/queries/purchases'
import { useToast } from '@/hooks/use-toast'
import type { PurchaseInput } from '@/lib/validations/purchase'

export default function NovaCompraPage() {
  const router = useRouter()
  const { toast } = useToast()
  const createPurchase = useCreatePurchase()

  const handleSubmit = async (data: PurchaseInput) => {
    try {
      const purchase = await createPurchase.mutateAsync(data)
      
      toast({
        title: 'Compra registrada com sucesso!',
        description: 'Preços e estoques foram atualizados automaticamente.',
      })
      
      router.push('/compras')
    } catch (error: any) {
      toast({
        title: 'Erro ao registrar compra',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Compra</h1>
          <p className="text-muted-foreground">
            Registre uma compra e atualize preços automaticamente
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Compra</CardTitle>
          <CardDescription>
            Adicione os produtos comprados. Os preços e estoques serão atualizados automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PurchaseForm
            onSubmit={handleSubmit}
            isLoading={createPurchase.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}

// src/components/purchases/PurchaseForm.tsx
'use client'

import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon, Plus, Trash2, Receipt } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { useProducts, useSuppliers } from '@/lib/queries/products'
import { purchaseSchema, type PurchaseInput } from '@/lib/validations/purchase'
import { cn } from '@/lib/utils'

interface PurchaseFormProps {
  onSubmit: (data: PurchaseInput) => Promise<void>
  isLoading?: boolean
}

export function PurchaseForm({ onSubmit, isLoading }: PurchaseFormProps) {
  const [subtotal, setSubtotal] = useState(0)
  const [total, setTotal] = useState(0)
  
  const { data: products } = useProducts({ status: 'active' })
  const { data: suppliers } = useSuppliers()

  const form = useForm<PurchaseInput>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      dataCompra: new Date().toISOString().split('T')[0],
      supplierId: '',
      numeroNota: '',
      desconto: 0,
      impostos: 0,
      observacoes: '',
      items: [
        {
          productId: '',
          quantidade: 1,
          precoUnitario: 0,
        }
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  // Calculate totals when items change
  const watchedItems = form.watch('items')
  const watchedDesconto = form.watch('desconto') || 0
  const watchedImpostos = form.watch('impostos') || 0

  React.useEffect(() => {
    const newSubtotal = watchedItems.reduce((sum, item) => {
      return sum + (item.quantidade * item.precoUnitario)
    }, 0)
    
    const newTotal = newSubtotal - watchedDesconto + watchedImpostos
    
    setSubtotal(newSubtotal)
    setTotal(newTotal)
  }, [watchedItems, watchedDesconto, watchedImpostos])

  const handleSubmit = async (data: PurchaseInput) => {
    await onSubmit(data)
  }

  const addItem = () => {
    append({
      productId: '',
      quantidade: 1,
      precoUnitario: 0,
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Purchase Header */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Informações da Compra</h3>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="dataCompra"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data da compra *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                          disabled={isLoading}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(new Date(field.value), 'PPP', { locale: ptBR })
                          ) : (
                            'Selecione uma data'
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um fornecedor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers?.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numeroNota"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número da nota fiscal</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: 12345"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Items */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Itens da Compra</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar item
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div className="sm:col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.productId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Produto</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value)
                                // Auto-fill price from product
                                const product = products?.find(p => p.id === value)
                                if (product) {
                                  form.setValue(`items.${index}.precoUnitario`, product.preco_atual)
                                }
                              }}
                              defaultValue={field.value}
                              disabled={isLoading}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um produto" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {products?.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    <div className="flex items-center justify-between w-full">
                                      <span>{product.nome}</span>
                                      <span className="text-sm text-muted-foreground ml-2">
                                        {formatCurrency(product.preco_atual)}/{product.unidade}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`items.${index}.quantidade`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-end gap-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.precoUnitario`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Preço unitário</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => remove(index)}
                          disabled={isLoading}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Item subtotal */}
                  <div className="mt-4 pt-3 border-t flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Subtotal do item:</span>
                    <span className="font-medium">
                      {formatCurrency(
                        (form.watch(`items.${index}.quantidade`) || 0) * 
                        (form.watch(`items.${index}.precoUnitario`) || 0)
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="desconto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desconto</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Desconto aplicado na compra
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="impostos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impostos/Taxas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Impostos e taxas adicionais
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Totals */}
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              
              {watchedDesconto > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto:</span>
                  <span>- {formatCurrency(watchedDesconto)}</span>
                </div>
              )}
              
              {watchedImpostos > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Impostos/Taxas:</span>
                  <span>+ {formatCurrency(watchedImpostos)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observations */}
        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações sobre a compra..."
                  {...field}
                  disabled={isLoading}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit buttons */}
        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            disabled={isLoading || total <= 0}
            className="flex-1 sm:flex-none"
          >
            {isLoading ? 'Registrando...' : 'Registrar compra'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isLoading}
          >
            Limpar
          </Button>
        </div>
      </form>
    </Form>
  )
}

// public/manifest.json
{
  "name": "CMV Control",
  "short_name": "CMV Control",
  "description": "Sistema inteligente para controle de CMV e gestão de custos em restaurantes",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3B82F6",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "categories": ["productivity", "business", "food"],
  "screenshots": [
    {
      "src": "/screenshots/dashboard.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Dashboard do CMV Control"
    },
    {
      "src": "/screenshots/mobile-dashboard.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Dashboard Mobile"
    }
  ]
}

// src/app/page.tsx
'use client'

import Link from 'next/link'
import { useAuth } from '@/components/providers/providers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calculator, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  BarChart3,
  Utensils,
  DollarSign
} from 'lucide-react'

const FEATURES = [
  {
    icon: Calculator,
    title: 'Cálculo Automático de CMV',
    description: 'Calcule automaticamente o custo da mercadoria vendida de cada receita com precisão.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
  },
  {
    icon: Utensils,
    title: 'Fichas Técnicas Inteligentes',
    description: 'Crie receitas detalhadas com cálculo automático de custos e margens.',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
  },
  {
    icon: BarChart3,
    title: 'Relatórios Avançados',
    description: 'Analise tendências, identifique oportunidades e tome decisões baseadas em dados.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
  },
  {
    icon: Clock,
    title: 'Economia de Tempo',
    description: 'Automatize cálculos complexos e foque no que realmente importa: seu negócio.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
  },
]

const BENEFITS = [
  'Reduza seu CMV em até 15% nos primeiros 3 meses',
  'Identifique produtos com maior rentabilidade',
  'Acompanhe variações de preços automaticamente',
  'Tome decisões baseadas em dados precisos',
  'Otimize custos operacionais',
  'Calcule preços de venda ideais',
]

export default function HomePage() {
  const { user } = useAuth()

  if (user) {
    // User is logged in, redirect will be handled by middleware
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">CMV Control</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Começar Grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="outline" className="mb-4">
            Sistema Profissional de Gestão
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Controle Total do seu CMV
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            O sistema mais completo para restaurantes controlarem custos, 
            calcularem CMV e otimizarem a rentabilidade de cada prato.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" asChild>
              <Link href="/register">
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">
                Já tenho conta
              </Link>
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            ✨ Sem cartão de crédito • Setup em 5 minutos • Suporte completo
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">
            Tudo que você precisa para otimizar seus custos
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ferramentas profissionais para gestão completa de custos e cálculo preciso de CMV
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">
                Resultados que você pode esperar
              </h2>
              <p className="text-lg text-muted-foreground">
                Restaurantes que usam CMV Control obtêm resultados mensuráveis
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {BENEFITS.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto border-2 border-primary/20">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl mb-4">
              Pronto para otimizar seus custos?
            </CardTitle>
            <CardDescription className="text-lg">
              Junte-se a centenas de restaurantes que já economizam com o CMV Control
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button size="lg" asChild>
                <Link href="/register">
                  Criar Conta Gratuita
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              <div>
                <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="font-semibold">Economize</p>
                <p className="text-sm text-muted-foreground">até 15% no CMV</p>
              </div>
              <div>
                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="font-semibold">Configure</p>
                <p className="text-sm text-muted-foreground">em 5 minutos</p>
              </div>
              <div>
                <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="font-semibold">Resultados</p>
                <p className="text-sm text-muted-foreground">em 30 dias</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="h-6 w-6 bg-primary rounded flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">CMV Control</span>
            </div>
            
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/termos" className="hover:text-foreground">
                Termos de Uso
              </Link>
              <Link href="/privacidade" className="hover:text-foreground">
                Privacidade
              </Link>
              <Link href="/contato" className="hover:text-foreground">
                Contato
              </Link>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2024 CMV Control. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// .gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output

# Next.js
.next/
out/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# PWA files
public/sw.js
public/workbox-*.js
public/sw.js.map
public/workbox-*.js.map

# Supabase
.supabase/

# README.md
# CMV Control - Sistema de Gestão de Custos para Restaurantes

Um aplicativo web progressivo (PWA) focado em dispositivos móveis para restaurantes gerenciarem produtos, compras, receitas e calcularem o Custo da Mercadoria Vendida (CMV) com insights avançados para otimização de custos operacionais.

## 🚀 Características Principais

- **Controle Total de CMV**: Cálculo automático e preciso do custo da mercadoria vendida
- **Fichas Técnicas Inteligentes**: Receitas com cálculo automático de custos e margens
- **Gestão de Produtos**: Catálogo completo com controle de estoque e histórico de preços
- **Sistema de Compras**: Registro de compras com atualização automática de preços
- **Relatórios Avançados**: Analytics detalhados para tomada de decisões
- **PWA**: Funciona offline e pode ser instalado como app nativo

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: Next.js 14+ com App Router
- **UI**: React 18+, TypeScript, Tailwind CSS, Shadcn/UI
- **Estado**: Zustand + React Query/TanStack Query
- **Gráficos**: Recharts + Chart.js
- **PWA**: next-pwa

### Backend & Infraestrutura
- **BaaS**: Supabase (Auth, PostgreSQL, Storage, Edge Functions)
- **Hospedagem**: Vercel (Frontend) + Supabase (Backend)
- **Cache**: Redis (via Upstash)
- **Monitoramento**: Sentry + Vercel Analytics

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase
- Conta no Vercel (para deploy)

## 🚀 Instalação e Configuração

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/cmv-control-app.git
cd cmv-control-app
```

### 2. Instale as dependências
```bash
npm install
# ou
yarn install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas credenciais:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Configure o banco de dados
Execute o script SQL no Supabase SQL Editor:
```bash
# O arquivo database-schema.sql contém toda a estrutura necessária
```

### 5. Execute o projeto
```bash
npm run dev
# ou
yarn dev
```

Acesse `http://localhost:3000` no seu navegador.

## 📱 Funcionalidades

### Autenticação e Onboarding
- [x] Sistema de login/registro com Supabase Auth
- [x] Onboarding guiado para novos usuários
- [x] Configuração de perfil e preferências

### Gestão de Produtos
- [x] CRUD completo de produtos
- [x] Sistema de categorias com cores
- [x] Gestão de fornecedores
- [x] Histórico de preços
- [x] Controle de estoque
- [x] Alertas de estoque baixo

### Receitas e CMV
- [x] Criação de fichas técnicas
- [x] Cálculo automático de CMV
- [x] Sugestão de preços de venda
- [x] Análise de rentabilidade
- [x] Versionamento de receitas

### Sistema de Compras
- [x] Registro de compras
- [x] Atualização automática de preços
- [x] Gestão de fornecedores
- [x] Controle de notas fiscais

### Dashboard e Relatórios
- [x] Dashboard com métricas principais
- [x] Relatórios de CMV
- [x] Análise de tendências
- [x] Exportação de dados

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia o servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Inicia o servidor de produção
npm run lint         # Executa o linter
npm run type-check   # Verificação de tipos TypeScript

# Testes
npm run test         # Executa testes unitários
npm run test:e2e     # Executa testes E2E
npm run test:coverage # Relatório de cobertura

# Storybook
npm run storybook    # Inicia o Storybook
```

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router do Next.js
│   ├── (auth)/            # Páginas de autenticação
│   ├── (protected)/       # Páginas protegidas
│   └── api/               # API Routes
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn/ui)
│   ├── layout/           # Componentes de layout
│   ├── products/         # Componentes de produtos
│   ├── recipes/          # Componentes de receitas
│   └── common/           # Componentes comuns
├── lib/                  # Utilitários e configurações
│   ├── supabase/         # Cliente Supabase
│   ├── validations/      # Schemas de validação
│   ├── queries/          # React Query hooks
│   └── utils/            # Funções utilitárias
└── types/                # Definições de tipos TypeScript
```

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Supabase
1. Crie um novo projeto no Supabase
2. Execute o script SQL do banco de dados
3. Configure as variáveis de ambiente

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Cobertura
npm run test:coverage
```

## 📖 Documentação

- [Guia de Contribuição](docs/CONTRIBUTING.md)
- [Documentação da API](docs/API.md)
- [Guia de Deploy](docs/DEPLOYMENT.md)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- Email: contato@cmvcontrol.app
- Website: https://cmvcontrol.app
- Documentação: https://docs.cmvcontrol.app

---

Desenvolvido com ❤️ para revolucionar a gestão de custos em restaurantes.