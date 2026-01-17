import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { TemplateBlueprint } from "@/lib/types/blueprint";

// Singleton Supabase admin client for cache operations
let supabaseAdminInstance: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
    if (!supabaseAdminInstance) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Missing Supabase configuration for cache");
        }

        supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }
    return supabaseAdminInstance;
}

// In-memory cache for frequently accessed blueprints (LRU-style)
const memoryCache = new Map<string, { blueprint: TemplateBlueprint; cacheId: string; timestamp: number }>();
const MEMORY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MEMORY_CACHE_MAX_SIZE = 50;

export interface CachedBlueprint {
    id: string;
    prompt_original: string;
    blueprint: TemplateBlueprint;
    template_title: string;
    similarity_score: number;
    times_used: number;
    avg_rating: number;
}

export interface CacheResult {
    found: boolean;
    blueprint?: TemplateBlueprint;
    cacheId?: string;
    similarity?: number;
    source: "cache" | "generated";
}

/**
 * Increment times_used counter for a cache entry (for analytics)
 */
async function incrementCacheHit(cacheId: string): Promise<void> {
    try {
        const supabase = getSupabaseAdmin();

        // First get current value, then increment
        const { data: current } = await supabase
            .from("blueprint_cache")
            .select("times_used")
            .eq("id", cacheId)
            .single();

        if (current) {
            await supabase
                .from("blueprint_cache")
                .update({ times_used: (current.times_used || 0) + 1 })
                .eq("id", cacheId);
        }
    } catch (error) {
        // Silently fail - analytics shouldn't block main flow
        console.error("[Cache] Failed to increment cache hit:", error);
    }
}

// Normalize prompt for consistent matching
function normalizePrompt(prompt: string): string {
    return prompt
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

// Generate MD5-like hash for prompt (simple version)
function generatePromptHash(prompt: string): string {
    const normalized = normalizePrompt(prompt);
    // Simple hash function for client-side use
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
        const char = normalized.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, "0");
}

// Common keywords for matching
const KEYWORD_MAP: Record<string, string[]> = {
    project: ["projects", "task", "tasks", "todo", "todos", "work", "kanban"],
    habit: ["habits", "routine", "routines", "daily", "tracker", "streak"],
    goal: ["goals", "objective", "objectives", "target", "targets", "okr", "milestone"],
    budget: ["budgets", "money", "finance", "finances", "expense", "expenses", "income"],
    workout: ["workouts", "exercise", "exercises", "fitness", "gym", "training", "health"],
    meal: ["meals", "food", "recipe", "recipes", "cooking", "diet", "nutrition", "calories"],
    crm: ["customer", "customers", "client", "clients", "sales", "leads", "pipeline"],
    content: ["blog", "blogs", "writing", "article", "articles", "post", "posts", "editorial"],
    study: ["studies", "learning", "course", "courses", "education", "class", "notes"],
    travel: ["trip", "trips", "vacation", "vacations", "itinerary", "journey", "destination"],
    reading: ["books", "book", "library", "reading list"],
    journal: ["journaling", "diary", "gratitude", "reflection", "mood"],
    inventory: ["stock", "warehouse", "products", "catalog", "assets"],
    meeting: ["meetings", "agenda", "notes", "minutes", "standup"],
    sprint: ["sprints", "agile", "scrum", "backlog"],
};

// Extract keywords from prompt
function extractKeywords(prompt: string): string[] {
    const normalized = normalizePrompt(prompt);
    const words = normalized.split(" ");
    const keywords: Set<string> = new Set();

    for (const word of words) {
        // Check if word matches any keyword or synonym
        for (const [keyword, synonyms] of Object.entries(KEYWORD_MAP)) {
            if (word === keyword || synonyms.includes(word)) {
                keywords.add(keyword);
            }
        }
    }

    return Array.from(keywords);
}

// Calculate similarity between two prompts
function calculateSimilarity(prompt1: string, prompt2: string): number {
    const norm1 = normalizePrompt(prompt1);
    const norm2 = normalizePrompt(prompt2);

    // Keyword-based similarity (60% weight)
    const keywords1 = new Set(extractKeywords(prompt1));
    const keywords2 = new Set(extractKeywords(prompt2));
    const intersection = new Set([...keywords1].filter((x) => keywords2.has(x)));
    const union = new Set([...keywords1, ...keywords2]);
    const keywordSimilarity = union.size > 0 ? intersection.size / union.size : 0;

    // Word overlap similarity (40% weight)
    const words1 = new Set(norm1.split(" ").filter((w) => w.length > 2));
    const words2 = new Set(norm2.split(" ").filter((w) => w.length > 2));
    const wordIntersection = new Set([...words1].filter((x) => words2.has(x)));
    const wordUnion = new Set([...words1, ...words2]);
    const wordSimilarity = wordUnion.size > 0 ? wordIntersection.size / wordUnion.size : 0;

    return keywordSimilarity * 0.6 + wordSimilarity * 0.4;
}

/**
 * Add to memory cache with LRU eviction
 */
