import React, { Suspense } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth-context";
import ClientOnly from "@/components/client-only";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Giro Capital - Sistema Interno",
  description: "Sistema de gestão de operações da Giro Capital",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={<div className="p-4 text-center">Carregando...</div>}>
            <ClientOnly>
              <AuthProvider>{children}</AuthProvider>
            </ClientOnly>
          </Suspense>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
