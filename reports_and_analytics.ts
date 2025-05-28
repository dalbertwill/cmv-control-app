// src/app/(protected)/relatorios/page.tsx
'use client'

import { useState } from 'react'
import { Calendar, Download, TrendingUp, TrendingDown, DollarSign, Package, Utensils, BarChart3 } from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CMVChart } from '@/components/reports/CMVChart'
import { ProfitabilityChart } from '@/components/reports/ProfitabilityChart'
import { CostAnalysisTable } from '@/components/reports/CostAnalysisTable'
import { TopProductsChart } from '@/components/reports/TopProductsChart'
import { cn } from '@/lib/utils'

// Mock data - Em produção, viria de APIs
const MOCK_DATA = {
  overview: {
    totalRecipes: 24,
    avgCMV: 28.5,
    totalCost: 15420.50,
    profitMargin: 42.3,
    topRecipe: 'Pizza Margherita',
    worstCMV: 'Hambúrguer Premium'
  },
  cmvTrend: [
    { month: 'Jan', cmv: 32.1, target: 30 },
    { month: 'Fev', cmv: 29.8, target: 30 },
    { month: 'Mar', cmv: 28.5, target: 30 },
    { month: 'Abr', cmv: 27.2, target: 30 },
    { month: 'Mai', cmv: 28.5, target: 30 },
  ],
  profitability: [
    { name: 'Pizza Margherita', revenue: 4500, cost: 1200, profit: 3300, cmv: 26.7 },
    { name: 'Hambúrguer Clássico', revenue: 3200, cost: 1100, profit: 2100, cmv: 34.4 },
    { name: 'Salada Caesar', revenue: 1800, cost: 320, profit: 1480, cmv: 17.8 },
    { name: 'Massa Carbonara', revenue: 2800, cost: 850, profit: 1950, cmv: 30.4 },
    { name: 'Risotto Funghi', revenue: 2200, cost: 750, profit: 1450, cmv: 34.1 },
  ],
  topProducts: [
    { name: 'Tomate', usage: 85, cost: 340, recipes: 12 },
    { name: 'Queijo Mussarela', usage: 78, cost: 520, recipes: 8 },
    { name: 'Frango', usage: 65, cost: 680, recipes: 6 },
    { name: 'Massa', usage: 45, cost: 280, recipes: 5 },
    { name: 'Alface', usage: 42, cost: 120, recipes: 7 },
  ]
}

