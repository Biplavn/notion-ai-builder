-- ============================================
-- MIGRATION: Template Caching System
-- Purpose: Store and reuse AI-generated blueprints to reduce API calls
-- Date: January 16, 2026
-- ============================================

-- 1. Blueprint Cache Table
-- Stores generated blueprints with their prompts for reuse
CREATE TABLE IF NOT EXISTS blueprint_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Original prompt (normalized for matching)
    prompt_hash TEXT NOT NULL,
    prompt_original TEXT NOT NULL,
    prompt_normalized TEXT NOT NULL,

    -- Keywords extracted from prompt for fuzzy matching
    keywords TEXT[] DEFAULT '{}',

    -- The generated blueprint JSON
    blueprint JSONB NOT NULL,

    -- Template metadata
    template_title TEXT,
    template_category TEXT,

    -- Usage tracking
    times_used INTEGER DEFAULT 1,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),

    -- Quality metrics
    user_ratings INTEGER[] DEFAULT '{}',
    avg_rating DECIMAL(3,2) DEFAULT 0,
    successful_builds INTEGER DEFAULT 0,
    failed_builds INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    -- Ensure unique prompts
    CONSTRAINT unique_prompt_hash UNIQUE (prompt_hash)
);

-- 2. Built Templates Table
-- Stores successfully built templates with their Notion URLs
CREATE TABLE IF NOT EXISTS built_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Link to cached blueprint
    blueprint_cache_id UUID REFERENCES blueprint_cache(id),

    -- Template info
    template_title TEXT NOT NULL,
    template_description TEXT,

    -- Notion details
    notion_page_id TEXT NOT NULL,
    notion_url TEXT NOT NULL,
    duplicate_link TEXT NOT NULL,

    -- User who built it
    user_id UUID REFERENCES auth.users(id),

    -- Status
    is_public BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,

    -- Usage metrics
    times_duplicated INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Index for quick lookups
    CONSTRAINT unique_notion_page UNIQUE (notion_page_id)
);

-- 3. Prompt Keywords Table
-- Common keywords and their synonyms for better matching
CREATE TABLE IF NOT EXISTS prompt_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword TEXT NOT NULL UNIQUE,
    synonyms TEXT[] DEFAULT '{}',
    category TEXT,
    weight DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Insert common keywords for better matching
INSERT INTO prompt_keywords (keyword, synonyms, category, weight) VALUES
    ('project', ARRAY['projects', 'task', 'tasks', 'todo', 'todos', 'work'], 'productivity', 1.5),
    ('habit', ARRAY['habits', 'routine', 'routines', 'daily', 'tracker'], 'productivity', 1.5),
    ('goal', ARRAY['goals', 'objective', 'objectives', 'target', 'targets', 'okr'], 'productivity', 1.5),
    ('budget', ARRAY['budgets', 'money', 'finance', 'finances', 'expense', 'expenses'], 'finance', 1.5),
    ('workout', ARRAY['workouts', 'exercise', 'exercises', 'fitness', 'gym', 'training'], 'health', 1.5),
    ('meal', ARRAY['meals', 'food', 'recipe', 'recipes', 'cooking', 'diet', 'nutrition'], 'health', 1.5),
    ('crm', ARRAY['customer', 'customers', 'client', 'clients', 'sales', 'leads'], 'business', 1.5),
    ('content', ARRAY['blog', 'blogs', 'writing', 'article', 'articles', 'post', 'posts'], 'content', 1.5),
    ('study', ARRAY['studies', 'learning', 'course', 'courses', 'education', 'class'], 'education', 1.5),
    ('travel', ARRAY['trip', 'trips', 'vacation', 'vacations', 'itinerary', 'journey'], 'travel', 1.5),
    ('reading', ARRAY['books', 'book', 'library', 'reading list'], 'personal', 1.2),
    ('journal', ARRAY['journaling', 'diary', 'gratitude', 'reflection'], 'personal', 1.2),
    ('inventory', ARRAY['stock', 'warehouse', 'products', 'catalog'], 'business', 1.2),
    ('meeting', ARRAY['meetings', 'agenda', 'notes', 'minutes'], 'productivity', 1.2),
    ('kanban', ARRAY['board', 'sprint', 'agile', 'scrum'], 'productivity', 1.2)
