"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InfoIcon } from "lucide-react"

export function GuiaAdmin() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Guia para Cadastro de Administradores</CardTitle>
        <CardDescription>
          Siga estas instruções para adicionar novos usuários administradores ao sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Importante</AlertTitle>
          <AlertDescription>
            Usuários administradores têm acesso completo ao sistema, incluindo a capacidade de alterar status de
            operações e gerenciar outros usuários.
          </AlertDescription>
        </Alert>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Passo 1: Clique em "Novo Usuário"</AccordionTrigger>
            <AccordionContent>
              Clique no botão "Novo Usuário" no canto superior direito da página de usuários.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>Passo 2: Preencha os dados do usuário</AccordionTrigger>
            <AccordionContent>
              <p>Preencha todos os campos obrigatórios:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Nome completo do usuário</li>
                <li>Email válido (será usado para login)</li>
                <li>Senha segura (mínimo 6 caracteres)</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger>Passo 3: Selecione o tipo "Administrador"</AccordionTrigger>
            <AccordionContent>
              <p>No campo "Tipo de Usuário", selecione a opção "Administrador".</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Isso concederá ao usuário permissões de administrador, permitindo acesso a todas as funcionalidades do
                sistema.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger>Passo 4: Clique em "Criar Usuário"</AccordionTrigger>
            <AccordionContent>
              <p>Clique no botão "Criar Usuário" para finalizar o cadastro.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Após a criação, o novo administrador poderá fazer login imediatamente com as credenciais fornecidas.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger>Passo 5: Comunique o novo administrador</AccordionTrigger>
            <AccordionContent>
              <p>Informe ao novo administrador sobre:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>O email e senha cadastrados</li>
                <li>A recomendação para alterar a senha no primeiro acesso</li>
                <li>As responsabilidades e permissões do papel de administrador</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
