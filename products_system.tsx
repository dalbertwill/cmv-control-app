// src/lib/queries/products.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, executeQuery } from '@/lib/supabase/client';
import type { Product, ProductWithCategory, Category, Supplier } from '@/lib/supabase/types';
import type { ProductInput, CategoryInput, SupplierInput } from '@/lib/validations/product';

// Query keys
export const PRODUCT_QUERY_KEYS = {
  all: ['products'] as const,
  lists: () => [...PRODUCT_QUERY_KEYS.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...PRODUCT_QUERY_KEYS.lists(), filters] as const,
  details: () => [...PRODUCT_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PRODUCT_QUERY_KEYS.details(), id] as const,
  categories: ['categories'] as const,
  suppliers: ['suppliers'] as const,
};

// Products queries
export function useProducts(
  filters: {
    search?: string;
    category?: string;
    supplier?: string;
    status?: 'active' | 'inactive' | 'all';
    lowStock?: boolean;
  } = {},
) {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(
          `
          *,
          category:categories(id, nome, cor),
          supplier:suppliers(id, nome)
        `,
        )
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.search) {
        query = query.ilike('nome', `%${filters.search}%`);
      }

      if (filters.category) {
        query = query.eq('category_id', filters.category);
      }

      if (filters.supplier) {
        query = query.eq('supplier_id', filters.supplier);
      }

      if (filters.status === 'active') {
        query = query.eq('ativo', true);
      } else if (filters.status === 'inactive') {
        query = query.eq('ativo', false);
      }

      if (filters.lowStock) {
        query = query.or('estoque_atual.lte.estoque_minimo,estoque_atual.is.null');
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ProductWithCategory[];
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          category:categories(id, nome, cor),
          supplier:suppliers(id, nome)
        `,
        )
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as ProductWithCategory;
    },
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.categories,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useSuppliers() {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.suppliers,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data as Supplier[];
    },
  });
}

// Mutations
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProductInput) => {
      const { data: result, error } = await supabase
        .from('products')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProductInput> }) => {
      const { data: result, error } = await supabase
        .from('products')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as Product;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.detail(data.id) });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
    },
  });
}

// Category mutations
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CategoryInput) => {
      const { data: result, error } = await supabase
        .from('categories')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.categories });
    },
  });
}

// Supplier mutations
export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SupplierInput) => {
      const { data: result, error } = await supabase
        .from('suppliers')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result as Supplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.suppliers });
    },
  });
}

// src/app/(protected)/produtos/page.tsx
('use client');

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, Download, Upload } from 'lucide-react';
import { useProducts, useCategories, useSuppliers } from '@/lib/queries/products';
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
import { ProductCard } from '@/components/products/ProductCard';
import { ProductFilters } from '@/components/products/ProductFilters';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

export default function ProductsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    supplier: '',
    status: 'all' as 'active' | 'inactive' | 'all',
    lowStock: false,
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const debouncedSearch = useDebounce(search, 300);

  const {
    data: products,
    isLoading,
    error,
  } = useProducts({
    search: debouncedSearch,
    ...filters,
  });

  const { data: categories } = useCategories();
  const { data: suppliers } = useSuppliers();

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting products...');
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    console.log('Importing products...');
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-lg font-medium">Erro ao carregar produtos</p>
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
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie os ingredientes e produtos do seu restaurante
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleImport}>
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={() => router.push('/produtos/novo')}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>
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
              placeholder="Buscar produtos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <ProductFilters
            categories={categories || []}
            suppliers={suppliers || []}
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {/* Results header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              {products?.length || 0} produtos encontrados
            </span>
            {filters.lowStock && <Badge variant="warning">Estoque baixo</Badge>}
          </div>

          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(value: 'grid' | 'list') => setViewMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grade</SelectItem>
                <SelectItem value="list">Lista</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products grid/list */}
        {!products || products.length === 0 ? (
          <EmptyState
            title="Nenhum produto encontrado"
            description="Não há produtos que correspondam aos filtros selecionados."
            action={
              <Button onClick={() => router.push('/produtos/novo')}>
                <Plus className="mr-2 h-4 w-4" />
                Criar primeiro produto
              </Button>
            }
          />
        ) : (
          <div className={viewMode === 'grid' ? 'grid-responsive' : 'space-y-4'}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} viewMode={viewMode} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// src/components/products/ProductCard.tsx
('use client');

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
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
import { useDeleteProduct } from '@/lib/queries/products';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { ProductWithCategory } from '@/lib/supabase/types';

interface ProductCardProps {
  product: ProductWithCategory;
  viewMode: 'grid' | 'list';
}

export function ProductCard({ product, viewMode }: ProductCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteProduct = useDeleteProduct();

  const handleEdit = () => {
    router.push(`/produtos/${product.id}/editar`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProduct.mutateAsync(product.id);
      toast({
        title: 'Produto excluído',
        description: `${product.nome} foi excluído com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir produto',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isLowStock = (product.estoque_atual || 0) <= (product.estoque_minimo || 0);
  const stockPercentage = product.estoque_minimo
    ? ((product.estoque_atual || 0) / product.estoque_minimo) * 100
    : 100;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (viewMode === 'list') {
    return (
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center gap-4">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Package className="text-primary h-6 w-6" />
              </div>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/produtos/${product.id}`}
                  className="hover:text-primary font-medium transition-colors"
                >
                  {product.nome}
                </Link>
                <div className="mt-1 flex items-center gap-2">
                  {product.category && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: product.category.cor }}
                    >
                      {product.category.nome}
                    </Badge>
                  )}
                  {!product.ativo && (
                    <Badge variant="secondary" className="text-xs">
                      Inativo
                    </Badge>
                  )}
                  {isLowStock && (
                    <Badge variant="warning" className="text-xs">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Estoque baixo
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div className="text-right">
                <p className="font-medium">{formatCurrency(product.preco_atual)}</p>
                <p className="text-muted-foreground">/{product.unidade}</p>
              </div>

              <div className="text-right">
                <p className="font-medium">
                  {product.estoque_atual || 0} {product.unidade}
                </p>
                <p className="text-muted-foreground">Min: {product.estoque_minimo || 0}</p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-hover group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
              <Package className="text-primary h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/produtos/${product.id}`}
                className="hover:text-primary line-clamp-1 font-medium transition-colors"
              >
                {product.nome}
              </Link>
              {product.descricao && (
                <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                  {product.descricao}
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
          {product.category && (
            <Badge
              variant="outline"
              className="text-xs"
              style={{ borderColor: product.category.cor }}
            >
              {product.category.nome}
            </Badge>
          )}
          {!product.ativo && (
            <Badge variant="secondary" className="text-xs">
              Inativo
            </Badge>
          )}
          {isLowStock && (
            <Badge variant="warning" className="text-xs">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Estoque baixo
            </Badge>
          )}
        </div>

        {/* Price and Stock */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Preço</span>
            <span className="font-medium">
              {formatCurrency(product.preco_atual)}/{product.unidade}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Estoque</span>
            <span className={cn('font-medium', isLowStock && 'text-yellow-600')}>
              {product.estoque_atual || 0} {product.unidade}
            </span>
          </div>

          {/* Stock indicator */}
          {product.estoque_minimo && (
            <div className="space-y-1">
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <span>Estoque mínimo: {product.estoque_minimo}</span>
                <span>{Math.round(stockPercentage)}%</span>
              </div>
              <div className="bg-muted h-2 w-full rounded-full">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all',
                    stockPercentage >= 100
                      ? 'bg-green-500'
                      : stockPercentage >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500',
                  )}
                  style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Supplier */}
        {product.supplier && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Fornecedor</span>
            <span className="font-medium">{product.supplier.nome}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// src/components/products/ProductFilters.tsx
('use client');

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import type { Category, Supplier } from '@/lib/supabase/types';

interface ProductFiltersProps {
  categories: Category[];
  suppliers: Supplier[];
  filters: {
    category: string;
    supplier: string;
    status: 'active' | 'inactive' | 'all';
    lowStock: boolean;
  };
  onFiltersChange: (filters: ProductFiltersProps['filters']) => void;
}

export function ProductFilters({
  categories,
  suppliers,
  filters,
  onFiltersChange,
}: ProductFiltersProps) {
  const hasActiveFilters =
    filters.category || filters.supplier || filters.status !== 'all' || filters.lowStock;

  const clearFilters = () => {
    onFiltersChange({
      category: '',
      supplier: '',
      status: 'all',
      lowStock: false,
    });
  };

  const updateFilter = (key: keyof typeof filters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Filter controls */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="category-filter">Categoria</Label>
          <Select
            value={filters.category}
            onValueChange={(value) => updateFilter('category', value)}
          >
            <SelectTrigger id="category-filter">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: category.cor }}
                    />
                    {category.nome}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier-filter">Fornecedor</Label>
          <Select
            value={filters.supplier}
            onValueChange={(value) => updateFilter('supplier', value)}
          >
            <SelectTrigger id="supplier-filter">
              <SelectValue placeholder="Todos os fornecedores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os fornecedores</SelectItem>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status-filter">Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value: 'active' | 'inactive' | 'all') => updateFilter('status', value)}
          >
            <SelectTrigger id="status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lowstock-filter">Estoque baixo</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="lowstock-filter"
              checked={filters.lowStock}
              onCheckedChange={(checked) => updateFilter('lowStock', checked)}
            />
            <Label htmlFor="lowstock-filter" className="text-sm">
              Mostrar apenas produtos com estoque baixo
            </Label>
          </div>
        </div>
      </div>

      {/* Active filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Filtros ativos:</span>

          {filters.category && (
            <Badge variant="secondary" className="gap-1">
              Categoria: {categories.find((c) => c.id === filters.category)?.nome}
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-auto p-0"
                onClick={() => updateFilter('category', '')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.supplier && (
            <Badge variant="secondary" className="gap-1">
              Fornecedor: {suppliers.find((s) => s.id === filters.supplier)?.nome}
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-auto p-0"
                onClick={() => updateFilter('supplier', '')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.status !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.status === 'active' ? 'Ativo' : 'Inativo'}
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-auto p-0"
                onClick={() => updateFilter('status', 'all')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.lowStock && (
            <Badge variant="secondary" className="gap-1">
              Estoque baixo
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-auto p-0"
                onClick={() => updateFilter('lowStock', false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Limpar todos
          </Button>
        </div>
      )}
    </div>
  );
}

// src/components/ui/switch.tsx
import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      'focus-visible:ring-ring focus-visible:ring-offset-background data-[state=checked]:bg-primary data-[state=unchecked]:bg-input peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'bg-background pointer-events-none block h-5 w-5 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };

// src/components/common/EmptyState.tsx
import { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && (
        <div className="bg-muted mb-4 flex h-20 w-20 items-center justify-center rounded-full">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="text-muted-foreground mt-2 max-w-md text-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
