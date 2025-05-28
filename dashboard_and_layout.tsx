// src/app/(protected)/layout.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/providers';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null; // Middleware will handle redirect
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="py-6">
          <div className="container-responsive">{children}</div>
        </main>
      </div>
    </div>
  );
}

// src/components/layout/Sidebar.tsx
('use client');

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import {
  BarChart3,
  Book,
  Home,
  Package,
  Settings,
  ShoppingCart,
  TrendingUp,
  X,
  LogOut,
  User,
  Bell,
} from 'lucide-react';
import { useAuth } from '@/components/providers/providers';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Produtos', href: '/produtos', icon: Package },
  { name: 'Receitas', href: '/receitas', icon: Book },
  { name: 'Compras', href: '/compras', icon: ShoppingCart },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
];

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onOpenChange}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onOpenChange(false)}
                      className="text-white hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-6 w-6" aria-hidden="true" />
                    </Button>
                  </div>
                </Transition.Child>
                <SidebarContent pathname={pathname} profile={profile} onSignOut={handleSignOut} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent pathname={pathname} profile={profile} onSignOut={handleSignOut} />
      </div>
    </>
  );
}

function SidebarContent({
  pathname,
  profile,
  onSignOut,
}: {
  pathname: string;
  profile: any;
  onSignOut: () => void;
}) {
  return (
    <div className="border-border flex grow flex-col gap-y-5 overflow-y-auto border-r bg-white px-6 pb-4 dark:bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <TrendingUp className="text-primary-foreground h-5 w-5" />
          </div>
          <span className="text-lg font-bold">CMV Control</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <li key={item.name}>
                    <Link href={item.href} className={cn('sidebar-item', isActive ? 'active' : '')}>
                      <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>

          {/* Bottom section */}
          <li className="mt-auto">
            <div className="space-y-1">
              <Link
                href="/configuracoes"
                className={cn(
                  'sidebar-item',
                  pathname.startsWith('/configuracoes') ? 'active' : '',
                )}
              >
                <Settings className="h-5 w-5 shrink-0" />
                Configurações
              </Link>

              <Button
                variant="ghost"
                onClick={onSignOut}
                className="text-muted-foreground hover:text-foreground h-auto w-full justify-start px-3 py-2 text-sm font-normal"
              >
                <LogOut className="mr-3 h-5 w-5 shrink-0" />
                Sair
              </Button>
            </div>

            {/* User profile */}
            <div className="border-border mt-4 border-t pt-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback>
                    {profile?.nome_completo?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {profile?.nome_completo || 'Usuário'}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {profile?.nome_restaurante || 'Restaurante'}
                  </p>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
}

// src/components/layout/Header.tsx
('use client');

import { Bell, Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/components/providers/providers';
import Link from 'next/link';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { profile, signOut } = useAuth();

  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-border sticky top-0 z-40 border-b backdrop-blur">
      <div className="flex h-16 items-center gap-x-4 px-4 sm:gap-x-6 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search */}
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <form className="relative flex max-w-md flex-1" action="#" method="GET">
            <label htmlFor="search-field" className="sr-only">
              Buscar
            </label>
            <Search className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 h-full w-5 pl-3" />
            <Input
              id="search-field"
              className="border-0 bg-transparent pl-10 focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="Buscar produtos, receitas..."
              type="search"
              name="search"
            />
          </form>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                >
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Estoque baixo</p>
                  <p className="text-muted-foreground text-xs">
                    Produto "Tomate" está com estoque baixo
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Preço alterado</p>
                  <p className="text-muted-foreground text-xs">Preço do "Frango" foi atualizado</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">CMV alto</p>
                  <p className="text-muted-foreground text-xs">
                    Receita "Pizza Margherita" com CMV de 45%
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/notificacoes" className="w-full text-center">
                  Ver todas as notificações
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback>
                    {profile?.nome_completo?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {profile?.nome_completo || 'Usuário'}
                  </p>
                  <p className="text-muted-foreground text-xs leading-none">
                    {profile?.nome_restaurante || 'Restaurante'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/configuracoes">Configurações</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/ajuda">Ajuda</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

// src/components/ui/avatar.tsx
import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full', className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'bg-muted flex h-full w-full items-center justify-center rounded-full',
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };

// src/components/ui/dropdown-menu.tsx
import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'focus:bg-accent data-[state=open]:bg-accent flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
      inset && 'pl-8',
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-lg',
      className,
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md',
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'focus:bg-accent focus:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'focus:bg-accent focus:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      'focus:bg-accent focus:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn('px-2 py-1.5 text-sm font-semibold', inset && 'pl-8', className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('bg-muted -mx-1 my-1 h-px', className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span className={cn('ml-auto text-xs tracking-widest opacity-60', className)} {...props} />
  );
};
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};

// src/components/common/LoadingSpinner.tsx
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className={`text-primary animate-spin ${sizeClasses[size]} ${className}`} />
        <p className="text-muted-foreground text-sm">Carregando...</p>
      </div>
    </div>
  );
}

// src/app/(protected)/dashboard/page.tsx
('use client');

import { useAuth } from '@/components/providers/providers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingDown,
  TrendingUp,
  Package,
  ShoppingCart,
  AlertTriangle,
  DollarSign,
  Plus,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

