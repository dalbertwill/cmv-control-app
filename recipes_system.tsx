// src/lib/validations/recipe.ts
import { z } from 'zod';

export const recipeIngredientSchema = z.object({
  productId: z.string({ required_error: 'Produto é obrigatório' }),
  quantidade: z
    .number({ required_error: 'Quantidade é obrigatória' })
    .min(0.01, 'Quantidade deve ser maior que zero'),
  unidade: z.string({ required_error: 'Unidade é obrigatória' }),
  observacoes: z.string().optional(),
});

export const recipeSchema = z.object({
  nome: z
    .string({ required_error: 'Nome da receita é obrigatório' })
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  descricao: z.string().optional(),
  categoria: z.string().optional(),
  tempoPreparo: z.number().min(1, 'Tempo deve ser maior que zero').optional(),
  rendimentoPorcoes: z.number().min(1, 'Rendimento deve ser maior que zero').optional().default(1),
  margemLucroDesejada: z
    .number()
    .min(0, 'Margem não pode ser negativa')
    .max(100, 'Margem não pode ser maior que 100%')
    .optional()
    .default(0),
  precoVendaSugerido: z.number().min(0, 'Preço não pode ser negativo').optional(),
  ativa: z.boolean().optional().default(true),
  ingredients: z.array(recipeIngredientSchema).min(1, 'Receita deve ter pelo menos 1 ingrediente'),
});

export type RecipeInput = z.infer<typeof recipeSchema>;
export type RecipeIngredientInput = z.infer<typeof recipeIngredientSchema>;

// src/lib/queries/recipes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { Recipe, RecipeWithIngredients } from '@/lib/supabase/types';
import type { RecipeInput } from '@/lib/validations/recipe';

// Query keys
export const RECIPE_QUERY_KEYS = {
  all: ['recipes'] as const,
  lists: () => [...RECIPE_QUERY_KEYS.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...RECIPE_QUERY_KEYS.lists(), filters] as const,
  details: () => [...RECIPE_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...RECIPE_QUERY_KEYS.details(), id] as const,
};

export function useRecipes(
  filters: {
    search?: string;
    categoria?: string;
    status?: 'active' | 'inactive' | 'all';
  } = {},
) {
  return useQuery({
    queryKey: RECIPE_QUERY_KEYS.list(filters),
    queryFn: async () => {
      let query = supabase.from('recipes').select('*').order('created_at', { ascending: false });

      if (filters.search) {
        query = query.ilike('nome', `%${filters.search}%`);
      }

      if (filters.categoria) {
        query = query.eq('categoria', filters.categoria);
      }

      if (filters.status === 'active') {
        query = query.eq('ativa', true);
      } else if (filters.status === 'inactive') {
        query = query.eq('ativa', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Recipe[];
    },
  });
}

export function useRecipe(id: string) {
  return useQuery({
    queryKey: RECIPE_QUERY_KEYS.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select(
          `
          *,
          recipe_ingredients (
            *,
            product:products (
              id,
              nome,
              unidade,
              preco_atual
            )
          )
        `,
        )
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as RecipeWithIngredients;
    },
    enabled: !!id,
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RecipeInput) => {
      // Create recipe
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert([
          {
            nome: data.nome,
            descricao: data.descricao,
            categoria: data.categoria,
            tempo_preparo: data.tempoPreparo,
            rendimento_porcoes: data.rendimentoPorcoes,
            margem_lucro_desejada: data.margemLucroDesejada,
            preco_venda_sugerido: data.precoVendaSugerido,
            ativa: data.ativa,
          },
        ])
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Create ingredients
      const ingredients = data.ingredients.map((ingredient) => ({
        recipe_id: recipe.id,
        product_id: ingredient.productId,
        quantidade: ingredient.quantidade,
        unidade: ingredient.unidade,
        observacoes: ingredient.observacoes,
      }));

      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredients);

      if (ingredientsError) throw ingredientsError;

      // Trigger cost calculation
      await supabase.rpc('update_recipe_cost', { recipe_uuid: recipe.id });

      return recipe as Recipe;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.all });
    },
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RecipeInput }) => {
      // Update recipe
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .update({
          nome: data.nome,
          descricao: data.descricao,
          categoria: data.categoria,
          tempo_preparo: data.tempoPreparo,
          rendimento_porcoes: data.rendimentoPorcoes,
          margem_lucro_desejada: data.margemLucroDesejada,
          preco_venda_sugerido: data.precoVendaSugerido,
          ativa: data.ativa,
        })
        .eq('id', id)
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Delete existing ingredients
      const { error: deleteError } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', id);

      if (deleteError) throw deleteError;

      // Create new ingredients
      const ingredients = data.ingredients.map((ingredient) => ({
        recipe_id: id,
        product_id: ingredient.productId,
        quantidade: ingredient.quantidade,
        unidade: ingredient.unidade,
        observacoes: ingredient.observacoes,
      }));

      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredients);

      if (ingredientsError) throw ingredientsError;

      // Trigger cost calculation
      await supabase.rpc('update_recipe_cost', { recipe_uuid: id });

      return recipe as Recipe;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.detail(data.id) });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recipes').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.all });
    },
  });
}

