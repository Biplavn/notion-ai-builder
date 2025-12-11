"use client";

import { useState, useEffect } from "react";
import { Search, Sparkles, Download, Star, ArrowRight } from "lucide-react";
import Link from "next/link";
import { CURATED_TEMPLATES, TEMPLATE_CATEGORIES, TemplateMetadata } from "@/lib/templates/metadata";
import { TemplateMockup } from "@/components/TemplateMockup";

export default function TemplatesPage() {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredTemplates = CURATED_TEMPLATES.filter(template => {
        const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
        const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

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
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Education
                        </Link>
                        <Link
                            href="/templates"
                            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                        >
                            Browse Templates
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="border-b border-border bg-gradient-to-b from-muted/30 to-background pt-20">
                <div className="max-w-7xl mx-auto px-6 py-16">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium border border-accent/20">
                            <Sparkles className="w-4 h-4" />
                            <span>Template Marketplace</span>
                        </div>
                        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
                            Ready-to-Use <span className="text-accent">Notion Templates</span>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Professional templates crafted for productivity. One-click install, fully customizable.
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="mt-8 max-w-2xl mx-auto">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search templates..."
                                className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-lg"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Filter */}
            <div className="border-b border-border bg-background sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {TEMPLATE_CATEGORIES.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${selectedCategory === category
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Templates Grid */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                {filteredTemplates.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground text-lg">No templates found. Try a different search or category.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTemplates.map((template) => (
                            <TemplateCard key={template.id} template={template} />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer CTA */}
            <div className="border-t border-border bg-muted/30 mt-16">
                <div className="max-w-7xl mx-auto px-6 py-12 text-center">
                    <h2 className="text-2xl font-bold mb-4">Can't find what you need?</h2>
                    <p className="text-muted-foreground mb-6">Use our AI to create a custom template from scratch</p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                        Create Custom Template <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-border py-8">
                <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                    <p>Powered by OpenAI & Notion API</p>
                    <p>
                        Built by{" "}
                        <a
                            href="https://www.bartlabs.in"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-primary transition-colors"
                        >
                            Bartlabs
                        </a>
                    </p>
                </div>
            </footer>
        </div>
    );
}

function TemplateCard({ template }: { template: TemplateMetadata }) {
    const [imageError, setImageError] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Generate a more subtle gradient based on template category
    const getCategoryGradient = (category: string) => {
        const gradients: Record<string, string> = {
            "Productivity": "from-blue-50 via-indigo-50 to-purple-50",
            "Finance": "from-emerald-50 via-green-50 to-teal-50",
            "Health & Fitness": "from-pink-50 via-rose-50 to-red-50",
            "Content Creation": "from-orange-50 via-amber-50 to-yellow-50",
            "Business": "from-indigo-50 via-blue-50 to-cyan-50",
            "Personal": "from-purple-50 via-fuchsia-50 to-pink-50",
            "Education": "from-cyan-50 via-sky-50 to-blue-50",
            "Travel": "from-teal-50 via-emerald-50 to-green-50"
        };
        return gradients[category] || "from-gray-50 via-slate-50 to-zinc-50";
    };

    const getCategoryAccent = (category: string) => {
        const accents: Record<string, string> = {
            "Productivity": "text-blue-600",
            "Finance": "text-emerald-600",
            "Health & Fitness": "text-pink-600",
            "Content Creation": "text-orange-600",
            "Business": "text-indigo-600",
            "Personal": "text-purple-600",
            "Education": "text-cyan-600",
            "Travel": "text-teal-600"
        };
        return accents[category] || "text-gray-600";
    };

    return (
        <Link href={`/templates/${template.id}`}>
            <div className="group h-full flex flex-col rounded-2xl border-2 border-border bg-card hover:border-accent/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
                {/* Preview Image */}
                <div className="relative h-52 overflow-hidden">
                    {mounted && template.previewImage && !imageError ? (
                        <img
                            src={template.previewImage}
                            alt={template.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <TemplateMockup templateId={template.id} category={template.category} />
                    )}

                    {/* Category Badge */}
                    <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-xs font-semibold border border-gray-200 shadow-sm">
                        {template.category}
                    </div>

                    {/* Pro/Free Badge */}
                    <div className="absolute top-4 right-4">
                        {template.isPro ? (
                            <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg">
                                PRO
                            </span>
                        ) : (
                            <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                                FREE
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col bg-white">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors line-clamp-1">
                        {template.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1 leading-relaxed">
                        {template.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {template.tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700 font-medium"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Download className="w-3.5 h-3.5" />
                                <span className="font-medium">{template.downloads.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span className="font-medium">{template.rating}</span>
                            </div>
                        </div>
                        {template.price > 0 ? (
                            <span className="text-base font-bold text-gray-900">${template.price}</span>
                        ) : (
                            <span className="text-base font-bold text-green-600">Free</span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