function addToMemoryCache(promptHash: string, blueprint: TemplateBlueprint, cacheId: string): void {
    // Evict oldest entries if cache is full
    if (memoryCache.size >= MEMORY_CACHE_MAX_SIZE) {
        const oldestKey = memoryCache.keys().next().value;
        if (oldestKey) memoryCache.delete(oldestKey);
    }
    memoryCache.set(promptHash, { blueprint, cacheId, timestamp: Date.now() });
}

/**
 * Get from memory cache if valid
 */
function getFromMemoryCache(promptHash: string): { blueprint: TemplateBlueprint; cacheId: string } | null {
    const cached = memoryCache.get(promptHash);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > MEMORY_CACHE_TTL) {
        memoryCache.delete(promptHash);
        return null;
    }

    // Move to end (LRU behavior)
    memoryCache.delete(promptHash);
    memoryCache.set(promptHash, { ...cached, timestamp: Date.now() });

    return { blueprint: cached.blueprint, cacheId: cached.cacheId };
}

/**
 * Search for a similar cached blueprint
 * Returns the best match if similarity score is above threshold
 * Optimized with in-memory caching and parallel database queries
 */
export async function findCachedBlueprint(
    prompt: string,
    minSimilarity: number = 0.65
): Promise<CacheResult> {
    const startTime = Date.now();
    const promptHash = generatePromptHash(prompt);

    try {
        // Step 1: Check in-memory cache first (instant)
        const memoryCached = getFromMemoryCache(promptHash);
        if (memoryCached) {
            console.log(`[Cache] Memory cache hit for: "${prompt.substring(0, 30)}..." (${Date.now() - startTime}ms)`);
            // Fire and forget analytics update
            incrementCacheHit(memoryCached.cacheId).catch(() => {});
            return {
                found: true,
                blueprint: memoryCached.blueprint,
                cacheId: memoryCached.cacheId,
                similarity: 1.0,
                source: "cache",
            };
        }

        const supabase = getSupabaseAdmin();
        const keywords = extractKeywords(prompt);

        // Step 2: Run exact match and keyword search in parallel
        const [exactMatchPromise, keywordMatchPromise] = await Promise.allSettled([
            // Exact hash match
            supabase
                .from("blueprint_cache")
                .select("id, prompt_original, blueprint, template_title, times_used")
                .eq("prompt_hash", promptHash)
                .single(),
            // Keyword-based search (only if we have keywords)
            keywords.length > 0
                ? supabase
                    .from("blueprint_cache")
                    .select("id, prompt_original, blueprint, template_title, times_used, avg_rating")
                    .contains("keywords", keywords)
                    .order("times_used", { ascending: false })
                    .limit(10)
                : Promise.resolve({ data: null, error: null })
        ]);

        // Check exact match first
        if (exactMatchPromise.status === 'fulfilled') {
            const { data: exactMatch, error: exactError } = exactMatchPromise.value;
            if (exactMatch && !exactError) {
                console.log(`[Cache] DB exact match found (${Date.now() - startTime}ms): "${prompt.substring(0, 30)}..."`);

                // Add to memory cache for faster future lookups
                addToMemoryCache(promptHash, exactMatch.blueprint as TemplateBlueprint, exactMatch.id);

                // Fire and forget analytics
                incrementCacheHit(exactMatch.id).catch(() => {});

                return {
                    found: true,
                    blueprint: exactMatch.blueprint as TemplateBlueprint,
                    cacheId: exactMatch.id,
                    similarity: 1.0,
                    source: "cache",
                };
            }
        }

        // Check keyword-based matches
        if (keywordMatchPromise.status === 'fulfilled' && keywords.length > 0) {
            const { data: similarBlueprints, error: searchError } = keywordMatchPromise.value;

            if (!searchError && similarBlueprints && similarBlueprints.length > 0) {
                // Calculate similarity scores and find best match
                let bestMatch: CachedBlueprint | null = null;
                let bestScore = 0;

                for (const cached of similarBlueprints) {
                    const score = calculateSimilarity(prompt, cached.prompt_original);
                    if (score > bestScore && score >= minSimilarity) {
                        bestScore = score;
                        bestMatch = {
                            id: cached.id,
                            prompt_original: cached.prompt_original,
                            blueprint: cached.blueprint as TemplateBlueprint,
                            template_title: cached.template_title,
                            similarity_score: score,
                            times_used: cached.times_used,
                            avg_rating: cached.avg_rating,
                        };
                    }
                }

                if (bestMatch) {
                    console.log(
                        `[Cache] Similar blueprint found (${(bestScore * 100).toFixed(1)}% match, ${Date.now() - startTime}ms): "${bestMatch.template_title}"`
                    );

                    // Add to memory cache with the search prompt hash
                    addToMemoryCache(promptHash, bestMatch.blueprint, bestMatch.id);

                    // Fire and forget analytics
                    incrementCacheHit(bestMatch.id).catch(() => {});

                    return {
                        found: true,
                        blueprint: bestMatch.blueprint,
                        cacheId: bestMatch.id,
                        similarity: bestScore,
                        source: "cache",
                    };
                }
            }
        }

        console.log(`[Cache] No match found (${Date.now() - startTime}ms): "${prompt.substring(0, 30)}..."`);
        return { found: false, source: "generated" };
    } catch (error) {
        console.error(`[Cache] Error searching cache (${Date.now() - startTime}ms):`, error);
        return { found: false, source: "generated" };
    }
}

