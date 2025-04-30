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
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Erro ao pegar sessão:", error);
      }

      if (session?.user) {
        setUser(session.user);
        await handleSession(session);
      } else {
        setUser(null);
        setProfile(null);
        if (location.pathname !== "/login") {
          router.replace("/login");
        }
        setIsLoading(false);
      }
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await handleSession(session);
        if (location.pathname === "/login") {
          router.replace("/dashboard");
        }
      } else {
        setUser(null);
        setProfile(null);
        if (location.pathname !== "/login") {
          router.replace("/login");
        }
        setIsLoading(false); // <- Isso estava faltando
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

      const { data: profileData, error: profileError } = await supabase
        .rpc("get_my_profile")
        .maybeSingle();

      if (!profileError && profileData) {
        setProfile(profileData as UserProfile);
      } else {
        const { data: directData, error: directError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (directData && !directError) {
          setProfile(directData as UserProfile);
        } else {
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
            console.error("Erro ao criar perfil:", createError);
          }
        }
      }
    } catch (error) {
      console.error("Erro em handleSession:", error);
    } finally {
      setIsLoading(false); // ← Garante que sempre será liberado
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
      console.error("Erro no signIn:", error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      router.replace("/login");
    } catch (error) {
      console.error("Erro no signOut:", error);
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
