"use server"

import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function createProfileOnly(userData: {
  email: string
  nome: string
  role: string
}) {
  try {
    console.log("Creating profile only for:", userData.email)

    // Call the SQL function to create a profile only
    const { data, error } = await supabaseAdmin.rpc("create_profile_only", {
      p_email: userData.email,
      p_nome: userData.nome,
      p_role: userData.role,
    })

    if (error) {
      console.error("SQL error:", error)
      return { success: false, error: `Erro ao criar perfil: ${error.message}` }
    }

    return { success: true, profile: data }
  } catch (error: any) {
    console.error("Server error:", error)
    return { success: false, error: error.message || "Erro desconhecido ao criar perfil" }
  }
}
