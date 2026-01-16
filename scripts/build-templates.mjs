#!/usr/bin/env node
/**
 * Script to build top templates in Notion and output duplicate links
 * Run with: node scripts/build-templates.mjs
 */

import { Client } from "@notionhq/client";

// Configuration
const NOTION_ADMIN_TOKEN = process.env.NOTION_ADMIN_TOKEN || "";
const NOTION_GALLERY_PAGE_ID = process.env.NOTION_GALLERY_PAGE_ID || "";

// Templates that failed in first run - rebuilding with fixed title property
const TOP_TEMPLATES = [
    // Finance (5) - were failing due to "Description" title
    { id: "expense-tracker", name: "Expense Tracker", category: "Finance", icon: "💸" },
    { id: "budget-planner", name: "Budget Planner", category: "Finance", icon: "💰" },
    { id: "subscription-tracker", name: "Subscription Tracker", category: "Finance", icon: "📆" },
    { id: "bill-tracker", name: "Bill Tracker", category: "Finance", icon: "📄" },
    { id: "savings-goals", name: "Savings Goals", category: "Finance", icon: "🏦" },
    // Health (3) - were failing due to "Date" title
    { id: "workout-tracker", name: "Workout Tracker", category: "Health & Fitness", icon: "💪" },
    { id: "meal-planner", name: "Meal Planner", category: "Health & Fitness", icon: "🥗" },
    { id: "sleep-tracker", name: "Sleep Tracker", category: "Health & Fitness", icon: "😴" },
    // Education (2) - were failing due to "Course Name" title
    { id: "student-dashboard", name: "Student Dashboard", category: "Education", icon: "🎓" },
    { id: "course-planner", name: "Course Planner", category: "Education", icon: "📖" },
    // Content (2) - were failing due to "Title" title
    { id: "content-calendar", name: "Content Calendar", category: "Content Creation", icon: "📅" },
    { id: "blog-manager", name: "Blog Manager", category: "Content Creation", icon: "✍️" },
    // Personal (2) - were failing due to "Title" title
    { id: "gratitude-journal", name: "Gratitude Journal", category: "Personal", icon: "🙏" },
    { id: "travel-planner", name: "Travel Planner", category: "Travel", icon: "✈️" },
];

