-- Adicionar novos campos para operações
ALTER TABLE operacoes 
ADD COLUMN IF NOT EXISTS nome_operacao TEXT,
ADD COLUMN IF NOT EXISTS endereco_imovel TEXT,
-- Campos específicos para pessoa física
ADD COLUMN IF NOT EXISTS profissao TEXT,
ADD COLUMN IF NOT EXISTS salario NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS comprovacao_renda TEXT;

-- Criar índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_operacoes_nome_operacao ON operacoes(nome_operacao);
