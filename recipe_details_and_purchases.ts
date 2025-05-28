// src/app/(protected)/receitas/[id]/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Calculator, Clock, Users, ChefHat, Share } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useRecipe, useDeleteRecipe } from '@/lib/queries/recipes'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface RecipeDetailsPageProps {
  params: { id: string }
}

export default function RecipeDetailsPage({ params }: RecipeDetailsPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const { data: recipe, isLoading, error } = useRecipe(params.id)
  const deleteRecipe = useDeleteRecipe()

  const handleEdit = () => {
    router.push(`/receitas/${params.id}/editar`)
  }

  const handleDelete = async () => {
    if (!recipe) return
    
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a receita "${recipe.nome}"? Esta ação não pode ser desfeita.`
    )
    
    if (!confirmed) return

    try {
      await deleteRecipe.mutateAsync(params.id)
      toast({
        title: 'Receita excluída',
        description: `${recipe.nome} foi excluída com sucesso.`,
      })
      router.push('/receitas')
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir receita',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const getCMVPercentage = () => {
    if (!recipe?.preco_venda_sugerido || !recipe?.custo_total) return 0
    return (recipe.custo_total / recipe.preco_venda_sugerido) * 100
  }

  const getCMVColor = (cmv: number) => {
    if (cmv <= 25) return 'text-green-600'
    if (cmv <= 35) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error || !recipe) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">
            Receita não encontrada
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            A receita que você está procurando não existe ou foi removida.
          </p>
          <Button
            onClick={() => router.push('/receitas')}
            className="mt-4"
          >
            Voltar às receitas
          </Button>
        </div>
      </div>
    )
  }

  const cmvPercentage = getCMVPercentage()

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
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{recipe.nome}</h1>
          <p className="text-muted-foreground">
            Ficha técnica detalhada com cálculo de CMV
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="outline" onClick={handleDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recipe.descricao && (
                <div>
                  <h4 className="font-medium mb-2">Descrição</h4>
                  <p className="text-muted-foreground">{recipe.descricao}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {recipe.categoria && (
                  <div>
                    <h4 className="font-medium mb-1">Categoria</h4>
                    <Badge variant="outline">{recipe.categoria}</Badge>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-1">Status</h4>
                  <Badge variant={recipe.ativa ? 'success' : 'secondary'}>
                    {recipe.ativa ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {recipe.tempo_preparo && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tempo</p>
                      <p className="font-medium">{recipe.tempo_preparo} min</p>
                    </div>
                  </div>
                )}

                {recipe.rendimento_porcoes && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Rendimento</p>
                      <p className="font-medium">{recipe.rendimento_porcoes} porções</p>
                    </div>
                  </div>
                )}

                {recipe.margem_lucro_desejada && recipe.margem_lucro_desejada > 0 && (
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Margem</p>
                      <p className="font-medium">{recipe.margem_lucro_desejada}%</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ingredients */}
          <Card>
            <CardHeader>
              <CardTitle>Ingredientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recipe.recipe_ingredients?.map((ingredient, index) => (
                  <div key={ingredient.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{ingredient.product.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {ingredient.quantidade} {ingredient.unidade}
                        {ingredient.observacoes && ` • ${ingredient.observacoes}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(ingredient.quantidade * ingredient.product.preco_atual)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(ingredient.product.preco_atual)}/{ingredient.product.unidade}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Cost Analysis */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Análise de Custos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custo Total</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(recipe.custo_total)}
                  </span>
                </div>

                {recipe.rendimento_porcoes && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Custo por Porção</span>
                    <span className="font-medium">
                      {formatCurrency((recipe.custo_total || 0) / recipe.rendimento_porcoes)}
                    </span>
                  </div>
                )}

                <Separator />

                {recipe.preco_venda_sugerido && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Preço de Venda</span>
                      <span className="font-bold text-lg">
                        {formatCurrency(recipe.preco_venda_sugerido)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Margem Bruta</span>
                      <span className="font-medium">
                        {formatCurrency((recipe.preco_venda_sugerido || 0) - (recipe.custo_total || 0))}
                      </span>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">CMV</span>
                      <div className="text-right">
                        <span className={cn("font-bold text-xl", getCMVColor(cmvPercentage))}>
                          {cmvPercentage.toFixed(1)}%
                        </span>
                        <Badge 
                          variant={cmvPercentage <= 30 ? 'success' : cmvPercentage <= 40 ? 'warning' : 'destructive'}
                          className="ml-2"
                        >
                          {cmvPercentage <= 30 ? 'Excelente' : cmvPercentage <= 40 ? 'Bom' : 'Alto'}
                        </Badge>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* CMV Analysis */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Análise do CMV</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  {cmvPercentage <= 25 && (
                    <p>🟢 Excelente! CMV muito baixo, alta rentabilidade.</p>
                  )}
                  {cmvPercentage > 25 && cmvPercentage <= 35 && (
                    <p>🟡 Bom CMV, dentro da média do setor.</p>
                  )}
                  {cmvPercentage > 35 && (
                    <p>🔴 CMV alto, considere revisar ingredientes ou preço.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Share className="h-4 w-4 mr-2" />
                Exportar Ficha Técnica
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calculator className="h-4 w-4 mr-2" />
                Simular Novo Preço
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// src/components/ui/separator.tsx
import * as React from 'react'
import * as SeparatorPrimitive from '@radix-ui/react-separator'
import { cn } from '@/lib/utils'

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = 'horizontal', decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }

// src/lib/validations/purchase.ts
import { z } from 'zod'

export const purchaseItemSchema = z.object({
  productId: z.string({ required_error: 'Produto é obrigatório' }),
  quantidade: z
    .number({ required_error: 'Quantidade é obrigatória' })
    .min(0.01, 'Quantidade deve ser maior que zero'),
  precoUnitario: z
    .number({ required_error: 'Preço é obrigatório' })
    .min(0.01, 'Preço deve ser maior que zero'),
})

export const purchaseSchema = z.object({
  dataCompra: z.string({ required_error: 'Data da compra é obrigatória' }),
  supplierId: z.string().optional(),
  numeroNota: z.string().optional(),
  desconto: z.number().min(0, 'Desconto não pode ser negativo').optional().default(0),
  impostos: z.number().min(0, 'Impostos não podem ser negativos').optional().default(0),
  observacoes: z.string().optional(),
  items: z
    .array(purchaseItemSchema)
    .min(1, 'Compra deve ter pelo menos 1 item'),
})

export type PurchaseInput = z.infer<typeof purchaseSchema>
export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>

// src/lib/queries/purchases.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { Purchase, PurchaseWithItems } from '@/lib/supabase/types'
import type { PurchaseInput } from '@/lib/validations/purchase'

export const PURCHASE_QUERY_KEYS = {
  all: ['purchases'] as const,
  lists: () => [...PURCHASE_QUERY_KEYS.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...PURCHASE_QUERY_KEYS.lists(), filters] as const,
  details: () => [...PURCHASE_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PURCHASE_QUERY_KEYS.details(), id] as const,
}

export function usePurchases(filters: {
  search?: string
  supplier?: string
  startDate?: string
  endDate?: string
} = {}) {
  return useQuery({
    queryKey: PURCHASE_QUERY_KEYS.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('purchases')
        .select(`
          *,
          supplier:suppliers(id, nome)
        `)
        .order('data_compra', { ascending: false })

      if (filters.supplier) {
        query = query.eq('supplier_id', filters.supplier)
      }

      if (filters.startDate) {
        query = query.gte('data_compra', filters.startDate)
      }

      if (filters.endDate) {
        query = query.lte('data_compra', filters.endDate)
      }

      const { data, error } = await query

      if (error) throw error
      return data as PurchaseWithItems[]
    },
  })
}

export function usePurchase(id: string) {
  return useQuery({
    queryKey: PURCHASE_QUERY_KEYS.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          supplier:suppliers(id, nome),
          purchase_items (
            *,
            product:products (
              id,
              nome,
              unidade
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as PurchaseWithItems
    },
    enabled: !!id,
  })
}

export function useCreatePurchase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: PurchaseInput) => {
      // Calculate total
      const valorTotal = data.items.reduce((sum, item) => {
        return sum + (item.quantidade * item.precoUnitario)
      }, 0) - (data.desconto || 0) + (data.impostos || 0)

      // Create purchase
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert([{
          data_compra: data.dataCompra,
          supplier_id: data.supplierId || null,
          numero_nota: data.numeroNota,
          valor_total: valorTotal,
          desconto: data.desconto,
          impostos: data.impostos,
          observacoes: data.observacoes,
        }])
        .select()
        .single()

      if (purchaseError) throw purchaseError

      // Create items
      const items = data.items.map(item => ({
        purchase_id: purchase.id,
        product_id: item.productId,
        quantidade: item.quantidade,
        preco_unitario: item.precoUnitario,
        subtotal: item.quantidade * item.precoUnitario,
      }))

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(items)

      if (itemsError) throw itemsError

      return purchase as Purchase
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PURCHASE_QUERY_KEYS.all })
      // Also invalidate products since prices may have updated
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

// src/app/(protected)/compras/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Calendar, Package, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { PurchaseCard } from '@/components/purchases/PurchaseCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { usePurchases } from '@/lib/queries/purchases'
import { useSuppliers } from '@/lib/queries/products'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { cn } from '@/lib/utils'

export default function PurchasesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    supplier: '',
    startDate: '',
    endDate: '',
  })

  const debouncedSearch = useDebounce(search, 300)
  
  const { data: purchases, isLoading, error } = usePurchases({
    search: debouncedSearch,
    ...filters,
  })

  const { data: suppliers } = useSuppliers()

  // Calculate totals
  const totalPurchases = purchases?.length || 0
  const totalValue = purchases?.reduce((sum, purchase) => sum + purchase.valor_total, 0) || 0
  const currentMonthValue = purchases?.filter(purchase => {
    const purchaseDate = new Date(purchase.data_compra)
    const currentDate = new Date()
    return purchaseDate.getMonth() === currentDate.getMonth() &&
           purchaseDate.getFullYear() === currentDate.getFullYear()
  }).reduce((sum, purchase) => sum + purchase.valor_total, 0) || 0

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">
            Erro ao carregar compras
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {error.message}
          </p>
        </div>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compras</h1>
          <p className="text-muted-foreground">
            Registre compras e atualize preços automaticamente
          </p>
        </div>

        <Button onClick={() => router.push('/compras/nova')}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Compra
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Compras
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPurchases}</div>
            <p className="text-xs text-muted-foreground">
              Compras registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Valor total das compras
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Compras do Mês
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMonthValue)}</div>
            <p className="text-xs text-muted-foreground">
              Valor do mês atual
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nota fiscal..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Supplier */}
            <Select
              value={filters.supplier}
              onValueChange={(value) => setFilters({ ...filters, supplier: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os fornecedores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os fornecedores</SelectItem>
                {suppliers?.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Start Date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal',
                    !filters.startDate && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {filters.startDate ? (
                    format(new Date(filters.startDate), 'PPP', { locale: ptBR })
                  ) : (
                    'Data inicial'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filters.startDate ? new Date(filters.startDate) : undefined}
                  onSelect={(date) => 
                    setFilters({ 
                      ...filters, 
                      startDate: date?.toISOString().split('T')[0] || '' 
                    })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* End Date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal',
                    !filters.endDate && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {filters.endDate ? (
                    format(new Date(filters.endDate), 'PPP', { locale: ptBR })
                  ) : (
                    'Data final'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filters.endDate ? new Date(filters.endDate) : undefined}
                  onSelect={(date) => 
                    setFilters({ 
                      ...filters, 
                      endDate: date?.toISOString().split('T')[0] || '' 
                    })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {purchases?.length || 0} compras encontradas
          </span>
        </div>

        {/* Purchases list */}
        {!purchases || purchases.length === 0 ? (
          <EmptyState
            title="Nenhuma compra encontrada"
            description="Não há compras que correspondam aos filtros selecionados."
            action={
              <Button onClick={() => router.push('/compras/nova')}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar primeira compra
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <PurchaseCard key={purchase.id} purchase={purchase} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// src/components/purchases/PurchaseCard.tsx
'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Package, Receipt, Building } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PurchaseWithItems } from '@/lib/supabase/types'

interface PurchaseCardProps {
  purchase: PurchaseWithItems
}

export function PurchaseCard({ purchase }: PurchaseCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const itemsCount = purchase.purchase_items?.length || 0

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <Link
                href={`/compras/${purchase.id}`}
                className="font-medium hover:text-primary transition-colors"
              >
                {purchase.numero_nota ? `Nota ${purchase.numero_nota}` : `Compra #${purchase.id.slice(-6)}`}
              </Link>
              
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(purchase.data_compra), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
                
                {purchase.supplier && (
                  <div className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {purchase.supplier.nome}
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  {itemsCount} {itemsCount === 1 ? 'item' : 'itens'}
                </div>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-lg font-bold">
              {formatCurrency(purchase.valor_total)}
            </p>
            
            {(purchase.desconto || purchase.impostos) && (
              <div className="flex gap-2 mt-1">
                {purchase.desconto && purchase.desconto > 0 && (
                  <Badge variant="success" className="text-xs">
                    -{formatCurrency(purchase.desconto)}
                  </Badge>
                )}
                {purchase.impostos && purchase.impostos > 0 && (
                  <Badge variant="warning" className="text-xs">
                    +{formatCurrency(purchase.impostos)}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {purchase.observacoes && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm text-muted-foreground">
              {purchase.observacoes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}