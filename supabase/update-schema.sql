-- Adicionar coluna parceiro_id à tabela operacoes
ALTER TABLE public.operacoes 
ADD COLUMN IF NOT EXISTS parceiro_id UUID 
REFERENCES public.parceiros(id) ON DELETE SET NULL;

-- Criar um índice para melhorar o desempenho das consultas
CREATE INDEX IF NOT EXISTS idx_operacoes_parceiro_id ON public.operacoes(parceiro_id);