export default function RelatoriosPage() {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })
  const [period, setPeriod] = useState('month')

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting report...')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Análise detalhada de custos, CMV e rentabilidade
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CMV Médio</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {MOCK_DATA.overview.avgCMV}%
            </div>
            <p className="text-xs text-muted-foreground">
              -2.3% desde o mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas Ativas</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {MOCK_DATA.overview.totalRecipes}
            </div>
            <p className="text-xs text-muted-foreground">
              +3 novas receitas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(MOCK_DATA.overview.totalCost)}
            </div>
            <p className="text-xs text-muted-foreground">
              +8.2% desde o mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Bruta</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {MOCK_DATA.overview.profitMargin}%
            </div>
            <p className="text-xs text-muted-foreground">
              +1.8% desde o mês passado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Reports */}
      <Tabs defaultValue="cmv" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cmv">Análise de CMV</TabsTrigger>
          <TabsTrigger value="profitability">Rentabilidade</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
        </TabsList>

        <TabsContent value="cmv" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CMVChart data={MOCK_DATA.cmvTrend} />
            <Card>
              <CardHeader>
                <CardTitle>Análise de Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Receita com menor CMV</span>
                    <div className="text-right">
                      <p className="font-medium">{MOCK_DATA.overview.topRecipe}</p>
                      <Badge variant="success" className="text-xs">17.8%</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Receita com maior CMV</span>
                    <div className="text-right">
                      <p className="font-medium">{MOCK_DATA.overview.worstCMV}</p>
                      <Badge variant="destructive" className="text-xs">45.2%</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Meta de CMV</span>
                    <div className="text-right">
                      <p className="font-medium">30.0%</p>
                      <Badge variant="info" className="text-xs">Meta atual</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Recomendações</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Revisar receita do Hambúrguer Premium</li>
                    <li>• Considerar fornecedores alternativos</li>
                    <li>• Otimizar porções dos ingredientes</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profitability" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ProfitabilityChart data={MOCK_DATA.profitability} />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Receitas</CardTitle>
                <CardDescription>Por rentabilidade</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {MOCK_DATA.profitability.slice(0, 5).map((recipe, index) => (
                    <div key={recipe.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{recipe.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(recipe.profit)}
                          </p>
                        </div>
                      </div>
                      <Badge variant={recipe.cmv <= 30 ? 'success' : 'warning'}>
                        {recipe.cmv.toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TopProductsChart data={MOCK_DATA.topProducts} />
            <CostAnalysisTable data={MOCK_DATA.topProducts} />
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Em desenvolvimento</CardTitle>
              <CardDescription>
                Análise de tendências estará disponível em breve
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p>Análise de tendências em desenvolvimento</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// src/components/ui/tabs.tsx
import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }

// src/components/reports/CMVChart.tsx
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface CMVChartProps {
  data: Array<{
    month: string
    cmv: number
    target: number
  }>
}

export function CMVChart({ data }: CMVChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução do CMV</CardTitle>
        <CardDescription>
          Acompanhe a evolução do CMV ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value: number, name: string) => [
                `${value.toFixed(1)}%`, 
                name === 'cmv' ? 'CMV' : 'Meta'
              ]}
            />
            <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="5 5" />
            <Line 
              type="monotone" 
              dataKey="cmv" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="target" 
              stroke="#ef4444" 
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// src/components/reports/ProfitabilityChart.tsx
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ProfitabilityChartProps {
  data: Array<{
    name: string
    revenue: number
    cost: number
    profit: number
    cmv: number
  }>
}

export function ProfitabilityChart({ data }: ProfitabilityChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Rentabilidade</CardTitle>
        <CardDescription>
          Receita vs Custo por receita
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={100}
              fontSize={12}
            />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => `Receita: ${label}`}
            />
            <Bar dataKey="revenue" fill="#3b82f6" name="Receita" />
            <Bar dataKey="cost" fill="#ef4444" name="Custo" />
            <Bar dataKey="profit" fill="#22c55e" name="Lucro" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// src/components/reports/TopProductsChart.tsx
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface TopProductsChartProps {
  data: Array<{
    name: string
    usage: number
    cost: number
    recipes: number
  }>
}

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6']

export function TopProductsChart({ data }: TopProductsChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtos Mais Utilizados</CardTitle>
        <CardDescription>
          Distribuição de uso por produto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, usage }) => `${name}: ${usage}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="usage"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name, props) => [
                `${value}% de uso`,
                `Custo: ${formatCurrency(props.payload.cost)}`
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// src/components/reports/CostAnalysisTable.tsx
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface CostAnalysisTableProps {
  data: Array<{
    name: string
    usage: number
    cost: number
    recipes: number
  }>
}

export function CostAnalysisTable({ data }: CostAnalysisTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const getCostLevel = (cost: number) => {
    if (cost < 200) return { variant: 'success' as const, label: 'Baixo' }
    if (cost < 500) return { variant: 'warning' as const, label: 'Médio' }
    return { variant: 'destructive' as const, label: 'Alto' }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Custos</CardTitle>
        <CardDescription>
          Detalhamento de custos por produto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((product, index) => {
            const costLevel = getCostLevel(product.cost)
            return (
              <div key={product.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Usado em {product.recipes} receitas
                    </p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-medium">{formatCurrency(product.cost)}</p>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {product.usage}% uso
                    </Badge>
                    <Badge variant={costLevel.variant} className="text-xs">
                      {costLevel.label}
                    </Badge>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// src/app/(protected)/configuracoes/page.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/providers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  User, 
  Bell, 
  Palette, 
  Shield, 
  Download, 
  Upload,
  Trash2,
  AlertTriangle
} from 'lucide-react'

export default function ConfiguracoesPage() {
  const { profile, updateProfile } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const [settings, setSettings] = useState({
    // Profile settings
    nomeCompleto: profile?.nome_completo || '',
    nomeRestaurante: profile?.nome_restaurante || '',
    metaCmvMensal: profile?.meta_cmv_mensal || 30,
    
    // App settings
    tema: profile?.tema || 'system',
    notificacoesAtivas: profile?.notificacoes_ativas ?? true,
    backupAutomatico: profile?.backup_automatico ?? false,
    
    // Display settings
    moeda: profile?.moeda || 'BRL',
    formatoData: profile?.formato_data || 'dd/MM/yyyy',
    timezone: profile?.timezone || 'America/Sao_Paulo',
  })

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const { error } = await updateProfile({
        nome_completo: settings.nomeCompleto,
        nome_restaurante: settings.nomeRestaurante,
        meta_cmv_mensal: settings.metaCmvMensal,
        tema: settings.tema,
        notificacoes_ativas: settings.notificacoesAtivas,
        backup_automatico: settings.backupAutomatico,
        moeda: settings.moeda,
        formato_data: settings.formatoData,
        timezone: settings.timezone,
      })

      if (error) {
        toast({
          title: 'Erro ao salvar configurações',
          description: error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Configurações salvas!',
        description: 'Suas alterações foram aplicadas com sucesso.',
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar configurações',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportData = () => {
    // TODO: Implement data export
    toast({
      title: 'Exportação iniciada',
      description: 'Seus dados estão sendo preparados para download.',
    })
  }

  const handleImportData = () => {
    // TODO: Implement data import
    toast({
      title: 'Importação disponível em breve',
      description: 'Esta funcionalidade estará disponível na próxima versão.',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e configurações da conta
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Dados
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais e do restaurante
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nomeCompleto">Nome completo</Label>
                  <Input
                    id="nomeCompleto"
                    value={settings.nomeCompleto}
                    onChange={(e) => setSettings({ ...settings, nomeCompleto: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nomeRestaurante">Nome do restaurante</Label>
                  <Input
                    id="nomeRestaurante"
                    value={settings.nomeRestaurante}
                    onChange={(e) => setSettings({ ...settings, nomeRestaurante: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaCmv">Meta de CMV mensal (%)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="metaCmv"
                    type="number"
                    min="5"
                    max="80"
                    step="0.5"
                    value={settings.metaCmvMensal}
                    onChange={(e) => setSettings({ ...settings, metaCmvMensal: parseFloat(e.target.value) || 30 })}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">
                    A média do setor é entre 25-35%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>
                Configure quando e como receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações ativas</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações do sistema
                  </p>
                </div>
                <Switch
                  checked={settings.notificacoesAtivas}
                  onCheckedChange={(checked) => setSettings({ ...settings, notificacoesAtivas: checked })}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Tipos de notificação</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Estoque baixo</Label>
                      <p className="text-sm text-muted-foreground">
                        Quando produtos atingem estoque mínimo
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Preços alterados</Label>
                      <p className="text-sm text-muted-foreground">
                        Quando preços de produtos são atualizados
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>CMV alto</Label>
                      <p className="text-sm text-muted-foreground">
                        Quando receitas excedem a meta de CMV
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Relatórios semanais</Label>
                      <p className="text-sm text-muted-foreground">
                        Resumo semanal de performance
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>
                Personalize a aparência do aplicativo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Tema</Label>
                <Select
                  value={settings.tema}
                  onValueChange={(value) => setSettings({ ...settings, tema: value })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Moeda</Label>
                  <Select
                    value={settings.moeda}
                    onValueChange={(value) => setSettings({ ...settings, moeda: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real (R$)</SelectItem>
                      <SelectItem value="USD">Dólar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Formato de data</Label>
                  <Select
                    value={settings.formatoData}
                    onValueChange={(value) => setSettings({ ...settings, formatoData: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/MM/yyyy">DD/MM/AAAA</SelectItem>
                      <SelectItem value="MM/dd/yyyy">MM/DD/AAAA</SelectItem>
                      <SelectItem value="yyyy-MM-dd">AAAA-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Settings */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Backup e Dados</CardTitle>
              <CardDescription>
                Gerencie seus dados e configurações de backup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Backup automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Fazer backup automático dos dados semanalmente
                  </p>
                </div>
                <Switch
                  checked={settings.backupAutomatico}
                  onCheckedChange={(checked) => setSettings({ ...settings, backupAutomatico: checked })}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Exportar/Importar Dados</h4>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Button variant="outline" onClick={handleExportData}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Dados
                  </Button>
                  
                  <Button variant="outline" onClick={handleImportData}>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Dados
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Exporte seus dados em formato JSON para backup ou migração. 
                  A importação permite restaurar dados de um backup anterior.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Segurança da Conta</CardTitle>
              <CardDescription>
                Gerencie a segurança e privacidade da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email da conta</Label>
                    <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Alterar email
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Senha</Label>
                    <p className="text-sm text-muted-foreground">••••••••</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Alterar senha
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Zona de Perigo
                </h4>
                
                <div className="p-4 border border-destructive/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-destructive">Excluir conta</Label>
                      <p className="text-sm text-muted-foreground">
                        Esta ação é irreversível. Todos os seus dados serão perdidos.
                      </p>
                    </div>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir conta
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </div>
    </div>
  )
}