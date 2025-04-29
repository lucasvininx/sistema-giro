"use server"

import { createClient } from "@supabase/supabase-js"

// Create a standard Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Create a separate admin client for profile updates
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function createUserAction(userData: {
  email: string
  password: string
  nome: string
  role: string
}) {
  try {
    console.log("Creating user with standard Auth API:", userData.email)

    // First, check if the user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", userData.email)
      .limit(1)

    if (checkError) {
      console.error("Error checking existing user:", checkError)
      return { success: false, error: `Erro ao verificar email: ${checkError.message}` }
    }

    if (existingUsers && existingUsers.length > 0) {
      return { success: false, error: "Este email já está em uso" }
    }

    // Use the standard Auth API to sign up the user
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          nome: userData.nome,
          role: userData.role,
        },
      },
    })

    if (error) {
      console.error("Auth error:", error)
      return { success: false, error: `Erro ao criar usuário: ${error.message}` }
    }

    if (!data.user) {
      return { success: false, error: "Nenhum usuário retornado após criação" }
    }

    console.log("User created, updating profile for:", data.user.id)

    // Manually confirm the email since we're an admin
    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(data.user.id, { email_confirm: true })

    if (confirmError) {
      console.error("Email confirmation error:", confirmError)
      // Continue anyway, as the user was created
    }

    // Update profile with nome and role
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        nome: userData.nome,
        role: userData.role,
      })
      .eq("id", data.user.id)

    if (profileError) {
      console.error("Profile update error:", profileError)
      return { success: false, error: `Erro ao atualizar perfil: ${profileError.message}` }
    }

    return { success: true, user: data.user }
  } catch (error: any) {
    console.error("Server error:", error)
    return { success: false, error: error.message || "Erro desconhecido ao criar usuário" }
  }
}

// Alternative approach using direct SQL
export async function createUserWithSQL(userData: {
  email: string
  password: string
  nome: string
  role: string
}) {
  try {
    console.log("Creating user with direct SQL:", userData.email)

    // Use a direct SQL query to insert the user
    const { data, error } = await supabaseAdmin.rpc("create_user_direct", {
      p_email: userData.email,
      p_password: userData.password,
      p_nome: userData.nome,
      p_role: userData.role,
    })

    if (error) {
      console.error("SQL error:", error)
      return { success: false, error: `Erro ao criar usuário: ${error.message}` }
    }

    return { success: true, user: data }
  } catch (error: any) {
    console.error("Server error:", error)
    return { success: false, error: error.message || "Erro desconhecido ao criar usuário" }
  }
}
