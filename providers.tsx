'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';
import { AuthProvider } from './auth-provider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Create a stable query client instance
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Configurações padrão para queries
            staleTime: 5 * 60 * 1000, // 5 minutos
            gcTime: 10 * 60 * 1000, // 10 minutos (anteriormente cacheTime)
            retry: (failureCount, error: any) => {
              // Não tentar novamente para erros 404 ou 403
              if (error?.status === 404 || error?.status === 403) {
                return false;
              }
              // Tentar até 3 vezes para outros erros
              return failureCount < 3;
            },
            retryDelay: (attemptIndex) => {
              // Delay exponencial: 1s, 2s, 4s
              return Math.min(1000 * 2 ** attemptIndex, 30000);
            },
            // Refetch em foco da janela apenas se dados estão velhos
            refetchOnWindowFocus: 'always',
            // Refetch em reconexão de rede
            refetchOnReconnect: 'always',
            // Não refetch em mount se dados estão frescos
            refetchOnMount: true,
          },
          mutations: {
            // Configurações padrão para mutations
            retry: (failureCount, error: any) => {
              // Não tentar novamente para erros de validação
              if (error?.status >= 400 && error?.status < 500) {
                return false;
              }
              // Tentar até 2 vezes para erros de servidor
              return failureCount < 2;
            },
            retryDelay: (attemptIndex) => {
              return Math.min(1000 * 2 ** attemptIndex, 30000);
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
        storageKey="cmv-control-theme"
        themes={['light', 'dark', 'system']}
      >
        <AuthProvider>
          {children}

          {/* React Query DevTools - apenas em desenvolvimento */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools
              initialIsOpen={false}
              position="bottom-right"
              buttonPosition="bottom-right"
            />
          )}
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
