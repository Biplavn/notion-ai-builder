/**
 * Pre-load Cache with Curated Templates
 *
 * This module pre-populates the blueprint cache with prompts that match
 * our curated templates, so users requesting similar templates get
 * instant results without API calls.
 */

import { CURATED_TEMPLATES } from "@/lib/templates/metadata";

// Map template IDs to sample prompts that should match them
export const TEMPLATE_PROMPTS: Record<string, string[]> = {
    // Productivity
    "habit-tracker": [
        "habit tracker",
        "track my daily habits",
        "habit tracking system",
        "build habits",
        "routine tracker"
    ],
    "project-tracker": [
        "project tracker",
        "project management",
        "manage my projects",
        "task and project tracker",
        "project management system"
    ],
    "goal-tracker": [
        "goal tracker",
        "track my goals",
        "goal setting system",
        "goals and milestones",
        "okr tracker"
    ],
    "daily-planner": [
        "daily planner",
        "plan my day",
        "daily schedule",
        "time blocking",
        "day planner"
    ],
    "meeting-notes": [
        "meeting notes",
        "meeting tracker",
        "track meetings",
        "meeting agenda",
        "meeting management"
    ],

    // Finance
    "budget-tracker": [
        "budget tracker",
        "track my budget",
        "expense tracker",
        "money management",
        "personal finance"
    ],
    "expense-tracker": [
        "expense tracker",
        "track expenses",
        "spending tracker",
        "expense management"
    ],
    "investment-tracker": [
        "investment tracker",
        "track investments",
        "portfolio tracker",
        "stock tracker"
    ],

    // Health & Fitness
    "workout-tracker": [
        "workout tracker",
        "gym tracker",
        "exercise log",
        "fitness tracker",
        "workout planner"
    ],
    "meal-planner": [
        "meal planner",
        "meal prep",
        "recipe tracker",
        "food planner",
        "nutrition tracker"
    ],
    "weight-tracker": [
        "weight tracker",
        "weight loss tracker",
        "fitness goals",
        "body measurements"
    ],

    // Content Creation
    "content-calendar": [
        "content calendar",
        "content planner",
        "social media calendar",
        "editorial calendar",
        "content schedule"
    ],
    "blog-manager": [
        "blog manager",
        "blog tracker",
        "article tracker",
        "blog post planner"
    ],

    // Business
    "crm": [
        "crm",
        "customer tracker",
        "client management",
        "sales tracker",
        "lead tracker"
    ],
    "inventory-tracker": [
        "inventory tracker",
        "stock management",
        "product inventory",
        "warehouse tracker"
    ],

    // Education
    "study-planner": [
        "study planner",
        "study tracker",
        "course tracker",
        "learning tracker",
        "class schedule"
    ],
    "book-tracker": [
        "book tracker",
        "reading list",
        "book log",
        "reading tracker"
    ],

    // Travel
    "travel-planner": [
        "travel planner",
        "trip planner",
        "vacation planner",
        "itinerary tracker"
    ],

    // Personal
    "journal": [
        "journal",
        "daily journal",
        "gratitude journal",
        "diary",
        "reflection journal"
    ]
};

/**
 * Get keywords from template metadata
 */
export function getTemplateKeywords(templateId: string): string[] {
    const template = CURATED_TEMPLATES.find(t => t.id === templateId);
    if (!template) return [];

    const keywords: Set<string> = new Set();

    // Add from tags
    template.tags.forEach(tag => keywords.add(tag.toLowerCase()));

    // Add from name (split by spaces, remove emoji)
    template.name
        .replace(/[^\w\s]/g, "")
        .toLowerCase()
        .split(" ")
        .filter(w => w.length > 2)
        .forEach(w => keywords.add(w));

    // Add from category
    keywords.add(template.category.toLowerCase());

    return Array.from(keywords);
}

/**
 * Generate a sample blueprint for a curated template
 * This is a simplified version - in production you'd have full blueprints
 */
export function generateSampleBlueprint(templateId: string) {
    const template = CURATED_TEMPLATES.find(t => t.id === templateId);
    if (!template) return null;

    return {
        title: template.name,
        description: template.description,
        databases: [
            {
                key: `${templateId}_main`,
                title: template.name.replace(/[^\w\s]/g, "").trim(),
                properties: {
                    Name: { type: "title" },
                    Status: { type: "select", options: ["Not Started", "In Progress", "Done"] },
                    Date: { type: "date" },
                    Notes: { type: "rich_text" }
                }
            }
        ],
        pages: [
            {
                title: `📊 ${template.name} Dashboard`,
                icon: template.icon,
                blocks: [
                    { type: "heading_1", content: `Welcome to ${template.name}` },
                    { type: "callout", content: template.description, icon: "💡" },
                    {
                        type: "linked_database",
                        linked_database_source: `${templateId}_main`,
                        linked_database_view: { layout: "table" }
                    }
                ]
            }
        ]
    };
}

/**
 * Get all prompts that should be pre-cached
 */
export function getAllCacheablePrompts(): Array<{
    templateId: string;
    prompt: string;
    keywords: string[];
}> {
    const results: Array<{
        templateId: string;
        prompt: string;
        keywords: string[];
    }> = [];

    for (const [templateId, prompts] of Object.entries(TEMPLATE_PROMPTS)) {
        const keywords = getTemplateKeywords(templateId);
        for (const prompt of prompts) {
            results.push({ templateId, prompt, keywords });
        }
    }

    return results;
}
