-- Check if parceiro_id column exists in operacoes table
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Check if the column exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'operacoes'
        AND column_name = 'parceiro_id'
    ) INTO column_exists;

    -- If the column doesn't exist, add it
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding parceiro_id column to operacoes table';
        
        -- Add the column
        EXECUTE 'ALTER TABLE operacoes ADD COLUMN parceiro_id UUID REFERENCES parceiros(id)';
        
        -- Create an index for better performance
        EXECUTE 'CREATE INDEX idx_operacoes_parceiro_id ON operacoes(parceiro_id)';
        
        RAISE NOTICE 'parceiro_id column added successfully';
    ELSE
        RAISE NOTICE 'parceiro_id column already exists in operacoes table';
    END IF;
END $$;
