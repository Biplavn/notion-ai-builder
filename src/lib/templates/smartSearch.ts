import { TemplateMetadata, CURATED_TEMPLATES } from "./metadata";

/**
 * Smart template search with fuzzy matching and similarity suggestions
 */

// Keyword synonyms for better matching
const KEYWORD_SYNONYMS: Record<string, string[]> = {
    project: ["projects", "task", "tasks", "todo", "todos", "work", "kanban", "management"],
    habit: ["habits", "routine", "routines", "daily", "tracker", "streak", "practice"],
    goal: ["goals", "objective", "objectives", "target", "targets", "okr", "milestone", "achievement"],
    budget: ["budgets", "money", "finance", "finances", "expense", "expenses", "income", "spending"],
    workout: ["workouts", "exercise", "exercises", "fitness", "gym", "training", "health", "lift"],
    meal: ["meals", "food", "recipe", "recipes", "cooking", "diet", "nutrition", "calories", "eating"],
    crm: ["customer", "customers", "client", "clients", "sales", "leads", "pipeline", "contacts"],
    content: ["blog", "blogs", "writing", "article", "articles", "post", "posts", "editorial", "publish"],
    study: ["studies", "learning", "course", "courses", "education", "class", "notes", "school"],
    travel: ["trip", "trips", "vacation", "vacations", "itinerary", "journey", "destination", "packing"],
    reading: ["books", "book", "library", "read"],
    journal: ["journaling", "diary", "gratitude", "reflection", "mood", "log"],
    inventory: ["stock", "warehouse", "products", "catalog", "assets"],
    meeting: ["meetings", "agenda", "notes", "minutes", "standup"],
    sprint: ["sprints", "agile", "scrum", "backlog"],
    team: ["teams", "collaboration", "employee", "employees", "staff"],
    personal: ["life", "self", "individual", "private"],
    planner: ["planning", "plan", "schedule", "calendar", "organize"],
    track: ["tracker", "tracking", "monitor", "log", "record"],
};

// Normalize text for matching
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

// Extract keywords from a search query
function extractKeywords(query: string): string[] {
    const normalized = normalizeText(query);
    const words = normalized.split(" ");
    const keywords: Set<string> = new Set();

    for (const word of words) {
        if (word.length < 2) continue;
        keywords.add(word);

        // Add canonical keyword if this word is a synonym
        for (const [canonical, synonyms] of Object.entries(KEYWORD_SYNONYMS)) {
            if (word === canonical || synonyms.includes(word)) {
                keywords.add(canonical);
                break;
            }
        }
    }

    return Array.from(keywords);
}

// Calculate similarity score between query and template
function calculateSimilarity(query: string, template: TemplateMetadata): number {
    const queryKeywords = extractKeywords(query);
    if (queryKeywords.length === 0) return 0;

    const templateText = normalizeText(
        `${template.name} ${template.description} ${template.tags.join(" ")} ${template.category}`
    );

    let matchScore = 0;
    let maxPossibleScore = queryKeywords.length;

    for (const keyword of queryKeywords) {
        // Direct match
        if (templateText.includes(keyword)) {
            matchScore += 1;
            continue;
        }

        // Check synonyms
        const synonyms = KEYWORD_SYNONYMS[keyword] || [];
        const hasSynonymMatch = synonyms.some(syn => templateText.includes(syn));
        if (hasSynonymMatch) {
            matchScore += 0.8; // Slightly lower score for synonym match
            continue;
        }

        // Partial match (word starts with query keyword)
        const templateWords = templateText.split(" ");
        const hasPartialMatch = templateWords.some(w => w.startsWith(keyword) || keyword.startsWith(w));
        if (hasPartialMatch) {
            matchScore += 0.5;
        }
    }

    return matchScore / maxPossibleScore;
}

export interface SearchResult {
    template: TemplateMetadata;
    similarity: number;
    matchType: "exact" | "partial" | "similar";
}

export interface SmartSearchResult {
    exactMatches: SearchResult[];
    similarSuggestions: SearchResult[];
    hasExactMatches: boolean;
}

/**
 * Perform smart search with similarity suggestions
 */
export function smartSearch(
    query: string,
    category: string = "All",
    minSimilarity: number = 0.3
): SmartSearchResult {
    if (!query.trim()) {
        // No query - return all templates in category
        const templates = CURATED_TEMPLATES.filter(
            t => category === "All" || t.category === category
        );
        return {
            exactMatches: templates.map(t => ({ template: t, similarity: 1, matchType: "exact" as const })),
            similarSuggestions: [],
            hasExactMatches: true
        };
    }

    const queryLower = query.toLowerCase();
    const exactMatches: SearchResult[] = [];
    const allScored: SearchResult[] = [];

    for (const template of CURATED_TEMPLATES) {
        // Filter by category first
        if (category !== "All" && template.category !== category) continue;

        // Check for exact matches (original logic)
        const isExactMatch =
            template.name.toLowerCase().includes(queryLower) ||
            template.description.toLowerCase().includes(queryLower) ||
            template.tags.some(tag => tag.toLowerCase().includes(queryLower));

        if (isExactMatch) {
            exactMatches.push({
                template,
                similarity: 1,
                matchType: "exact"
            });
        }

        // Calculate similarity for all templates
        const similarity = calculateSimilarity(query, template);
        if (similarity >= minSimilarity) {
            allScored.push({
                template,
                similarity,
                matchType: similarity >= 0.7 ? "partial" : "similar"
            });
        }
    }

    // Sort scored by similarity
    allScored.sort((a, b) => b.similarity - a.similarity);

    // Get similar suggestions (excluding exact matches)
    const exactIds = new Set(exactMatches.map(e => e.template.id));
    const similarSuggestions = allScored
        .filter(s => !exactIds.has(s.template.id))
        .slice(0, 6); // Limit to 6 suggestions

    return {
        exactMatches,
        similarSuggestions,
        hasExactMatches: exactMatches.length > 0
    };
}

/**
 * Get featured templates as fallback suggestions
 * Returns a mix of templates from different categories
 */
export function getPopularTemplates(limit: number = 6, excludeIds: string[] = []): TemplateMetadata[] {
    const filtered = CURATED_TEMPLATES.filter(t => !excludeIds.includes(t.id));

    // Get a diverse mix of templates from different categories
    const byCategory = new Map<string, TemplateMetadata[]>();
    for (const t of filtered) {
        if (!byCategory.has(t.category)) {
            byCategory.set(t.category, []);
        }
        byCategory.get(t.category)!.push(t);
    }

    // Take one from each category until we have enough
    const result: TemplateMetadata[] = [];
    const categories = Array.from(byCategory.keys());
    let idx = 0;

    while (result.length < limit && idx < filtered.length) {
        for (const category of categories) {
            const templates = byCategory.get(category)!;
            const catIdx = Math.floor(idx / categories.length);
            if (catIdx < templates.length && result.length < limit) {
                result.push(templates[catIdx]);
            }
        }
        idx += categories.length;
    }

    return result.slice(0, limit);
}

/**
 * Get related templates based on category and tags
 */
export function getRelatedTemplates(
    template: TemplateMetadata,
    limit: number = 4
): TemplateMetadata[] {
    const scored = CURATED_TEMPLATES
        .filter(t => t.id !== template.id)
        .map(t => {
            let score = 0;

            // Same category = high score
            if (t.category === template.category) score += 3;

            // Shared tags
            const sharedTags = t.tags.filter(tag => template.tags.includes(tag));
            score += sharedTags.length * 2;

            // Similar price tier
            if ((t.isPro === template.isPro)) score += 1;

            return { template: t, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    return scored.map(s => s.template);
}