// src/app/(protected)/receitas/page.tsx
('use client');

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Calculator, Clock, Users } from 'lucide-react';
import { useRecipes } from '@/lib/queries/recipes';
import { useDebounce } from '@/lib/hooks/useDebounce';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

const RECIPE_CATEGORIES = [
  'Entradas',
  'Pratos Principais',
  'Sobremesas',
  'Bebidas',
  'Lanches',
  'Pizzas',
  'Massas',
  'Saladas',
  'Sopas',
  'Acompanhamentos',
];

export default function RecipesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    categoria: '',
    status: 'all' as 'active' | 'inactive' | 'all',
  });

  const debouncedSearch = useDebounce(search, 300);

  const {
    data: recipes,
    isLoading,
    error,
  } = useRecipes({
    search: debouncedSearch,
    ...filters,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-lg font-medium">Erro ao carregar receitas</p>
          <p className="text-muted-foreground mt-1 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Receitas</h1>
          <p className="text-muted-foreground">
            Gerencie as fichas técnicas e calcule o CMV dos seus pratos
          </p>
        </div>

        <Button onClick={() => router.push('/receitas/nova')}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Receita
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Buscar receitas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select
                value={filters.categoria}
                onValueChange={(value) => setFilters({ ...filters, categoria: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as categorias</SelectItem>
                  {RECIPE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value: 'active' | 'inactive' | 'all') =>
                  setFilters({ ...filters, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="inactive">Inativas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">
            {recipes?.length || 0} receitas encontradas
          </span>
        </div>

        {/* Recipes grid */}
        {!recipes || recipes.length === 0 ? (
          <EmptyState
            title="Nenhuma receita encontrada"
            description="Não há receitas que correspondam aos filtros selecionados."
            action={
              <Button onClick={() => router.push('/receitas/nova')}>
                <Plus className="mr-2 h-4 w-4" />
                Criar primeira receita
              </Button>
            }
          />
        ) : (
          <div className="grid-responsive">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// src/components/recipes/RecipeCard.tsx
('use client');

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Clock,
  Users,
  Calculator,
  TrendingUp,
  TrendingDown,
  ChefHat,
  Eye,
} from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDeleteRecipe } from '@/lib/queries/recipes';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Recipe } from '@/lib/supabase/types';

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteRecipe = useDeleteRecipe();

  const handleEdit = () => {
    router.push(`/receitas/${recipe.id}/editar`);
  };

  const handleView = () => {
    router.push(`/receitas/${recipe.id}`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteRecipe.mutateAsync(recipe.id);
      toast({
        title: 'Receita excluída',
        description: `${recipe.nome} foi excluída com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir receita',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getCMVColor = (cmv: number) => {
    if (cmv <= 25) return 'text-green-600';
    if (cmv <= 35) return 'text-yellow-600';
    return 'text-red-600';
  };

  const cmvPercentage =
    recipe.preco_venda_sugerido && recipe.custo_total
      ? (recipe.custo_total / recipe.preco_venda_sugerido) * 100
      : 0;

  return (
    <Card className="card-hover group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
              <ChefHat className="text-primary h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/receitas/${recipe.id}`}
                className="hover:text-primary line-clamp-1 font-medium transition-colors"
              >
                {recipe.nome}
              </Link>
              {recipe.descricao && (
                <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                  {recipe.descricao}
                </p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleView}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Category and Status */}
        <div className="flex flex-wrap items-center gap-2">
          {recipe.categoria && (
            <Badge variant="outline" className="text-xs">
              {recipe.categoria}
            </Badge>
          )}
          {!recipe.ativa && (
            <Badge variant="secondary" className="text-xs">
              Inativa
            </Badge>
          )}
        </div>

        {/* Info Row */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {recipe.tempo_preparo && (
            <div className="flex items-center gap-2">
              <Clock className="text-muted-foreground h-4 w-4" />
              <span>{recipe.tempo_preparo}min</span>
            </div>
          )}
          {recipe.rendimento_porcoes && (
            <div className="flex items-center gap-2">
              <Users className="text-muted-foreground h-4 w-4" />
              <span>{recipe.rendimento_porcoes} porções</span>
            </div>
          )}
        </div>

        {/* Cost Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Custo Total</span>
            <span className="font-medium">{formatCurrency(recipe.custo_total)}</span>
          </div>

          {recipe.preco_venda_sugerido && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Preço Sugerido</span>
              <span className="font-medium">{formatCurrency(recipe.preco_venda_sugerido)}</span>
            </div>
          )}

          {cmvPercentage > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">CMV</span>
              <div className="flex items-center gap-1">
                <span className={cn('font-medium', getCMVColor(cmvPercentage))}>
                  {cmvPercentage.toFixed(1)}%
                </span>
                {cmvPercentage <= 30 ? (
                  <TrendingDown className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-red-600" />
                )}
              </div>
            </div>
          )}

          {recipe.rendimento_porcoes && recipe.custo_total && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Custo por Porção</span>
              <span className="font-medium">
                {formatCurrency(recipe.custo_total / recipe.rendimento_porcoes)}
              </span>
            </div>
          )}
        </div>

        {/* Profit Margin */}
        {recipe.margem_lucro_desejada && recipe.margem_lucro_desejada > 0 && (
          <div className="border-t pt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Margem Desejada</span>
              <span className="font-medium">{recipe.margem_lucro_desejada}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// src/app/(protected)/receitas/nova/page.tsx
('use client');

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RecipeForm } from '@/components/recipes/RecipeForm';
import { useCreateRecipe } from '@/lib/queries/recipes';
import { useToast } from '@/hooks/use-toast';
import type { RecipeInput } from '@/lib/validations/recipe';

export default function NovaReceitaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createRecipe = useCreateRecipe();

  const handleSubmit = async (data: RecipeInput) => {
    try {
      const recipe = await createRecipe.mutateAsync(data);

      toast({
        title: 'Receita criada com sucesso!',
        description: `${recipe.nome} foi adicionada ao seu catálogo.`,
      });

      router.push('/receitas');
    } catch (error: any) {
      toast({
        title: 'Erro ao criar receita',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Receita</h1>
          <p className="text-muted-foreground">
            Crie uma nova ficha técnica com cálculo automático de CMV
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Receita</CardTitle>
          <CardDescription>
            Preencha os dados da receita e adicione os ingredientes. O custo será calculado
            automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecipeForm onSubmit={handleSubmit} isLoading={createRecipe.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}

// src/components/recipes/RecipeForm.tsx
('use client');

import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Calculator } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/lib/queries/products';
import { recipeSchema, type RecipeInput } from '@/lib/validations/recipe';
import { ALL_UNITS } from '@/lib/constants/units';

const RECIPE_CATEGORIES = [
  'Entradas',
  'Pratos Principais',
  'Sobremesas',
  'Bebidas',
  'Lanches',
  'Pizzas',
  'Massas',
  'Saladas',
  'Sopas',
  'Acompanhamentos',
];

interface RecipeFormProps {
  initialData?: Partial<RecipeInput>;
  onSubmit: (data: RecipeInput) => Promise<void>;
  isLoading?: boolean;
}

export function RecipeForm({ initialData, onSubmit, isLoading }: RecipeFormProps) {
  const [totalCost, setTotalCost] = useState(0);
  const [suggestedPrice, setSuggestedPrice] = useState(0);

  const { data: products } = useProducts({ status: 'active' });

  const form = useForm<RecipeInput>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      categoria: '',
      tempoPreparo: undefined,
      rendimentoPorcoes: 1,
      margemLucroDesejada: 0,
      precoVendaSugerido: 0,
      ativa: true,
      ingredients: [
        {
          productId: '',
          quantidade: 1,
          unidade: 'un',
          observacoes: '',
        },
      ],
      ...initialData,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'ingredients',
  });

  // Calculate costs when ingredients change
  const watchedIngredients = form.watch('ingredients');
  const watchedPorcoes = form.watch('rendimentoPorcoes') || 1;
  const watchedMargem = form.watch('margemLucroDesejada') || 0;

  React.useEffect(() => {
    if (!products || !watchedIngredients) return;

    let cost = 0;
    watchedIngredients.forEach((ingredient) => {
      const product = products.find((p) => p.id === ingredient.productId);
      if (product && ingredient.quantidade) {
        cost += ingredient.quantidade * product.preco_atual;
      }
    });

    setTotalCost(cost);

    // Calculate suggested price based on margin
    if (watchedMargem > 0) {
      const price = cost / (1 - watchedMargem / 100);
      setSuggestedPrice(price);
      form.setValue('precoVendaSugerido', Number(price.toFixed(2)));
    }
  }, [watchedIngredients, products, watchedMargem, form]);

  const handleSubmit = async (data: RecipeInput) => {
    await onSubmit(data);
  };

  const addIngredient = () => {
    append({
      productId: '',
      quantidade: 1,
      unidade: 'un',
      observacoes: '',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getCMVPercentage = () => {
    const price = form.watch('precoVendaSugerido') || 0;
    if (price <= 0) return 0;
    return (totalCost / price) * 100;
  };

  const getCMVColor = (cmv: number) => {
    if (cmv <= 25) return 'text-green-600';
    if (cmv <= 35) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Informações Básicas</h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da receita *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Pizza Margherita" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RECIPE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
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
            name="descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descrição da receita, modo de preparo resumido..."
                    {...field}
                    disabled={isLoading}
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="tempoPreparo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempo de preparo</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        min="1"
                        placeholder="30"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        disabled={isLoading}
                      />
                      <span className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                        min
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rendimentoPorcoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rendimento</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        min="1"
                        placeholder="4"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        disabled={isLoading}
                      />
                      <span className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                        porções
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="margemLucroDesejada"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Margem de lucro</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        placeholder="30"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isLoading}
                      />
                      <span className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                        %
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription>Margem de lucro desejada para cálculo do preço</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Ingredients */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Ingredientes</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addIngredient}
              disabled={isLoading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar ingrediente
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
                        name={`ingredients.${index}.productId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Produto</FormLabel>
                            <Select
                              onValueChange={field.onChange}
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
                                    <div className="flex w-full items-center justify-between">
                                      <span>{product.nome}</span>
                                      <span className="text-muted-foreground ml-2 text-sm">
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
                      name={`ingredients.${index}.quantidade`}
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
                        name={`ingredients.${index}.unidade`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Unidade</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={isLoading}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ALL_UNITS.map((unit) => (
                                  <SelectItem key={unit.value} value={unit.value}>
                                    {unit.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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

                  <FormField
                    control={form.control}
                    name={`ingredients.${index}.observacoes`}
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Observações sobre o ingrediente..."
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cost Calculation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Cálculo de Custos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-muted-foreground text-sm font-medium">Custo Total</label>
                <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
              </div>

              <div className="space-y-2">
                <label className="text-muted-foreground text-sm font-medium">
                  Custo por Porção
                </label>
                <p className="text-2xl font-bold">{formatCurrency(totalCost / watchedPorcoes)}</p>
              </div>

              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="precoVendaSugerido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de Venda</FormLabel>
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
              </div>

              <div className="space-y-2">
                <label className="text-muted-foreground text-sm font-medium">CMV</label>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${getCMVColor(getCMVPercentage())}`}>
                    {getCMVPercentage().toFixed(1)}%
                  </p>
                  <Badge
                    variant={
                      getCMVPercentage() <= 30
                        ? 'success'
                        : getCMVPercentage() <= 40
                          ? 'warning'
                          : 'destructive'
                    }
                  >
                    {getCMVPercentage() <= 30
                      ? 'Excelente'
                      : getCMVPercentage() <= 40
                        ? 'Bom'
                        : 'Alto'}
                  </Badge>
                </div>
              </div>
            </div>

            {watchedMargem > 0 && (
              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Preço sugerido com {watchedMargem}% de margem:</strong>{' '}
                  {formatCurrency(suggestedPrice)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recipe Status */}
        <FormField
          control={form.control}
          name="ativa"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Receita ativa</FormLabel>
                <FormDescription>Receitas inativas não aparecem nos relatórios</FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* Submit buttons */}
        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={isLoading} className="flex-1 sm:flex-none">
            {isLoading ? 'Salvando...' : initialData ? 'Atualizar receita' : 'Criar receita'}
          </Button>
          <Button type="button" variant="outline" onClick={() => form.reset()} disabled={isLoading}>
            Limpar
          </Button>
        </div>
      </form>
    </Form>
  );
}
