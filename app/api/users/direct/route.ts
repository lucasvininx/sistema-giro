import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

// Create a Supabase client with the service role key
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

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

    console.log("Creating user with standard Auth API:", email)

    // First, check if the user already exists
    try {
      const { data: existingUsers, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .limit(1)

      if (checkError) {
        console.error("Error checking existing user:", checkError)
        return NextResponse.json({ error: `Erro ao verificar email: ${checkError.message}` }, { status: 500 })
      }

      if (existingUsers && existingUsers.length > 0) {
        return NextResponse.json({ error: "Este email já está em uso" }, { status: 400 })
      }
    } catch (checkError: any) {
      console.error("Error during existence check:", checkError)
      // Continue anyway, the signUp will fail if the user exists
    }

    // Use the standard Auth API to sign up the user
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            role,
          },
        },
      })

      if (error) {
        console.error("Auth error:", error)
        return NextResponse.json({ error: `Erro ao criar usuário: ${error.message}` }, { status: 500 })
      }

      if (!data.user) {
        return NextResponse.json({ error: "Nenhum usuário retornado após criação" }, { status: 500 })
      }

      console.log("User created, updating profile for:", data.user.id)

      // Update profile with nome and role
      try {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            nome,
            role,
          })
          .eq("id", data.user.id)

        if (profileError) {
          console.error("Profile update error:", profileError)
          // Continue anyway, as the user was created
        }
      } catch (profileError: any) {
        console.error("Error during profile update:", profileError)
        // Continue anyway, as the user was created
      }

      return NextResponse.json({ success: true, user: data.user })
    } catch (authError: any) {
      console.error("Error during auth signup:", authError)

      // Try fallback method - direct profile creation
      try {
        console.log("Attempting fallback: direct profile creation")

        const { data: uuid } = await supabase.rpc("generate_uuid")
        const userId = uuid || crypto.randomUUID()

        const { error: insertError } = await supabase.from("profiles").insert({
          id: userId,
          email,
          nome,
          role,
          created_at: new Date().toISOString(),
        })

        if (insertError) {
          console.error("Direct insert error:", insertError)
          return NextResponse.json(
            {
              error: `Auth error: ${authError.message}. Fallback also failed: ${insertError.message}`,
            },
            { status: 500 },
          )
        }

        return NextResponse.json({
          success: true,
          user: { id: userId, email, user_metadata: { nome, role } },
          message: "Created profile directly (fallback method)",
        })
      } catch (fallbackError: any) {
        console.error("Fallback error:", fallbackError)
        return NextResponse.json(
          {
            error: `Auth error: ${authError.message}. Fallback also failed: ${fallbackError.message}`,
          },
          { status: 500 },
        )
      }
    }
  } catch (error: any) {
    console.error("Server error:", error)
    return NextResponse.json({ error: error.message || "Erro desconhecido ao criar usuário" }, { status: 500 })
  }
}
