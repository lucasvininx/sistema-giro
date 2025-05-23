"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, ArrowLeft } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import type { Parceiro } from "@/lib/supabase"

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  telefone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email("Email inválido"),
  tipo_documento: z.enum(["cpf", "cnpj"]),
  documento: z.string().min(11, "Documento inválido"),
  observacoes: z.string().optional(),
})

export default function EditarParceiroPage({ params }: { params: { id: string } }) {
  const { profile } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [parceiro, setParceiro] = useState<Parceiro | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      telefone: "",
      email: "",
      tipo_documento: "cpf",
      documento: "",
      observacoes: "",
    },
  })

  useEffect(() => {
    if (!profile) return

    const fetchParceiro = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase.from("parceiros").select("*").eq("id", params.id).single()

        if (error) {
          throw error
        }

        if (data) {
          setParceiro(data as Parceiro)
          form.reset({
            nome: data.nome,
            telefone: data.telefone,
            email: data.email,
            tipo_documento: data.tipo_documento,
            documento: data.documento,
            observacoes: data.observacoes || "",
          })
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
  }, [params.id, profile, form])

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!profile) return

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from("parceiros")
        .update({
          ...data,
        })
        .eq("id", params.id)

      if (error) {
        throw new Error(`Erro ao atualizar parceiro: ${error.message}`)
      }

      toast({
        title: "Parceiro atualizado com sucesso!",
        description: "As informações do parceiro foram atualizadas.",
      })

      router.push("/parceiros")
    } catch (error: any) {
      console.error("Erro ao atualizar parceiro:", error)
      toast({
        title: "Erro ao atualizar parceiro",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/parceiros" className="inline-flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Link>
        <h1 className="text-2xl font-bold">Editar Parceiro</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Formulário de Parceiro</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="tipo_documento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cpf">CPF</SelectItem>
                              <SelectItem value="cnpj">CNPJ</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="documento"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Documento</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={
                                form.watch("tipo_documento") === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"
                              }
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Informações adicionais sobre o parceiro"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-4">
                  <Link href="/parceiros">
                    <Button variant="outline" type="button">
                      Cancelar
                    </Button>
                  </Link>
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
