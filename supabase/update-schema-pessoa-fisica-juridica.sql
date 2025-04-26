-- Adicionar campos para suportar pessoa física e jurídica
ALTER TABLE operacoes 
ADD COLUMN IF NOT EXISTS tipo_pessoa TEXT DEFAULT 'juridica' CHECK (tipo_pessoa IN ('fisica', 'juridica')),
ADD COLUMN IF NOT EXISTS nome_cliente TEXT,
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS email_cliente TEXT,
ADD COLUMN IF NOT EXISTS telefone_cliente TEXT;

-- Criar índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_operacoes_tipo_pessoa ON operacoes(tipo_pessoa);
CREATE INDEX IF NOT EXISTS idx_operacoes_cpf ON operacoes(cpf);
