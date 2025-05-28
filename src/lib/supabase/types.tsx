export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Profile = {
  id: string;
  nome_completo: string | null;
  nome_restaurante: string | null;
  meta_cmv_mensal: number | null;
  avatar_url: string | null;
  onboarding_completed: boolean | null;
  timezone: string | null;
  moeda: string | null;
  formato_data: string | null;
  tema: string | null;
  notificacoes_ativas: boolean | null;
  backup_automatico: boolean | null;
  updated_at: string | null;
};

export type Category = {
  id: string;
  user_id: string | null;
  nome: string;
  cor: string | null;
  descricao: string | null;
  ativo: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Supplier = {
  id: string;
  user_id: string | null;
  nome: string;
  contato: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  cnpj: string | null;
  observacoes: string | null;
  ativo: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Product = {
  id: string;
  user_id: string | null;
  nome: string;
  descricao: string | null;
  codigo_interno: string | null;
  category_id: string | null;
  supplier_id: string | null;
  unidade: string;
  preco_atual: number;
  custo_medio: number | null;
  estoque_atual: number | null;
  estoque_minimo: number | null;
  data_validade: string | null; // Date as string
  ativo: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export interface ProductWithCategory extends Product {
  category: Category | null;
  supplier: Supplier | null;
}

export type Recipe = {
  id: string;
  user_id: string | null;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  tempo_preparo: number | null;
  rendimento_porcoes: number | null;
  custo_total: number | null;
  preco_venda_sugerido: number | null;
  margem_lucro_desejada: number | null;
  versao: number | null;
  ativa: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export type RecipeIngredient = {
  id: string;
  recipe_id: string | null;
  product_id: string | null;
  quantidade: number;
  unidade: string;
  observacoes: string | null;
  custo_ingrediente: number | null;
  created_at: string | null;
};

export interface RecipeWithIngredients extends Recipe {
  recipe_ingredients: Array<RecipeIngredient & { product: Product }> | null;
}

export type Purchase = {
  id: string;
  user_id: string | null;
  supplier_id: string | null;
  data_compra: string; // Date as string
  numero_nota: string | null;
  valor_total: number;
  desconto: number | null;
  impostos: number | null;
  observacoes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type PurchaseItem = {
  id: string;
  purchase_id: string | null;
  product_id: string | null;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  created_at: string | null;
};

export interface PurchaseWithItems extends Purchase {
  supplier: Supplier | null;
  purchase_items: Array<
    PurchaseItem & { product: Pick<Product, 'id' | 'nome' | 'unidade'> }
  > | null;
}

// Esta é a definição principal para o seu cliente Supabase
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
      };
      categories: {
        Row: Category;
        Insert: Partial<Category>;
        Update: Partial<Category>;
      };
      suppliers: {
        Row: Supplier;
        Insert: Partial<Supplier>;
        Update: Partial<Supplier>;
      };
      products: {
        Row: Product;
        Insert: Partial<Product>;
        Update: Partial<Product>;
      };
      purchases: {
        Row: Purchase;
        Insert: Partial<Purchase>;
        Update: Partial<Purchase>;
      };
      purchase_items: {
        Row: PurchaseItem;
        Insert: Partial<PurchaseItem>;
        Update: Partial<PurchaseItem>;
      };
      recipes: {
        Row: Recipe;
        Insert: Partial<Recipe>;
        Update: Partial<Recipe>;
      };
      recipe_ingredients: {
        Row: RecipeIngredient;
        Insert: Partial<RecipeIngredient>;
        Update: Partial<RecipeIngredient>;
      };
      // Adicione outras tabelas aqui conforme necessário
      // Ex: price_history, units, productions, activity_logs, notifications
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      update_recipe_cost: {
        Args: { recipe_uuid: string };
        Returns: undefined;
      };
      // Adicione outras funções aqui
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
