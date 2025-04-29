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

    console.log("Attempting to create user with SQL RPC:", { email, nome, role })

    // Use a SQL RPC function to create the user
    const { data, error } = await supabaseAdmin.rpc("create_user_with_profile", {
      p_email: email,
      p_password: password,
      p_nome: nome,
      p_role: role,
    })

    if (error) {
      console.error("SQL RPC Error:", error)
      return NextResponse.json({ error: `Erro ao criar usuário: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: data })
  } catch (error: any) {
    console.error("Server Error:", error)
    return NextResponse.json({ error: error.message || "Erro desconhecido ao criar usuário" }, { status: 500 })
  }
}
