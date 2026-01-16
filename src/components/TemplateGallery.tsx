import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Download, Star, Heart, Lightbulb, Sparkles } from "lucide-react";
import { CURATED_TEMPLATES, TEMPLATE_CATEGORIES, TemplateMetadata } from "@/lib/templates/metadata";
import { TemplateMockup } from "@/components/TemplateMockup";
import { FavoriteButton } from "@/components/FavoriteButton";
import { smartSearch, getPopularTemplates } from "@/lib/templates/smartSearch";

interface TemplateGalleryProps {
    searchQuery: string;
    className?: string;
}

export function TemplateGallery({ searchQuery, className = "" }: TemplateGalleryProps) {
    const [selectedCategory, setSelectedCategory] = useState("All");

    // Use smart search for better matching
    const searchResult = useMemo(() => {
        return smartSearch(searchQuery, selectedCategory);
    }, [searchQuery, selectedCategory]);

    const { exactMatches, similarSuggestions, hasExactMatches } = searchResult;

    // Get popular templates as fallback when no matches at all
    const popularFallback = useMemo(() => {
        if (!searchQuery || exactMatches.length > 0 || similarSuggestions.length > 0) {
            return [];
        }
        return getPopularTemplates(6);
    }, [searchQuery, exactMatches.length, similarSuggestions.length]);

    return (
        <div className={`w-full ${className}`}>
            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
                {TEMPLATE_CATEGORIES.map((category) => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border ${selectedCategory === category
                            ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                            : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground hover:bg-muted/50"
                            }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Main Results */}
            {hasExactMatches ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exactMatches.map((result) => (
                        <TemplateCard key={result.template.id} template={result.template} />
                    ))}
                </div>
            ) : searchQuery ? (
                <div className="space-y-8">
                    {/* No Exact Match Message */}
                    <div className="text-center py-8 border-2 border-dashed border-border rounded-xl bg-muted/30">
                        <p className="text-muted-foreground text-lg">No exact templates found for "{searchQuery}".</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Click <span className="font-semibold text-accent">"Design New"</span> above to build it with AI!
                        </p>
                    </div>

                    {/* Similar Suggestions */}
                    {similarSuggestions.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                                <Lightbulb className="w-5 h-5 text-amber-500" />
                                <span>Similar templates you might like</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {similarSuggestions.map((result) => (
                                    <TemplateCard
                                        key={result.template.id}
                                        template={result.template}
                                        showSimilarityBadge
                                        similarity={result.similarity}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Popular Fallback */}
                    {popularFallback.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                                <Sparkles className="w-5 h-5 text-purple-500" />
                                <span>Popular templates to explore</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {popularFallback.map((template) => (
                                    <TemplateCard key={template.id} template={template} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exactMatches.map((result) => (
                        <TemplateCard key={result.template.id} template={result.template} />
                    ))}
                </div>
            )}
        </div>
    );
}

interface TemplateCardProps {
    template: TemplateMetadata;
    showSimilarityBadge?: boolean;
    similarity?: number;
}

function TemplateCard({ template, showSimilarityBadge, similarity }: TemplateCardProps) {
    const [imageError, setImageError] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <Link href={`/templates/${template.id}`}>
            <div className="group h-full flex flex-col rounded-2xl border-2 border-border bg-card hover:border-accent/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden text-left">
                {/* Preview Image */}
                <div className="relative h-48 overflow-hidden">
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
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-[10px] font-bold border border-gray-200 shadow-sm uppercase tracking-wide text-gray-600">
                        {template.category}
                    </div>

                    {/* Favorite & Pro/Free Badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                        <div className="bg-white/95 backdrop-blur-md rounded-full shadow-sm border border-gray-200">
                            <FavoriteButton templateId={template.id} size="sm" />
                        </div>
                        {template.isPro ? (
                            <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg uppercase tracking-wide">
                                PRO
                            </span>
                        ) : (
                            <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg uppercase tracking-wide">
                                FREE
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col bg-white">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-lg font-bold group-hover:text-accent transition-colors line-clamp-1 text-gray-900">
                            {template.name}
                        </h3>
                        {showSimilarityBadge && similarity && (
                            <span className="shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                {Math.round(similarity * 100)}% match
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2 flex-1 leading-relaxed">
                        {template.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {template.tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className="px-2 py-0.5 text-[10px] rounded-md bg-gray-100 text-gray-600 font-medium border border-gray-200"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                                <Download className="w-3 h-3" />
                                <span className="font-medium">{template.downloads.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="font-medium">{template.rating}</span>
                            </div>
                        </div>
                        {template.price > 0 ? (
                            <span className="text-sm font-bold text-gray-900">${template.price}</span>
                        ) : (
                            <span className="text-sm font-bold text-green-600">Free</span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
