"use client";

import Link from "next/link";
import { BookOpen, Sparkles, Zap, CheckCircle, ArrowRight, Play, Database, Layout, Share2, Lightbulb } from "lucide-react";
import { useState } from "react";

export default function EducationPage() {
    const [activeTab, setActiveTab] = useState<"platform" | "notion">("platform");

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Navigation Header */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="text-xl font-bold">
                        NotionStruct
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/education"
                            className="text-foreground font-medium transition-colors"
                        >
                            Education
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-6 pt-32 pb-20">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium border border-accent/20 mb-4">
                        <Lightbulb className="w-4 h-4" />
                        <span>Learning Center</span>
                    </div>
                    <h1 className="text-5xl font-bold mb-4">Get Started in <span className="text-accent">3 Minutes</span></h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Learn how to use our AI-powered platform and master Notion fundamentals
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-4 mb-12 border-b border-border">
                    <button
                        onClick={() => setActiveTab("platform")}
                        className={`px-6 py-3 font-semibold transition-colors relative ${activeTab === "platform"
                            ? "text-accent"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <Sparkles className="w-5 h-5 inline mr-2" />
                        Using Our Platform
                        {activeTab === "platform" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("notion")}
                        className={`px-6 py-3 font-semibold transition-colors relative ${activeTab === "notion"
                            ? "text-accent"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <BookOpen className="w-5 h-5 inline mr-2" />
                        Notion Basics
                        {activeTab === "notion" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"></div>
                        )}
                    </button>
                </div>

                {/* Platform Guide */}
                {activeTab === "platform" && (
                    <div className="space-y-8">
                        <div className="bg-gradient-to-br from-accent/5 to-purple-500/5 rounded-2xl p-8 border border-accent/20">
                            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                                <Zap className="w-8 h-8 text-accent" />
                                How to Create Your Perfect Template
                            </h2>
                            <p className="text-muted-foreground mb-8 text-lg">
                                Our AI architect transforms your ideas into fully-functional Notion workspaces in seconds.
                            </p>

                            <div className="grid gap-6">
                                <Step
                                    number={1}
                                    title="Describe What You Need"
                                    description="Type a simple description of your workspace. Be specific about databases, properties, and relationships."
                                    example='Example: "CRM for freelancers with Clients, Projects, and Invoices databases"'
                                    icon={<Play className="w-6 h-6" />}
                                />
                                <Step
                                    number={2}
                                    title="Review the Blueprint"
                                    description="Our AI generates a complete blueprint showing all databases, properties, and pages. You can edit anything before building."
                                    tips={[
                                        "Check database names and properties",
                                        "Verify relations between databases",
                                        "Customize property types if needed"
                                    ]}
                                    icon={<CheckCircle className="w-6 h-6" />}
                                />
                                <Step
                                    number={3}
                                    title="Build in Notion"
                                    description="Click 'Confirm & Build' and we'll create everything directly in your Notion workspace in 30 seconds."
                                    tips={[
                                        "Make sure you've connected your Notion account",
                                        "The template will appear in your workspace",
                                        "Each database includes helpful placeholder entries"
                                    ]}
                                    icon={<Sparkles className="w-6 h-6" />}
                                />
                                <Step
                                    number={4}
                                    title="Customize & Use"
                                    description="Your template is ready! Delete the placeholder entries and start adding your real data."
                                    tips={[
                                        "Customize colors, icons, and covers",
                                        "Add more properties as needed",
                                        "Share with your team or keep it private"
                                    ]}
                                    icon={<ArrowRight className="w-6 h-6" />}
                                />
                            </div>
                        </div>

                        {/* Pro Tips */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <ProTip
                                title="Be Specific"
                                description="The more details you provide, the better your template. Mention property types (select, date, number) and relationships."
                                icon="💡"
                            />
                            <ProTip
                                title="Use Examples"
                                description='Include sample data in your prompt: "Status property with options: Not Started, In Progress, Done"'
                                icon="📝"
                            />
                            <ProTip
                                title="Start Simple"
                                description="Begin with 2-3 databases. You can always add more complexity later in Notion."
                                icon="🎯"
                            />
                            <ProTip
                                title="Browse First"
                                description="Check our template marketplace - we might already have what you need!"
                                icon="🔍"
                            />
                        </div>

                        {/* CTA */}
                        <div className="text-center p-8 rounded-2xl bg-muted/30 border border-border">
                            <h3 className="text-2xl font-bold mb-4">Ready to Build?</h3>
                            <p className="text-muted-foreground mb-6">Create your first AI-generated template now</p>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                            >
                                Go to Builder <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Notion Basics */}
                {activeTab === "notion" && (
                    <div className="space-y-8">
                        <Section
                            icon={<Database className="w-6 h-6 text-blue-500" />}
                            title="Databases 101"
                            description="Databases are the foundation of Notion. Think of them as smart spreadsheets."
                        >
                            <ul className="space-y-3 text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-foreground">Properties:</span> Columns that define your data (e.g., Date, Status, Tags, Number).
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-foreground">Views:</span> Different ways to visualize the same data (Table, Board, Calendar, Gallery, Timeline).
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-foreground">Relations:</span> Connect two databases together (e.g., Projects ↔ Tasks, Clients ↔ Invoices).
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-foreground">Rollups:</span> Pull data from related databases (e.g., count tasks per project, sum invoice amounts).
                                </li>
                            </ul>
                        </Section>

                        <Section
                            icon={<Layout className="w-6 h-6 text-purple-500" />}
                            title="Pages & Blocks"
                            description="Everything in Notion is a block. Pages are just containers for blocks."
                        >
                            <ul className="space-y-3 text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-foreground">Blocks:</span> Text, images, to-do lists, headings, callouts, and even databases are all blocks.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-foreground">Drag & Drop:</span> Move any block anywhere. Use columns to organize content side-by-side.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-foreground">Slash Command:</span> Type <code className="bg-muted px-1 rounded">/</code> to create any block type.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-foreground">Nested Pages:</span> Pages can contain other pages, creating a hierarchy.
                                </li>
                            </ul>
                        </Section>

                        <Section
                            icon={<Share2 className="w-6 h-6 text-green-500" />}
                            title="Using Templates"
                            description="How to work with templates from our marketplace or AI builder."
                        >
                            <ul className="space-y-3 text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-foreground">Auto-Created:</span> Templates built by our AI appear directly in your Notion workspace.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-foreground">Placeholder Entries:</span> Each database includes a "👉 Click to see how to use" entry with instructions.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-foreground">Customize:</span> Change icons, covers, colors, and add/remove properties as needed.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-foreground">Share:</span> Invite team members or create public links to share your workspace.
                                </li>
                            </ul>
                        </Section>

                        {/* Quick Reference */}
                        <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200">
                            <h3 className="text-2xl font-bold mb-6">Quick Reference: Property Types</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <PropertyType name="Title" description="Main identifier for each entry (required)" />
                                <PropertyType name="Text" description="Multi-line text content" />
                                <PropertyType name="Number" description="Numeric values (can be formatted as currency, percentage)" />
                                <PropertyType name="Select" description="Single choice from predefined options" />
                                <PropertyType name="Multi-select" description="Multiple choices from predefined options" />
                                <PropertyType name="Date" description="Single date or date range" />
                                <PropertyType name="Checkbox" description="True/false toggle" />
                                <PropertyType name="URL" description="Web links" />
                                <PropertyType name="Email" description="Email addresses" />
                                <PropertyType name="Phone" description="Phone numbers" />
                                <PropertyType name="Relation" description="Link to another database" />
                                <PropertyType name="Rollup" description="Aggregate data from relations" />
                            </div>
                        </div>

                        {/* External Resources */}
                        <div className="p-8 rounded-2xl bg-muted/30 border border-border">
                            <h3 className="text-2xl font-bold mb-4">Want to Learn More?</h3>
                            <p className="text-muted-foreground mb-6">
                                Check out these official Notion resources for deeper learning:
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <a
                                    href="https://www.notion.so/help/guides"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 rounded-lg bg-background border border-border hover:border-accent transition-colors"
                                >
                                    Notion Help Center →
                                </a>
                                <a
                                    href="https://www.youtube.com/@notion"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 rounded-lg bg-background border border-border hover:border-accent transition-colors"
                                >
                                    Notion YouTube →
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function Step({ number, title, description, example, tips, icon }: {
    number: number;
    title: string;
    description: string;
    example?: string;
    tips?: string[];
    icon: React.ReactNode;
}) {
    return (
        <div className="flex gap-6 p-6 rounded-xl bg-background border border-border hover:border-accent/50 transition-colors">
            <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-xl border-2 border-accent/20">
                    {number}
                </div>
            </div>
            <div className="flex-1">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    {icon}
                    {title}
                </h3>
                <p className="text-muted-foreground mb-3">{description}</p>
                {example && (
                    <div className="p-3 rounded-lg bg-muted/50 border border-border mb-3">
                        <p className="text-sm font-mono text-foreground">{example}</p>
                    </div>
                )}
                {tips && (
                    <ul className="space-y-1">
                        {tips.map((tip, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                {tip}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function ProTip({ title, description, icon }: { title: string; description: string; icon: string }) {
    return (
        <div className="p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">{icon}</div>
            <h4 className="font-bold text-lg mb-2">{title}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    );
}

function Section({ icon, title, description, children }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div className="p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-xl bg-muted">{icon}</div>
                <div>
                    <h2 className="text-2xl font-bold mb-2">{title}</h2>
                    <p className="text-muted-foreground">{description}</p>
                </div>
            </div>
            <div className="pl-0 sm:pl-16">
                {children}
            </div>
        </div>
    );
}

function PropertyType({ name, description }: { name: string; description: string }) {
    return (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-white/50">
            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
                <div className="font-semibold text-gray-900">{name}</div>
                <div className="text-sm text-gray-600">{description}</div>
            </div>
        </div>
    );
}
