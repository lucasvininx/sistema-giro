"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Upload, User } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"
import { v4 as uuidv4 } from "uuid"

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional(),
  meta_operacoes: z.coerce.number().min(0, "Meta inválida").optional(),
})

export default function PerfilPage() {
  const { profile, user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: profile?.nome || "",
      email: user?.email || "",
      meta_operacoes: profile?.meta_operacoes || 0,
    },
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatarFile(file)

      const reader = new FileReader()
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!profile) return

    setIsSubmitting(true)

    try {
      let avatar_url = profile.avatar_url

      // Upload da nova foto de perfil, se houver
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop()
        const fileName = `${uuidv4()}.${fileExt}`
        const filePath = `${profile.id}/${fileName}`

        const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, avatarFile)

        if (uploadError) {
          throw new Error(`Erro ao fazer upload da imagem: ${uploadError.message}`)
        }

        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath)

        avatar_url = urlData.publicUrl
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          nome: data.nome,
          meta_operacoes: data.meta_operacoes,
          avatar_url,
        })
        .eq("id", profile.id)

      if (error) {
        throw new Error(`Erro ao atualizar perfil: ${error.message}`)
      }

      toast({
        title: "Perfil atualizado com sucesso!",
        description: "Suas informações foram atualizadas.",
      })
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error)
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!profile || !user) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative mb-4">
              {avatarPreview ? (
                <div className="w-24 h-24 rounded-full overflow-hidden">
                  <Image
                    src={avatarPreview || "/placeholder.svg"}
                    alt={profile.nome || "Perfil"}
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-orange-500 flex items-center justify-center text-white">
                  <User className="h-12 w-12" />
                </div>
              )}

              <Label
                htmlFor="avatar"
                className="absolute bottom-0 right-0 bg-orange-500 text-white p-1 rounded-full cursor-pointer hover:bg-orange-600 transition-colors"
              >
                <Upload className="h-4 w-4" />
                <Input id="avatar" type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
              </Label>
            </div>
            <h2 className="text-xl font-semibold">{profile.nome}</h2>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="mt-4 px-3 py-1 rounded-full bg-black text-white text-xs uppercase">
              {profile.role === "master" ? "Administrador" : "Funcionário"}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Editar Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user.email} disabled />
                  <p className="text-sm text-muted-foreground">O email não pode ser alterado.</p>
                </div>

                {profile.role === "funcionario" && (
                  <FormField
                    control={form.control}
                    name="meta_operacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta de Operações</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
