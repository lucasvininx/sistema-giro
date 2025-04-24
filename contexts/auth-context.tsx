"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase, type UserProfile } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  isAuthenticated: boolean
  isMaster: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      handleSession(session)

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        handleSession(session)
      })

      return () => subscription.unsubscribe()
    }

    fetchSession()
  }, [])

  async function handleSession(session: Session | null) {
    setIsLoading(true)

    if (!session) {
      setUser(null)
      setProfile(null)
      setIsLoading(false)
      return
    }

    setUser(session.user)

    try {
      // Tenta chamar o RPC para obter o perfil do usuário
      const { data, error } = await supabase
        .rpc("get_profile_by_id", { user_id: session.user.id })
        .maybeSingle()

      // Se houver erro ou retorno vazio, tenta buscar com consulta direta
      if (error || !data || Object.keys(data).length === 0) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle()

        if (profileError || !profileData || Object.keys(profileData).length === 0) {
          console.error("Erro ao buscar perfil do usuário:", profileError || "Perfil não encontrado.")
          setProfile(null)
        } else {
          setProfile(profileData as UserProfile)
        }
      } else {
        setProfile(data as UserProfile)
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error)
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const isAuthenticated = !!user
  const isMaster = profile?.role === "master"

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        signIn,
        signOut,
        isAuthenticated,
        isMaster,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
