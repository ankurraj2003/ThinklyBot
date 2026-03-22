-- 1. Drop the existing table and function
DROP FUNCTION IF EXISTS match_thinkly_knowledge;
DROP TABLE IF EXISTS thinkly_knowledge;

-- 2. Create the table with 1536 dimensions for text-embedding-3-small
CREATE TABLE thinkly_knowledge (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding vector(1536)
);

-- 3. Create the matching function
CREATE OR REPLACE FUNCTION match_thinkly_knowledge (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    thinkly_knowledge.id,
    thinkly_knowledge.content,
    1 - (thinkly_knowledge.embedding <=> query_embedding) AS similarity
  FROM thinkly_knowledge
  WHERE 1 - (thinkly_knowledge.embedding <=> query_embedding) > match_threshold
  ORDER BY thinkly_knowledge.embedding <=> query_embedding
  LIMIT match_count;
$$;