ON CONFLICT (keyword) DO NOTHING;

-- 5. Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_blueprint_cache_prompt_hash ON blueprint_cache(prompt_hash);
CREATE INDEX IF NOT EXISTS idx_blueprint_cache_keywords ON blueprint_cache USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_blueprint_cache_category ON blueprint_cache(template_category);
CREATE INDEX IF NOT EXISTS idx_blueprint_cache_times_used ON blueprint_cache(times_used DESC);
CREATE INDEX IF NOT EXISTS idx_built_templates_blueprint ON built_templates(blueprint_cache_id);
CREATE INDEX IF NOT EXISTS idx_built_templates_user ON built_templates(user_id);

-- 6. Function to normalize prompts for matching
CREATE OR REPLACE FUNCTION normalize_prompt(prompt TEXT)
RETURNS TEXT AS $$
DECLARE
    normalized TEXT;
BEGIN
    -- Convert to lowercase
    normalized := LOWER(prompt);

    -- Remove special characters except spaces
    normalized := REGEXP_REPLACE(normalized, '[^a-z0-9\s]', '', 'g');

    -- Remove extra spaces
    normalized := REGEXP_REPLACE(normalized, '\s+', ' ', 'g');

    -- Trim
    normalized := TRIM(normalized);

    RETURN normalized;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. Function to generate prompt hash
