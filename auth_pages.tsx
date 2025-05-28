// src/app/(auth)/layout.tsx
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex min-h-screen">
        {/* Left side - Hero/Branding */}
        <div className="bg-primary text-primary-foreground hidden lg:flex lg:w-1/2 xl:w-2/5">
          <div className="flex flex-col justify-center px-12 py-12">
            <div className="mb-8">
              <h1 className="mb-4 text-4xl font-bold">CMV Control</h1>
              <p className="text-primary-foreground/90 text-xl leading-relaxed">
                Sistema inteligente para controle de CMV e gestão de custos em restaurantes
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary-foreground/70 mt-2 h-2 w-2 flex-shrink-0 rounded-full" />
                <div>
                  <h3 className="mb-1 font-semibold">Controle Total de Custos</h3>
                  <p className="text-primary-foreground/80 text-sm">
                    Monitore e otimize o CMV do seu restaurante com precisão
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-primary-foreground/70 mt-2 h-2 w-2 flex-shrink-0 rounded-full" />
                <div>
                  <h3 className="mb-1 font-semibold">Fichas Técnicas Inteligentes</h3>
                  <p className="text-primary-foreground/80 text-sm">
                    Calcule automaticamente os custos de suas receitas
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-primary-foreground/70 mt-2 h-2 w-2 flex-shrink-0 rounded-full" />
                <div>
                  <h3 className="mb-1 font-semibold">Relatórios Avançados</h3>
                  <p className="text-primary-foreground/80 text-sm">
                    Insights detalhados para tomada de decisões estratégicas
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="flex-1 lg:w-1/2 xl:w-3/5">
          <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
              {/* Back to home button */}
              <div className="flex justify-start">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/" className="flex items-center gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    Voltar ao início
                  </Link>
                </Button>
              </div>

              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// src/app/(auth)/login/page.tsx
('use client');

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

import { useAuth } from '@/components/providers/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  const { signIn } = useAuth();
  const { toast } = useToast();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);

    try {
      const { error } = await signIn(data.email, data.password);

      if (error) {
        toast({
          title: 'Erro no login',
          description: error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Login realizado com sucesso!',
        description: 'Redirecionando...',
      });

      // Pequeno delay para mostrar o toast
      setTimeout(() => {
        router.push(redirectTo);
      }, 1000);
    } catch (error) {
      toast({
        title: 'Erro no login',
        description: 'Algo deu errado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Entrar na sua conta</CardTitle>
        <CardDescription>Digite seu email e senha para acessar o CMV Control</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="seu@email.com"
                      disabled={isLoading}
                      className="input-focus"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        disabled={isLoading}
                        className="input-focus pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between">
              <Link href="/forgot-password" className="text-primary text-sm hover:underline">
                Esqueceu a senha?
              </Link>
            </div>

            <Button type="submit" className="btn-primary w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Não tem uma conta?{' '}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Criar conta gratuita
            </Link>
          </p>
        </div>

        {/* Social Login - Para implementação futura */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="border-muted w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background text-muted-foreground px-2">Ou continue com</span>
            </div>
          </div>

          <div className="mt-4">
            <Button variant="outline" className="w-full" disabled>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google (em breve)
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// src/app/(auth)/register/page.tsx
('use client');

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';

import { useAuth } from '@/components/providers/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { signUp } = useAuth();
  const { toast } = useToast();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      nomeCompleto: '',
      nomeRestaurante: '',
      termsAccepted: false,
    },
  });

  const watchPassword = form.watch('password');

  // Validadores de senha em tempo real
  const passwordValidations = {
    length: watchPassword.length >= 6,
    lowercase: /[a-z]/.test(watchPassword),
    uppercase: /[A-Z]/.test(watchPassword),
    number: /\d/.test(watchPassword),
  };

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);

    try {
      const { error } = await signUp(data.email, data.password, {
        full_name: data.nomeCompleto,
        restaurant_name: data.nomeRestaurante,
      });

      if (error) {
        toast({
          title: 'Erro no cadastro',
          description: error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Conta criada com sucesso!',
        description: 'Verifique seu email para confirmar a conta.',
      });

      // Redirecionar para página de verificação de email
      router.push('/login?message=check-email');
    } catch (error) {
      toast({
        title: 'Erro no cadastro',
        description: 'Algo deu errado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Criar sua conta</CardTitle>
        <CardDescription>Comece a controlar o CMV do seu restaurante hoje mesmo</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="nomeCompleto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Seu nome completo"
                        disabled={isLoading}
                        className="input-focus"
                      />
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
                      <Input
                        {...field}
                        placeholder="Nome do seu restaurante"
                        disabled={isLoading}
                        className="input-focus"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="seu@email.com"
                      disabled={isLoading}
                      className="input-focus"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        disabled={isLoading}
                        className="input-focus pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>

                  {/* Validação visual da senha */}
                  {watchPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="text-muted-foreground text-xs">Sua senha deve ter:</div>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div
                          className={`flex items-center gap-1 ${passwordValidations.length ? 'text-green-600' : 'text-muted-foreground'}`}
                        >
                          <Check className="h-3 w-3" />
                          6+ caracteres
                        </div>
                        <div
                          className={`flex items-center gap-1 ${passwordValidations.lowercase ? 'text-green-600' : 'text-muted-foreground'}`}
                        >
                          <Check className="h-3 w-3" />
                          Minúscula
                        </div>
                        <div
                          className={`flex items-center gap-1 ${passwordValidations.uppercase ? 'text-green-600' : 'text-muted-foreground'}`}
                        >
                          <Check className="h-3 w-3" />
                          Maiúscula
                        </div>
                        <div
                          className={`flex items-center gap-1 ${passwordValidations.number ? 'text-green-600' : 'text-muted-foreground'}`}
                        >
                          <Check className="h-3 w-3" />
                          Número
                        </div>
                      </div>
                    </div>
                  )}

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        disabled={isLoading}
                        className="input-focus pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="termsAccepted"
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
                    <FormLabel className="text-sm">
                      Aceito os{' '}
                      <Link href="/termos" className="text-primary hover:underline">
                        termos de uso
                      </Link>{' '}
                      e{' '}
                      <Link href="/privacidade" className="text-primary hover:underline">
                        política de privacidade
                      </Link>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" className="btn-primary w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar conta gratuita'
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Fazer login
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// src/app/(auth)/forgot-password/page.tsx
('use client');

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth';
import { supabase } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { toast } = useToast();

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: 'Erro ao enviar email',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setEmailSent(true);
      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao enviar email',
        description: 'Algo deu errado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <Card className="border-0 shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Email enviado!</CardTitle>
          <CardDescription>
            Enviamos um link para redefinir sua senha para o seu email.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground text-sm">
            Não recebeu o email? Verifique sua caixa de spam ou tente novamente.
          </p>

          <div className="space-y-2">
            <Button onClick={() => setEmailSent(false)} variant="outline" className="w-full">
              Tentar outro email
            </Button>

            <Button asChild variant="ghost" className="w-full">
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Esqueceu sua senha?</CardTitle>
        <CardDescription>
          Digite seu email e enviaremos um link para redefinir sua senha
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="seu@email.com"
                      disabled={isLoading}
                      className="input-focus"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="btn-primary w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando email...
                </>
              ) : (
                'Enviar link de recuperação'
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <Button asChild variant="ghost">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao login
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