// Blueprint generator based on category - always use "Name" as title for consistency
function generateBlueprint(template) {
    const baseProperties = {
        "Productivity": {
            databases: [
                {
                    key: "main_db",
                    title: `${template.name} Database`,
                    description: `Track your ${template.name.toLowerCase()}`,
                    properties: {
                        "Name": { type: "title" },
                        "Status": { type: "select", options: ["To Do", "In Progress", "Done"] },
                        "Priority": { type: "select", options: ["High", "Medium", "Low"] },
                        "Due Date": { type: "date" },
                        "Tags": { type: "multi_select", options: ["Work", "Personal", "Important"] },
                        "Notes": { type: "rich_text" }
                    }
                }
            ]
        },
        "Finance": {
            databases: [
                {
                    key: "transactions_db",
                    title: "Transactions",
                    description: "Track all income and expenses",
                    properties: {
                        "Name": { type: "title" },
                        "Amount": { type: "number" },
                        "Type": { type: "select", options: ["Income", "Expense"] },
                        "Category": { type: "select", options: ["Food", "Transport", "Utilities", "Entertainment", "Shopping", "Other"] },
                        "Date": { type: "date" },
                        "Notes": { type: "rich_text" }
                    }
                }
            ]
        },
        "Health & Fitness": {
            databases: [
                {
                    key: "logs_db",
                    title: "Health Logs",
                    description: "Track your health metrics daily",
                    properties: {
                        "Name": { type: "title" },
                        "Date": { type: "date" },
                        "Mood": { type: "select", options: ["Great", "Good", "Okay", "Poor"] },
                        "Energy": { type: "select", options: ["High", "Medium", "Low"] },
                        "Sleep Hours": { type: "number" },
                        "Water (glasses)": { type: "number" },
                        "Notes": { type: "rich_text" }
                    }
                }
            ]
        },
        "Business": {
            databases: [
                {
                    key: "clients_db",
                    title: "Clients",
                    description: "Manage your clients and contacts",
                    properties: {
                        "Name": { type: "title" },
                        "Email": { type: "email" },
                        "Phone": { type: "phone_number" },
                        "Status": { type: "select", options: ["Active", "Lead", "Past"] },
                        "Industry": { type: "select", options: ["Tech", "Finance", "Healthcare", "Retail", "Other"] },
                        "Notes": { type: "rich_text" }
                    }
                }
            ]
        },
        "Education": {
            databases: [
                {
                    key: "courses_db",
                    title: "Courses",
                    description: "Track your courses and assignments",
                    properties: {
                        "Name": { type: "title" },
                        "Instructor": { type: "rich_text" },
                        "Status": { type: "select", options: ["In Progress", "Completed", "Upcoming"] },
                        "Grade": { type: "select", options: ["A", "B", "C", "D", "F", "N/A"] },
                        "Deadline": { type: "date" },
                        "Notes": { type: "rich_text" }
                    }
                }
            ]
        },
        "Content Creation": {
            databases: [
                {
                    key: "content_db",
                    title: "Content",
                    description: "Manage your content pipeline",
                    properties: {
                        "Name": { type: "title" },
                        "Platform": { type: "select", options: ["Blog", "YouTube", "Instagram", "Twitter", "LinkedIn"] },
                        "Status": { type: "select", options: ["Idea", "Draft", "Review", "Published"] },
                        "Publish Date": { type: "date" },
                        "Tags": { type: "multi_select", options: ["Tutorial", "Review", "News", "Opinion"] },
                        "Notes": { type: "rich_text" }
                    }
                }
            ]
        },
        "Personal": {
            databases: [
                {
                    key: "entries_db",
                    title: "Journal Entries",
                    description: "Your personal journal",
                    properties: {
                        "Name": { type: "title" },
                        "Date": { type: "date" },
                        "Mood": { type: "select", options: ["Happy", "Grateful", "Calm", "Reflective"] },
                        "Tags": { type: "multi_select", options: ["Gratitude", "Goals", "Memories", "Ideas"] },
                        "Content": { type: "rich_text" }
                    }
                }
            ]
        },
        "Travel": {
            databases: [
                {
                    key: "trips_db",
                    title: "Trips",
                    description: "Plan your trips and adventures",
                    properties: {
                        "Name": { type: "title" },
                        "Start Date": { type: "date" },
                        "End Date": { type: "date" },
                        "Budget": { type: "number" },
                        "Status": { type: "select", options: ["Planning", "Booked", "Completed"] },
                        "Notes": { type: "rich_text" }
                    }
                }
            ]
        }
    };

    const categoryConfig = baseProperties[template.category] || baseProperties["Productivity"];

    return {
        title: template.name,
        description: `A comprehensive ${template.name.toLowerCase()} template to help you stay organized.`,
        icon: template.icon,
        databases: categoryConfig.databases,
        pages: [
            {
                title: `${template.name} Dashboard`,
                icon: template.icon,
                blocks: [
                    { type: "heading_1", content: `Welcome to ${template.name}` },
                    { type: "callout", content: `Use this template to track and manage your ${template.name.toLowerCase()}.`, icon: template.icon },
                    { type: "divider" },
                    { type: "heading_2", content: "Quick Start" },
                    { type: "numbered_list_item", content: "Click on the database below to add your first entry" },
                    { type: "numbered_list_item", content: "Customize the views to suit your workflow" },
                    { type: "numbered_list_item", content: "Use filters and sorts to organize your data" },
                    { type: "divider" },
                    { type: "heading_2", content: "Your Data" },
                    { type: "linked_database", linked_database_source: categoryConfig.databases[0].key }
                ]
            }
        ]
    };
}

// Simplified NotionBuilder class
class NotionBuilder {
    constructor(token) {
        this.notion = new Client({ auth: token });
        this.dbKeyToIdMap = new Map();
    }

    async build(blueprint, parentPageId) {
        console.log(`\n🚀 Building template: ${blueprint.title}`);

        // Create root page
        const rootPage = await this.notion.pages.create({
            parent: { type: "page_id", page_id: parentPageId },
            icon: blueprint.icon ? { emoji: blueprint.icon } : undefined,
            properties: {
                title: { title: [{ text: { content: blueprint.title } }] }
            },
            children: [
                {
                    object: "block",
                    type: "paragraph",
                    paragraph: {
                        rich_text: [{ text: { content: blueprint.description } }]
                    }
                }
            ]
        });
        console.log(`   ✅ Created root page: ${rootPage.id}`);

        // Create databases
        for (const db of blueprint.databases) {
            await this.createDatabase(rootPage.id, db);
        }

        // Create dashboard page
        for (const page of blueprint.pages) {
            await this.createPage(rootPage.id, page);
        }

        return rootPage.id;
    }

    async createDatabase(parentId, db) {
        const properties = {};

        // Process properties
        for (const [name, prop] of Object.entries(db.properties)) {
            if (prop.type === "title") {
                properties[name] = { title: {} };
            } else if (prop.type === "select" || prop.type === "multi_select") {
                properties[name] = {
                    [prop.type]: {
                        options: (prop.options || []).map(opt => ({ name: opt }))
                    }
                };
            } else {
                properties[name] = { [prop.type]: {} };
            }
        }

        const response = await this.notion.databases.create({
            parent: { type: "page_id", page_id: parentId },
            title: [{ type: "text", text: { content: db.title } }],
            description: db.description ? [{ type: "text", text: { content: db.description } }] : [],
            properties: properties
        });

        this.dbKeyToIdMap.set(db.key, response.id);
        console.log(`   ✅ Created database: ${db.title}`);

        // Add instructional placeholder
        await this.createPlaceholder(response.id, db);

        return response;
    }