/**
 * Store a newly generated blueprint in the cache
 */
export async function cacheBlueprint(
    prompt: string,
    blueprint: TemplateBlueprint,
    userId?: string
): Promise<string | null> {
    try {
        const supabase = getSupabaseAdmin();
        const promptHash = generatePromptHash(prompt);
        const normalizedPrompt = normalizePrompt(prompt);
        const keywords = extractKeywords(prompt);

        // Determine category from blueprint or keywords
        let category = "general";
        if (keywords.includes("project") || keywords.includes("goal")) category = "productivity";
        else if (keywords.includes("budget")) category = "finance";
        else if (keywords.includes("workout") || keywords.includes("meal")) category = "health";
        else if (keywords.includes("crm")) category = "business";
        else if (keywords.includes("content")) category = "content";
        else if (keywords.includes("study")) category = "education";
        else if (keywords.includes("travel")) category = "travel";

        const { data, error } = await supabase
            .from("blueprint_cache")
            .upsert(
                {
                    prompt_hash: promptHash,
                    prompt_original: prompt,
                    prompt_normalized: normalizedPrompt,
                    keywords: keywords,
                    blueprint: blueprint,
                    template_title: blueprint.title,
                    template_category: category,
                    created_by: userId || null,
                    successful_builds: 1,
                },
                {
                    onConflict: "prompt_hash",
                    ignoreDuplicates: false,
                }
            )
            .select("id")
            .single();

        if (error) {
            console.error("[Cache] Error caching blueprint:", error);
            return null;
        }

        console.log(`[Cache] Blueprint cached: "${blueprint.title}" (ID: ${data.id})`);
        return data.id;
    } catch (error) {
        console.error("[Cache] Error caching blueprint:", error);
        return null;
    }
}

/**
 * Update cache statistics after a build
 */
export async function updateCacheStats(
    cacheId: string,
    success: boolean
): Promise<void> {
    try {
        const supabase = getSupabaseAdmin();

        if (success) {
            await supabase.rpc("increment_cache_usage", {
                cache_id: cacheId,
                was_successful: true,
            });
        } else {
            await supabase.rpc("increment_cache_usage", {
                cache_id: cacheId,
                was_successful: false,
            });
        }
    } catch (error) {
        console.error("[Cache] Error updating cache stats:", error);
    }
}

/**
 * Store a successfully built template for reference
 */
export async function storeBuiltTemplate(
    blueprintCacheId: string | null,
    title: string,
    description: string,
    notionPageId: string,
    notionUrl: string,
    duplicateLink: string,
    userId?: string
): Promise<string | null> {
    try {
        const supabase = getSupabaseAdmin();

        const { data, error } = await supabase
            .from("built_templates")
            .insert({
                blueprint_cache_id: blueprintCacheId,
                template_title: title,
                template_description: description,
                notion_page_id: notionPageId,
                notion_url: notionUrl,
                duplicate_link: duplicateLink,
                user_id: userId || null,
                is_public: true,
            })
            .select("id")
            .single();

        if (error) {
            console.error("[Cache] Error storing built template:", error);
            return null;
        }

        console.log(`[Cache] Built template stored: "${title}" (ID: ${data.id})`);
        return data.id;
    } catch (error) {
        console.error("[Cache] Error storing built template:", error);
        return null;
    }
}

/**
 * Get cache analytics
 */
export async function getCacheAnalytics(): Promise<{
    totalCached: number;
    totalHits: number;
    hitRate: number;
    popularTemplates: Array<{ title: string; uses: number }>;
} | null> {
    try {
        const supabase = getSupabaseAdmin();

        // Get total cached blueprints and usage
        const { data: stats, error: statsError } = await supabase
            .from("blueprint_cache")
            .select("id, template_title, times_used, successful_builds");

        if (statsError || !stats) {
            return null;
        }

        const totalCached = stats.length;
        const totalHits = stats.reduce((sum, s) => sum + s.times_used, 0);
        const totalBuilds = stats.reduce((sum, s) => sum + s.successful_builds, 0);
        const hitRate = totalBuilds > 0 ? (totalHits - totalCached) / totalBuilds : 0;

        // Get popular templates
        const popularTemplates = stats
            .filter((s) => s.times_used > 1)
            .sort((a, b) => b.times_used - a.times_used)
            .slice(0, 5)
            .map((s) => ({ title: s.template_title, uses: s.times_used }));

        return {
            totalCached,
            totalHits,
            hitRate: Math.round(hitRate * 100),
            popularTemplates,
        };
    } catch (error) {
        console.error("[Cache] Error getting analytics:", error);
        return null;
    }
}
