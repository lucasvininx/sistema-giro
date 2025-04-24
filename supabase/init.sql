-- Criação das tabelas

-- Tabela de perfis de usuários (extensão da tabela auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  nome TEXT,
  role TEXT DEFAULT 'funcionario' CHECK (role IN ('master', 'funcionario')),
  meta_operacoes INTEGER DEFAULT 10,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de parceiros
CREATE TABLE IF NOT EXISTS public.parceiros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  tipo_documento TEXT CHECK (tipo_documento IN ('cpf', 'cnpj')),
  documento TEXT,
  observacoes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de operações
CREATE TABLE IF NOT EXISTS public.operacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status TEXT CHECK (status IN (
    'pre_analise', 
    'analise', 
    'analise_credito', 
    'analise_juridica_laudo', 
    'comite', 
    'credito_aprovado', 
    'contrato_assinado', 
    'contrato_registrado', 
    'recusada'
  )),
  estado_civil TEXT CHECK (estado_civil IN ('solteiro', 'casado', 'divorciado', 'viuvo')),
  cnpj_empresa TEXT,
  faturamento NUMERIC,
  periodo_faturamento TEXT CHECK (periodo_faturamento IN ('mensal', 'anual')),
  quantidade_funcionarios INTEGER,
  possui_dividas BOOLEAN DEFAULT FALSE,
  valor_dividas NUMERIC,
  instituicao_financeira TEXT,
  dividas_processos TEXT,
  imovel_alugado BOOLEAN DEFAULT FALSE,
  valor_aluguel NUMERIC,
  tipos_imovel TEXT[],
  valor NUMERIC DEFAULT 0
);

-- Tabela de sócios
CREATE TABLE IF NOT EXISTS public.socios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operacao_id UUID REFERENCES public.operacoes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cpf TEXT,
  telefone TEXT,
  email TEXT,
  estado_civil TEXT CHECK (estado_civil IN ('solteiro', 'casado', 'divorciado', 'viuvo')),
  percentual_participacao NUMERIC
);

-- Tabela de imagens de imóveis
CREATE TABLE IF NOT EXISTS public.imagens_imovel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operacao_id UUID REFERENCES public.operacoes(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_capa BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de documentos
CREATE TABLE IF NOT EXISTS public.documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operacao_id UUID REFERENCES public.operacoes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Funções e Triggers

-- Função para criar perfil automaticamente quando um usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'funcionario');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Políticas de segurança (RLS)

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parceiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.socios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imagens_imovel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Usuários podem ver seus próprios perfis"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Administradores podem ver todos os perfis"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'master'
    )
  );

CREATE POLICY "Usuários podem atualizar seus próprios perfis"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Administradores podem atualizar todos os perfis"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'master'
    )
  );

-- Políticas para parceiros
CREATE POLICY "Todos os usuários autenticados podem ver parceiros"
  ON public.parceiros FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Todos os usuários autenticados podem criar parceiros"
  ON public.parceiros FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem atualizar parceiros que criaram"
  ON public.parceiros FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Administradores podem atualizar todos os parceiros"
  ON public.parceiros FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'master'
    )
  );

-- Políticas para operações
CREATE POLICY "Usuários podem ver suas próprias operações"
  ON public.operacoes FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Administradores podem ver todas as operações"
  ON public.operacoes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'master'
    )
  );

CREATE POLICY "Todos os usuários autenticados podem criar operações"
  ON public.operacoes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem atualizar operações que criaram"
  ON public.operacoes FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Administradores podem atualizar todas as operações"
  ON public.operacoes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'master'
    )
  );

-- Políticas para sócios
CREATE POLICY "Usuários podem ver sócios de suas operações"
  ON public.socios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.operacoes
      WHERE id = operacao_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Administradores podem ver todos os sócios"
  ON public.socios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'master'
    )
  );

CREATE POLICY "Todos os usuários autenticados podem criar sócios"
  ON public.socios FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem atualizar sócios de suas operações"
  ON public.socios FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.operacoes
      WHERE id = operacao_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Administradores podem atualizar todos os sócios"
  ON public.socios FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'master'
    )
  );

-- Políticas para imagens de imóveis
CREATE POLICY "Usuários podem ver imagens de suas operações"
  ON public.imagens_imovel FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.operacoes
      WHERE id = operacao_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Administradores podem ver todas as imagens"
  ON public.imagens_imovel FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'master'
    )
  );

CREATE POLICY "Todos os usuários autenticados podem criar imagens"
  ON public.imagens_imovel FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem atualizar imagens de suas operações"
  ON public.imagens_imovel FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.operacoes
      WHERE id = operacao_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Administradores podem atualizar todas as imagens"
  ON public.imagens_imovel FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'master'
    )
  );

CREATE POLICY "Usuários podem excluir imagens de suas operações"
  ON public.imagens_imovel FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.operacoes
      WHERE id = operacao_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Administradores podem excluir todas as imagens"
  ON public.imagens_imovel FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'master'
    )
  );

-- Políticas para documentos
CREATE POLICY "Usuários podem ver documentos de suas operações"
  ON public.documentos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.operacoes
      WHERE id = operacao_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Administradores podem ver todos os documentos"
  ON public.documentos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'master'
    )
  );

CREATE POLICY "Todos os usuários autenticados podem criar documentos"
  ON public.documentos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem atualizar documentos de suas operações"
  ON public.documentos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.operacoes
      WHERE id = operacao_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Administradores podem atualizar todos os documentos"
  ON public.documentos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'master'
    )
  );

CREATE POLICY "Usuários podem excluir documentos de suas operações"
  ON public.documentos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.operacoes
      WHERE id = operacao_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Administradores podem excluir todos os documentos"
  ON public.documentos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'master'
    )
  );

-- Criar usuário administrador inicial
INSERT INTO auth.users (id, email, email_confirmed_at, role)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'admin@exemplo.com', CURRENT_TIMESTAMP, 'authenticated')
ON CONFLICT DO NOTHING;

-- Definir senha para o usuário admin (senha: admin123)
INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at)
VALUES 
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '{"sub":"00000000-0000-0000-0000-000000000000","email":"admin@exemplo.com"}', 'email', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Atualizar perfil do admin
UPDATE public.profiles
SET nome = 'Administrador', role = 'master'
WHERE id = '00000000-0000-0000-0000-000000000000';

-- Criar buckets para armazenamento
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('images', 'images', true),
  ('documents', 'documents', true),
  ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

-- Políticas para storage
CREATE POLICY "Imagens são acessíveis publicamente"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('images', 'documents', 'avatars'));

CREATE POLICY "Usuários autenticados podem fazer upload de imagens"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('images', 'documents', 'avatars') AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem atualizar seus próprios objetos"
  ON storage.objects FOR UPDATE
  USING (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem excluir seus próprios objetos"
  ON storage.objects FOR DELETE
  USING (auth.uid()::text = (storage.foldername(name))[1]);