    async createPlaceholder(dbId, db) {
        // Find the title property - it's the one with type "title"
        let titleProp = null;
        for (const [name, prop] of Object.entries(db.properties)) {
            if (prop.type === "title") {
                titleProp = name;
                break;
            }
        }

        if (!titleProp) {
            console.log(`   ⚠️ No title property found in ${db.title}, skipping placeholder`);
            return;
        }

        await this.notion.pages.create({
            parent: { type: "database_id", database_id: dbId },
            icon: { emoji: "💡" },
            properties: {
                [titleProp]: {
                    title: [{ text: { content: `👉 Click to see how to use ${db.title}` } }]
                }
            },
            children: [
                {
                    object: "block",
                    type: "callout",
                    callout: {
                        rich_text: [{ text: { content: `This is a placeholder to help you get started with ${db.title}.` } }],
                        icon: { emoji: "💡" }
                    }
                },
                {
                    object: "block",
                    type: "heading_2",
                    heading_2: { rich_text: [{ text: { content: "How to use:" } }] }
                },
                {
                    object: "block",
                    type: "numbered_list_item",
                    numbered_list_item: { rich_text: [{ text: { content: "Click '+ New' to add your first entry" } }] }
                },
                {
                    object: "block",
                    type: "numbered_list_item",
                    numbered_list_item: { rich_text: [{ text: { content: "Fill in the properties with your data" } }] }
                },
                {
                    object: "block",
                    type: "numbered_list_item",
                    numbered_list_item: { rich_text: [{ text: { content: "Delete this placeholder when ready" } }] }
                }
            ]
        });
        console.log(`   ✅ Added placeholder to ${db.title}`);
    }

    async createPage(parentId, page) {
        const children = page.blocks.map(block => {
            const blockType = block.type.toLowerCase();

            if (blockType === "linked_database") {
                const sourceId = this.dbKeyToIdMap.get(block.linked_database_source);
                if (sourceId) {
                    return {
                        object: "block",
                        type: "link_to_page",
                        link_to_page: { type: "database_id", database_id: sourceId }
                    };
                }
                return {
                    object: "block",
                    type: "paragraph",
                    paragraph: { rich_text: [{ text: { content: "[Database link]" } }] }
                };
            }

            if (blockType === "divider") {
                return { object: "block", type: "divider", divider: {} };
            }

            const baseBlock = {
                object: "block",
                type: blockType,
                [blockType]: {
                    rich_text: block.content ? [{ type: "text", text: { content: block.content } }] : []
                }
            };

            if (blockType === "callout") {
                baseBlock.callout.icon = { emoji: block.icon || "💡" };
            }

            return baseBlock;
        });

        await this.notion.pages.create({
            parent: { type: "page_id", page_id: parentId },
            icon: page.icon ? { emoji: page.icon } : undefined,
            properties: {
                title: { title: [{ text: { content: page.title } }] }
            },
            children: children
        });
        console.log(`   ✅ Created page: ${page.title}`);
    }
}

// Main execution
async function main() {
    console.log("🏗️  Notion Template Builder");
    console.log("===========================\n");

    const builder = new NotionBuilder(NOTION_ADMIN_TOKEN);
    const results = [];

    for (let i = 0; i < TOP_TEMPLATES.length; i++) {
        const template = TOP_TEMPLATES[i];
        console.log(`\n[${i + 1}/${TOP_TEMPLATES.length}] Building: ${template.name}`);

        try {
            const blueprint = generateBlueprint(template);
            const pageId = await builder.build(blueprint, NOTION_GALLERY_PAGE_ID);
            const duplicateLink = `https://www.notion.so/${pageId.replace(/-/g, "")}?duplicate=true`;

            results.push({
                id: template.id,
                name: template.name,
                success: true,
                pageId,
                duplicateLink
            });

            console.log(`   🔗 Duplicate link: ${duplicateLink}`);

            // Rate limiting delay
            await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (error) {
            console.error(`   ❌ Failed: ${error.message}`);
            results.push({
                id: template.id,
                name: template.name,
                success: false,
                error: error.message
            });
        }
    }

    // Summary
    console.log("\n\n📊 BUILD SUMMARY");
    console.log("================");
    console.log(`Total: ${results.length}`);
    console.log(`Success: ${results.filter(r => r.success).length}`);
    console.log(`Failed: ${results.filter(r => !r.success).length}`);

    // Output for metadata.ts update
    console.log("\n\n📝 DUPLICATE LINKS FOR metadata.ts:");
    console.log("=====================================");
    results.filter(r => r.success).forEach(r => {
        console.log(`"${r.id}": "${r.duplicateLink}",`);
    });

    // JSON output for easy parsing
    console.log("\n\n📦 JSON OUTPUT:");
    console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
