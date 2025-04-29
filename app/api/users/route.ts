import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

// Create a Supabase client with the service role key for admin operations
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { email, password, nome, role } = await request.json()

    // Validate required fields
    if (!email || !password || !nome) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Formato de email inválido" }, { status: 400 })
    }

    console.log("Attempting to create user:", { email, nome, role })

    // Create user with admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      console.error("Supabase Auth Error:", authError)

      // Handle specific auth errors
      if (authError.message.includes("already exists") || authError.message.includes("already registered")) {
        return NextResponse.json({ error: "Este email já está registrado" }, { status: 400 })
      }

      return NextResponse.json({ error: `Erro ao criar usuário: ${authError.message}` }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Falha ao criar usuário: nenhum usuário retornado" }, { status: 500 })
    }

    console.log("User created successfully, updating profile:", authData.user.id)

    // Update the profile with nome and role
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        nome,
        role,
      })
      .eq("id", authData.user.id)

    if (profileError) {
      console.error("Profile Update Error:", profileError)
      return NextResponse.json({ error: `Erro ao atualizar perfil: ${profileError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: authData.user })
  } catch (error: any) {
    console.error("Server Error:", error)
    return NextResponse.json({ error: error.message || "Erro desconhecido ao criar usuário" }, { status: 500 })
  }
}
