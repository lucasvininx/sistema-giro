"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase, type UserProfile } from "@/lib/supabase"
import { useRouter, usePathname } from "next/navigation"
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
  const pathname = usePathname()

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setIsLoading(true)
        const {
          data: { session },
        } = await supabase.auth.getSession()

        // Se não há sessão e não estamos na página de login, redirecione
        if (!session && pathname !== "/login") {
          setIsLoading(false)
          router.push("/login")
          return
        }

        await handleSession(session)

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
          await handleSession(session)

          // Redirect based on auth state
          if (!session && pathname !== "/login") {
            router.push("/login")
          } else if (session && pathname === "/login") {
            router.push("/dashboard")
          }
        })

        return () => subscription.unsubscribe()
      } catch (error) {
        console.error("Error fetching session:", error)
        setIsLoading(false)
      }
    }

    fetchSession()
  }, [pathname, router])

  async function handleSession(session: Session | null) {
    setIsLoading(true)

    try {
      if (!session) {
        setUser(null)
        setProfile(null)
        setIsLoading(false)
        return
      }

      setUser(session.user)

      // Skip profile loading for login page
      if (pathname === "/login") {
        setIsLoading(false)
        return
      }

      // Método 1: Usar a função RPC get_my_profile
      try {
        const { data: profileData, error: profileError } = await supabase.rpc("get_my_profile").maybeSingle()

        if (!profileError && profileData) {
          console.log("Profile loaded via RPC:", profileData)
          setProfile(profileData as UserProfile)
          return
        } else if (profileError) {
          console.warn("Error using get_my_profile RPC:", profileError)
        }
      } catch (rpcError) {
        console.warn("RPC method failed:", rpcError)
      }

      // Método 2: Tentar consulta direta
      try {
        console.log("Trying direct query for user ID:", session.user.id)
        const { data: directData, error: directError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle()

        if (!directError && directData) {
          console.log("Profile loaded via direct query:", directData)
          setProfile(directData as UserProfile)
        } else if (directError) {
          console.warn("Error in direct query:", directError)

          // Método 3: Tentar criar o perfil se não existir
          try {
            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .insert({
                id: session.user.id,
                email: session.user.email,
                role: "funcionario",
              })
              .select()
              .single()

            if (!createError && newProfile) {
              console.log("Created new profile:", newProfile)
              setProfile(newProfile as UserProfile)
            } else {
              console.error("Failed to create profile:", createError)
            }
          } catch (createError) {
            console.error("Error creating profile:", createError)
          }
        }
      } catch (queryError) {
        console.error("Error in direct profile query:", queryError)
      }
    } catch (error) {
      console.error("Error in session handling:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      return { error }
    } catch (error) {
      console.error("Sign in error:", error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Sign out error:", error)
    }
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