CREATE OR REPLACE FUNCTION generate_prompt_hash(prompt TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN MD5(normalize_prompt(prompt));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 8. Function to extract keywords from prompt
CREATE OR REPLACE FUNCTION extract_keywords(prompt TEXT)
RETURNS TEXT[] AS $$
DECLARE
    normalized TEXT;
    words TEXT[];
    result TEXT[] := '{}';
    word TEXT;
    kw RECORD;
BEGIN
    normalized := normalize_prompt(prompt);
    words := STRING_TO_ARRAY(normalized, ' ');

    -- Check each word against our keyword table
    FOREACH word IN ARRAY words
    LOOP
        FOR kw IN SELECT keyword FROM prompt_keywords WHERE keyword = word OR word = ANY(synonyms)
        LOOP
            IF NOT kw.keyword = ANY(result) THEN
                result := result || kw.keyword;
            END IF;
        END LOOP;
    END LOOP;

    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- 9. Function to find similar blueprints
CREATE OR REPLACE FUNCTION find_similar_blueprints(search_prompt TEXT, min_score DECIMAL DEFAULT 0.6)
RETURNS TABLE (
    id UUID,
    prompt_original TEXT,
    blueprint JSONB,
    template_title TEXT,
    similarity_score DECIMAL,
    times_used INTEGER,
    avg_rating DECIMAL
) AS $$
DECLARE
    search_keywords TEXT[];
    search_normalized TEXT;
BEGIN
    search_normalized := normalize_prompt(search_prompt);
    search_keywords := extract_keywords(search_prompt);

    RETURN QUERY
    SELECT
        bc.id,
        bc.prompt_original,
        bc.blueprint,
        bc.template_title,
        -- Calculate similarity score based on keyword overlap and string similarity
        (
            COALESCE(
                (SELECT COUNT(*)::DECIMAL / GREATEST(array_length(search_keywords, 1), 1)
                 FROM unnest(search_keywords) sk
                 WHERE sk = ANY(bc.keywords)),
                0
            ) * 0.6 +
            similarity(search_normalized, bc.prompt_normalized) * 0.4
        )::DECIMAL AS similarity_score,
        bc.times_used,
        bc.avg_rating
    FROM blueprint_cache bc
    WHERE
        -- At least one keyword match OR high string similarity
        (bc.keywords && search_keywords OR similarity(search_normalized, bc.prompt_normalized) > 0.3)
        AND bc.successful_builds > 0  -- Only return blueprints that have worked before
    ORDER BY similarity_score DESC, bc.times_used DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql STABLE;

-- 10. Function to increment cache usage
CREATE OR REPLACE FUNCTION increment_cache_usage(cache_id UUID, was_successful BOOLEAN DEFAULT true)
RETURNS VOID AS $$
BEGIN
    UPDATE blueprint_cache
    SET
        times_used = times_used + 1,
        last_used_at = NOW(),
        successful_builds = CASE WHEN was_successful THEN successful_builds + 1 ELSE successful_builds END,
        failed_builds = CASE WHEN NOT was_successful THEN failed_builds + 1 ELSE failed_builds END
    WHERE id = cache_id;
END;
$$ LANGUAGE plpgsql;

-- 11. Function to add user rating to cached blueprint
CREATE OR REPLACE FUNCTION rate_cached_blueprint(cache_id UUID, rating INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE blueprint_cache
    SET
        user_ratings = user_ratings || rating,
        avg_rating = (SELECT AVG(r)::DECIMAL(3,2) FROM unnest(user_ratings || rating) AS r)
    WHERE id = cache_id
    AND rating BETWEEN 1 AND 5;
END;
$$ LANGUAGE plpgsql;

-- 12. Enable pg_trgm extension for fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 13. Create text similarity index
CREATE INDEX IF NOT EXISTS idx_blueprint_cache_prompt_trgm
ON blueprint_cache USING GIN (prompt_normalized gin_trgm_ops);

-- 14. RLS Policies
ALTER TABLE blueprint_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE built_templates ENABLE ROW LEVEL SECURITY;

-- Blueprint cache: Read for all, write for authenticated users
CREATE POLICY "Blueprint cache readable by all" ON blueprint_cache
    FOR SELECT USING (true);

CREATE POLICY "Blueprint cache insertable by authenticated" ON blueprint_cache
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Blueprint cache updatable by system" ON blueprint_cache
    FOR UPDATE USING (true);

-- Built templates: Read public, write own
CREATE POLICY "Built templates readable if public" ON built_templates
    FOR SELECT USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Built templates insertable by authenticated" ON built_templates
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- 15. Analytics view for cache performance
CREATE OR REPLACE VIEW cache_analytics AS
SELECT
    COUNT(*) as total_cached_blueprints,
    SUM(times_used) as total_cache_hits,
    SUM(successful_builds) as total_successful_builds,
    SUM(failed_builds) as total_failed_builds,
    ROUND(AVG(times_used)::NUMERIC, 2) as avg_reuses_per_blueprint,
    ROUND(AVG(avg_rating)::NUMERIC, 2) as overall_avg_rating,
    COUNT(CASE WHEN times_used > 5 THEN 1 END) as popular_blueprints,
    (SELECT COUNT(*) FROM built_templates) as total_templates_built
FROM blueprint_cache;

-- Grant access to analytics view
GRANT SELECT ON cache_analytics TO authenticated;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check tables exist
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('blueprint_cache', 'built_templates', 'prompt_keywords');

-- Check functions exist
-- SELECT routine_name FROM information_schema.routines
-- WHERE routine_schema = 'public'
-- AND routine_name IN ('normalize_prompt', 'generate_prompt_hash', 'extract_keywords', 'find_similar_blueprints');

-- Test normalization
-- SELECT normalize_prompt('Build me a Project Management System!!!');
-- Should return: 'build me a project management system'

-- Test keyword extraction
-- SELECT extract_keywords('I need a project tracker with goals and habits');
-- Should return: '{project,goal,habit}'

COMMENT ON TABLE blueprint_cache IS 'Stores AI-generated blueprints for reuse, reducing OpenAI API calls';
COMMENT ON TABLE built_templates IS 'Stores successfully built templates in Notion with their duplicate links';
COMMENT ON TABLE prompt_keywords IS 'Common keywords and synonyms for matching similar prompts';
