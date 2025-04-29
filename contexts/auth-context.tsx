"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase, type UserProfile } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isMaster: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      setIsLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      // ✅ Primeiro: se não tem sessão, redireciona para login e não tenta carregar perfil
      if (!session) {
        router.replace("/login");
        setIsLoading(false);
        return;
      }

      // ✅ Se tem sessão, carrega o perfil
      await handleSession(session);
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        router.replace("/login");
      } else {
        router.replace("/dashboard");
        await handleSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  async function handleSession(session: Session | null) {
    try {
      if (!session) {
        setUser(null);
        setProfile(null);
        return;
      }

      setUser(session.user);

      // Buscar o perfil
      const { data: profileData, error: profileError } = await supabase
        .rpc("get_my_profile")
        .maybeSingle();

      if (!profileError && profileData) {
        setProfile(profileData as UserProfile);
        return;
      }

      // Se RPC falhar, tenta buscar direto
      const { data: directData, error: directError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!directError && directData) {
        setProfile(directData as UserProfile);
        return;
      }

      // Se não achar, cria o perfil
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: session.user.id,
          email: session.user.email,
          role: "funcionario",
        })
        .select()
        .single();

      if (!createError && newProfile) {
        setProfile(newProfile as UserProfile);
      } else {
        console.error("Failed to create profile:", createError);
      }
    } catch (error) {
      console.error("Error handling session:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      console.error("Sign in error:", error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.replace("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const isAuthenticated = !!user;
  const isMaster = profile?.role === "master";

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
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