// Mock data - Em produção, isso viria de uma API
const dashboardData = {
  stats: {
    totalProducts: 45,
    totalRecipes: 12,
    monthlyPurchases: 8500.0,
    avgCMV: 28.5,
  },
  lowStockProducts: [
    { id: 1, name: 'Tomate', stock: 2, unit: 'kg', minStock: 5 },
    { id: 2, name: 'Cebola', stock: 1, unit: 'kg', minStock: 3 },
    { id: 3, name: 'Azeite', stock: 0.5, unit: 'L', minStock: 2 },
  ],
  recentActivity: [
    { id: 1, action: 'Produto criado', item: 'Frango', time: '2 horas atrás' },
    { id: 2, action: 'Receita atualizada', item: 'Pizza Margherita', time: '1 dia atrás' },
    { id: 3, action: 'Compra registrada', item: 'Fornecedor ABC', time: '2 dias atrás' },
  ],
  topRecipes: [
    { id: 1, name: 'Pizza Margherita', cmv: 25.5, sales: 150 },
    { id: 2, name: 'Hambúrguer Clássico', cmv: 32.0, sales: 98 },
    { id: 3, name: 'Salada Caesar', cmv: 18.5, sales: 75 },
  ],
};

export default function DashboardPage() {
  const { profile } = useAuth();
  const { stats, lowStockProducts, recentActivity, topRecipes } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Olá, {profile?.nome_completo?.split(' ')[0] || 'Chef'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Aqui está um resumo do seu restaurante {profile?.nome_restaurante || ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/produtos/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/receitas/nova">
              <Plus className="mr-2 h-4 w-4" />
              Nova Receita
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Cadastrados</CardTitle>
            <Package className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-muted-foreground text-xs">+2 desde o mês passado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas Ativas</CardTitle>
            <ShoppingCart className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecipes}</div>
            <p className="text-muted-foreground text-xs">+1 desde a semana passada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compras do Mês</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.monthlyPurchases.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-muted-foreground text-xs">+12% desde o mês passado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CMV Médio</CardTitle>
            {stats.avgCMV <= 30 ? (
              <TrendingDown className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingUp className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgCMV}%</div>
            <p className="text-muted-foreground text-xs">Meta: {profile?.meta_cmv_mensal || 30}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Low Stock Alert */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Estoque Baixo
            </CardTitle>
            <CardDescription>Produtos que precisam de reposição</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Todos os produtos estão com estoque adequado! 🎉
              </p>
            ) : (
              lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {product.stock} {product.unit} restantes
                    </p>
                  </div>
                  <Badge variant="warning">Baixo</Badge>
                </div>
              ))
            )}
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/produtos?filter=low-stock">
                Ver todos os produtos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>Últimas ações no seu sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="bg-primary mt-2 h-2 w-2 rounded-full" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-muted-foreground text-sm">{activity.item}</p>
                  <p className="text-muted-foreground text-xs">{activity.time}</p>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/atividades">
                Ver histórico completo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Top Recipes */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Receitas Mais Vendidas</CardTitle>
            <CardDescription>Performance das suas receitas este mês</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topRecipes.map((recipe, index) => (
              <div key={recipe.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 flex h-6 w-6 items-center justify-center rounded-full">
                    <span className="text-xs font-medium">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{recipe.name}</p>
                    <p className="text-muted-foreground text-sm">{recipe.sales} vendas</p>
                  </div>
                </div>
                <Badge
                  variant={
                    recipe.cmv <= 30 ? 'success' : recipe.cmv <= 40 ? 'warning' : 'destructive'
                  }
                >
                  {recipe.cmv}%
                </Badge>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/receitas">
                Ver todas as receitas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Tarefas comuns para gerenciar seu restaurante</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button
            variant="outline"
            className="flex h-auto flex-col items-center space-y-2 p-4"
            asChild
          >
            <Link href="/produtos/novo">
              <Package className="text-primary h-8 w-8" />
              <span className="font-medium">Cadastrar Produto</span>
              <span className="text-muted-foreground text-center text-xs">
                Adicione novos ingredientes ao seu estoque
              </span>
            </Link>
          </Button>

          <Button
            variant="outline"
            className="flex h-auto flex-col items-center space-y-2 p-4"
            asChild
          >
            <Link href="/receitas/nova">
              <ShoppingCart className="text-primary h-8 w-8" />
              <span className="font-medium">Criar Receita</span>
              <span className="text-muted-foreground text-center text-xs">
                Monte fichas técnicas com cálculo de CMV
              </span>
            </Link>
          </Button>

          <Button
            variant="outline"
            className="flex h-auto flex-col items-center space-y-2 p-4"
            asChild
          >
            <Link href="/compras/nova">
              <DollarSign className="text-primary h-8 w-8" />
              <span className="font-medium">Registrar Compra</span>
              <span className="text-muted-foreground text-center text-xs">
                Atualize preços e estoques automaticamente
              </span>
            </Link>
          </Button>

          <Button
            variant="outline"
            className="flex h-auto flex-col items-center space-y-2 p-4"
            asChild
          >
            <Link href="/relatorios">
              <TrendingUp className="text-primary h-8 w-8" />
              <span className="font-medium">Ver Relatórios</span>
              <span className="text-muted-foreground text-center text-xs">
                Analise custos e identifique oportunidades
              </span>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
