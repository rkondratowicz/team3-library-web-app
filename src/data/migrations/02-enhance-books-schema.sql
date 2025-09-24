-- This migration has been superseded by 04-fix-books-schema.sql
-- The ALTER TABLE approach caused schema formatting issues
-- Please use the complete schema recreation in migration 04 instead

-- DEPRECATED: Do not run this migration
-- ALTER TABLE books ADD COLUMN isbn VARCHAR(13);
-- ALTER TABLE books ADD COLUMN genre VARCHAR(100);
-- ALTER TABLE books ADD COLUMN publication_year INTEGER;
-- ALTER TABLE books ADD COLUMN description TEXT;