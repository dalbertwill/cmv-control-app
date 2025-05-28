// src/components/providers/auth-provider.tsx
"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string
  // Adicione outros campos conforme necessário
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Verificar se há um usuário salvo no localStorage ou verificar token
    const checkAuth = async () => {
      try {
        const savedUser = localStorage.getItem('user')
        if (savedUser) {
          setUser(JSON.parse(savedUser))
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      // Aqui você faria a chamada para sua API de login
      // Por enquanto, vamos simular um login
      const mockUser: User = {
        id: '1',
        email,
        name: email.split('@')[0] || 'User',
      }
      
      setUser(mockUser)
      localStorage.setItem('user', JSON.stringify(mockUser))
      router.push('/dashboard')
    } catch (error) {
      console.error('Erro ao fazer login:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      setUser(null)
      localStorage.removeItem('user')
      router.push('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      throw error
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      // Aqui você faria a chamada para sua API de registro
      // Por enquanto, vamos simular um registro
      const mockUser: User = {
        id: '1',
        email,
        name: name || email.split('@')[0] || 'User',
      }
      
      setUser(mockUser)
      localStorage.setItem('user', JSON.stringify(mockUser))
      router.push('/dashboard')
    } catch (error) {
      console.error('Erro ao fazer registro:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}