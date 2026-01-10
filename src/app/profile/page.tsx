"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    User, Crown, Heart, Download, Sparkles, Settings, LogOut,
    ChevronRight, Calendar, Zap, Shield, ExternalLink, Copy,
    Check, Star, Clock
} from "lucide-react";
import { useUser } from "@/lib/useUser";
import { FavoriteButton } from "@/components/FavoriteButton";
import { StarRating } from "@/components/StarRating";
import { CURATED_TEMPLATES } from "@/lib/templates/metadata";
import Link from "next/link";

interface FavoriteTemplate {
    id: string;
    template_id: string;
    created_at: string;
}

interface DownloadRecord {
    id: string;
    template_id: string;
    template_name: string;
    downloaded_at: string;
}

interface AIGeneration {
    id: string;
    prompt: string;
    created_at: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const { user, loading, isAuthenticated, isPro, supabase, canUseAI, planDetails } = useUser();

    const [activeTab, setActiveTab] = useState<"favorites" | "downloads" | "generations">("favorites");
    const [favorites, setFavorites] = useState<FavoriteTemplate[]>([]);
    const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
    const [generations, setGenerations] = useState<AIGeneration[]>([]);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/");
        }
    }, [loading, isAuthenticated, router]);

    useEffect(() => {
        if (user) {
            fetchUserData();
        }
    }, [user, activeTab]);

    const fetchUserData = async () => {
        if (!user) return;

        if (activeTab === "favorites") {
            const { data } = await supabase
                .from("favorites")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });
            setFavorites(data || []);
        } else if (activeTab === "downloads") {
            const { data } = await supabase
                .from("template_downloads")
                .select("*")
                .eq("user_id", user.id)
                .order("downloaded_at", { ascending: false });
            setDownloads(data || []);
        } else if (activeTab === "generations") {
            const { data } = await supabase
                .from("ai_generations")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });
            setGenerations(data || []);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    const copyUserId = () => {
        if (user?.id) {
            navigator.clipboard.writeText(user.id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    // Get favorite template details
    const favoriteTemplates = favorites.map(fav => {
        const template = CURATED_TEMPLATES.find(t => t.id === fav.template_id);
        return { ...fav, template };
    }).filter(f => f.template);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        NotionStruct
                    </Link>

                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Profile Header */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 mb-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-500/25">
                                {user.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt={user.full_name || "User"}
                                        className="w-full h-full rounded-2xl object-cover"
                                    />
                                ) : (
                                    (user.full_name || user.email || "U")[0].toUpperCase()
                                )}
                            </div>
                            {isPro && (
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                    <Crown className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {user.full_name || "Anonymous User"}
                                </h1>
                                {isPro ? (
                                    <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-medium rounded-full">
                                        Pro
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-full">
                                        Free
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 mb-3">{user.email}</p>

                            <div className="flex items-center gap-4 text-sm">
                                <button
                                    onClick={copyUserId}
                                    className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? "Copied!" : "Copy ID"}
                                </button>
                                <span className="text-gray-300 dark:text-gray-700">•</span>
                                <span className="text-gray-400">
                                    Member since {new Date(user.created_at || Date.now()).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3">
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-xl transition-all"
                            >
                                <Settings className="w-4 h-4" />
                                Dashboard
                            </Link>
                            {isPro ? (
                                <Link
                                    href="/subscription"
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium rounded-xl transition-all shadow-lg"
                                >
                                    <Crown className="w-4 h-4" />
                                    Manage Subscription
                                </Link>
                            ) : (
                                <Link
                                    href="/#pricing"
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/25"
                                >
                                    <Zap className="w-4 h-4" />
                                    Upgrade to Pro
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                                <Heart className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Favorites</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{favorites.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                <Download className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Downloads</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{downloads.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">AI Generations</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {user.ai_generations_lifetime}
                                    {!isPro && (
                                        <span className="text-sm font-normal text-gray-400 ml-1">
                                            / {planDetails?.limits.aiGenerations}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    {/* Tab Headers */}
                    <div className="flex border-b border-gray-200 dark:border-gray-800">
                        {[
                            { id: "favorites", label: "Favorites", icon: Heart },
                            { id: "downloads", label: "Downloads", icon: Download },
                            { id: "generations", label: "AI Generations", icon: Sparkles },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`
                  flex items-center gap-2 px-6 py-4 font-medium transition-colors
                  ${activeTab === tab.id
                                        ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 -mb-px"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                    }
                `}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === "favorites" && (
                            <div>
                                {favoriteTemplates.length === 0 ? (
                                    <EmptyState
                                        icon={Heart}
                                        title="No favorites yet"
                                        description="Templates you favorite will appear here for quick access"
                                        actionLabel="Browse Templates"
                                        actionHref="/templates"
                                    />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {favoriteTemplates.map(({ template, created_at }) => (
                                            <Link
                                                key={template!.id}
                                                href={`/templates/${template!.id}`}
                                                className="group p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <span className="text-3xl">{template!.icon}</span>
                                                    <FavoriteButton templateId={template!.id} initialFavorited size="sm" />
                                                </div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
                                                    {template!.name}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                                                    {template!.description}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    Added {new Date(created_at).toLocaleDateString()}
                                                </p>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "downloads" && (
                            <div>
                                {downloads.length === 0 ? (
                                    <EmptyState
                                        icon={Download}
                                        title="No downloads yet"
                                        description="Templates you download will appear here"
                                        actionLabel="Browse Templates"
                                        actionHref="/templates"
                                    />
                                ) : (
                                    <div className="space-y-3">
                                        {downloads.map(download => (
                                            <div
                                                key={download.id}
                                                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                                        <Download className="w-5 h-5 text-green-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 dark:text-white">
                                                            {download.template_name}
                                                        </h4>
                                                        <p className="text-sm text-gray-400 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(download.downloaded_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Link
                                                    href={`/templates/${download.template_id}`}
                                                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                >
                                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "generations" && (
                            <div>
                                {generations.length === 0 ? (
                                    <EmptyState
                                        icon={Sparkles}
                                        title="No AI generations yet"
                                        description="Templates you create with AI will appear here"
                                        actionLabel="Create with AI"
                                        actionHref="/"
                                    />
                                ) : (
                                    <div className="space-y-3">
                                        {generations.map(gen => (
                                            <div
                                                key={gen.id}
                                                className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <Sparkles className="w-5 h-5 text-purple-500" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white line-clamp-2">
                                                                "{gen.prompt}"
                                                            </p>
                                                            <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {new Date(gen.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

// Empty State Component
function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    actionHref
}: {
    icon: any;
    title: string;
    description: string;
    actionLabel: string;
    actionHref: string;
}) {
    return (
        <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{description}</p>
            <Link
                href={actionHref}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
                {actionLabel}
                <ChevronRight className="w-4 h-4" />
            </Link>
        </div>
    );
}
