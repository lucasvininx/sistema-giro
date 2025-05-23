"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, Edit } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import type { Parceiro } from "@/lib/supabase"

export default function DetalhesParceiroPage({ params }: { params: { id: string } }) {
  const { profile } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [parceiro, setParceiro] = useState<Parceiro | null>(null)
  const [criador, setCriador] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return

    const fetchParceiro = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("parceiros")
          .select(`
            *,
            profiles:created_by (nome)
          `)
          .eq("id", params.id)
          .single()

        if (error) {
          throw error
        }

        if (data) {
          setParceiro(data as any)
          setCriador(data.profiles?.nome || "Usuário desconhecido")
        }
      } catch (error: any) {
        console.error("Erro ao buscar parceiro:", error)
        toast({
          title: "Erro ao carregar parceiro",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchParceiro()
  }, [params.id, profile])

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (!parceiro) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/parceiros" className="inline-flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
          <h1 className="text-2xl font-bold">Parceiro não encontrado</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p>O parceiro solicitado não foi encontrado ou você não tem permissão para visualizá-lo.</p>
            <Button className="mt-4" onClick={() => router.push("/parceiros")}>
              Voltar para a lista de parceiros
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/parceiros" className="inline-flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
          <h1 className="text-2xl font-bold">Detalhes do Parceiro</h1>
        </div>
        <Link href={`/parceiros/${params.id}/editar`}>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Edit className="mr-2 h-4 w-4" /> Editar Parceiro
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{parceiro.nome}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
              <p className="mt-1">{parceiro.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Telefone</h3>
              <p className="mt-1">{parceiro.telefone}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Documento</h3>
              <p className="mt-1">
                {parceiro.tipo_documento === "cpf" ? "CPF: " : "CNPJ: "}
                {parceiro.documento}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Cadastrado por</h3>
              <p className="mt-1">{criador}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Data de Cadastro</h3>
              <p className="mt-1">{new Date(parceiro.created_at).toLocaleDateString("pt-BR")}</p>
            </div>
          </div>

          {parceiro.observacoes && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Observações</h3>
              <div className="bg-muted p-4 rounded-md">
                <p className="whitespace-pre-wrap">{parceiro.observacoes}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
