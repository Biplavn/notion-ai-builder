"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Sparkles, Download, Heart, Star, TrendingUp, Clock, Crown,
    Calendar, Zap, ArrowRight, Eye, MessageSquare, ChevronRight,
    Award, Target, BarChart3
} from "lucide-react";
import { useUser } from "@/lib/useUser";
import Link from "next/link";
import { CURATED_TEMPLATES } from "@/lib/templates/metadata";

interface DashboardStats {
    totalDownloads: number;
    totalFavorites: number;
    totalGenerations: number;
    totalReviews: number;
    creditsRemaining: number | string;
    joinedDays: number;
}

interface RecentActivity {
    type: "download" | "favorite" | "generation" | "review";
    id: string;
    title: string;
    timestamp: string;
    templateId?: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const { user, loading, isAuthenticated, isPro, supabase, canUseAI, planDetails } = useUser();

    const [stats, setStats] = useState<DashboardStats>({
        totalDownloads: 0,
        totalFavorites: 0,
        totalGenerations: 0,
        totalReviews: 0,
        creditsRemaining: 0,
        joinedDays: 0
    });
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/");
        }
    }, [loading, isAuthenticated, router]);

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        if (!user) return;

        setLoadingData(true);

        // Fetch all data in parallel
        const [downloads, favorites, generations, reviews] = await Promise.all([
            supabase.from("template_downloads").select("*").eq("user_id", user.id),
            supabase.from("favorites").select("*").eq("user_id", user.id),
            supabase.from("ai_generations").select("*").eq("user_id", user.id),
            supabase.from("reviews").select("*").eq("user_id", user.id)
        ]);

        // Calculate stats
        const joinedDate = new Date(user.created_at || Date.now());
        const daysSinceJoined = Math.floor((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24));

        const bonusCredits = user.bonus_credits || 0;
        const usedGenerations = user.ai_generations_lifetime || 0;
        let creditsRemaining: number | string = 0;

        if (isPro) {
            creditsRemaining = "Unlimited";
        } else {
            const baseCredits = 5;
            creditsRemaining = Math.max(0, baseCredits - usedGenerations) + bonusCredits;
        }

        setStats({
            totalDownloads: downloads.data?.length || 0,
            totalFavorites: favorites.data?.length || 0,
            totalGenerations: generations.data?.length || 0,
            totalReviews: reviews.data?.length || 0,
            creditsRemaining,
            joinedDays: daysSinceJoined
        });

        // Build recent activity
        const activity: RecentActivity[] = [];

        downloads.data?.slice(0, 5).forEach(d => {
            activity.push({
                type: "download",
                id: d.id,
                title: d.template_name,
                timestamp: d.downloaded_at,
                templateId: d.template_id
            });
        });

        favorites.data?.slice(0, 5).forEach(f => {
            const template = CURATED_TEMPLATES.find(t => t.id === f.template_id);
            if (template) {
                activity.push({
                    type: "favorite",
                    id: f.id,
                    title: template.name,
                    timestamp: f.created_at,
                    templateId: f.template_id
                });
            }
        });

        generations.data?.slice(0, 5).forEach(g => {
            activity.push({
                type: "generation",
                id: g.id,
                title: g.prompt,
                timestamp: g.created_at
            });
        });

        reviews.data?.slice(0, 5).forEach(r => {
            const template = CURATED_TEMPLATES.find(t => t.id === r.template_id);
            activity.push({
                type: "review",
                id: r.id,
                title: template?.name || r.template_id,
                timestamp: r.created_at,
                templateId: r.template_id
            });
        });

        // Sort by timestamp
        activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRecentActivity(activity.slice(0, 10));

        setLoadingData(false);
    };

    if (loading || loadingData) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "download": return Download;
            case "favorite": return Heart;
            case "generation": return Sparkles;
            case "review": return Star;
            default: return Clock;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case "download": return "text-green-500 bg-green-100 dark:bg-green-900/30";
            case "favorite": return "text-red-500 bg-red-100 dark:bg-red-900/30";
            case "generation": return "text-purple-500 bg-purple-100 dark:bg-purple-900/30";
            case "review": return "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30";
            default: return "text-gray-500 bg-gray-100 dark:bg-gray-900/30";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        NotionStruct
                    </Link>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/profile"
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg transition-colors"
                        >
                            Profile
                        </Link>
                        {!isPro && (
                            <Link
                                href="/#pricing"
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all"
                            >
                                <Zap className="w-4 h-4" />
                                Upgrade
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Welcome back, {user.full_name || "there"}! 👋
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Here's what's happening with your NotionStruct account
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Credits */}
                    <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl p-6 text-white">
                        <div className="flex items-center justify-between mb-3">
                            <Sparkles className="w-8 h-8" />
                            {isPro && <Crown className="w-6 h-6 text-yellow-300" />}
                        </div>
                        <p className="text-white/80 text-sm mb-1">AI Credits</p>
                        <p className="text-3xl font-bold">{stats.creditsRemaining}</p>
                        {!isPro && (
                            <Link
                                href="/#pricing"
                                className="mt-3 text-sm text-white/90 hover:text-white flex items-center gap-1"
                            >
                                Get unlimited <ArrowRight className="w-3 h-3" />
                            </Link>
                        )}
                    </div>

                    {/* Downloads */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-3">
                            <Download className="w-6 h-6 text-green-500" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Downloads</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalDownloads}</p>
                    </div>

                    {/* Favorites */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-3">
                            <Heart className="w-6 h-6 text-red-500" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Favorites</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalFavorites}</p>
                    </div>

                    {/* AI Generations */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-3">
                            <Sparkles className="w-6 h-6 text-purple-500" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">AI Created</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalGenerations}</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Recent Activity */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
                                <Link
                                    href="/profile"
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                    View all
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>

                            {recentActivity.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Clock className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 mb-4">No activity yet</p>
                                    <Link
                                        href="/templates"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                                    >
                                        Browse Templates
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentActivity.map(activity => {
                                        const Icon = getActivityIcon(activity.type);
                                        return (
                                            <div
                                                key={activity.id}
                                                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
                                                        {activity.title}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                                                        {activity.type} • {new Date(activity.timestamp).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                {activity.templateId && (
                                                    <Link
                                                        href={`/templates/${activity.templateId}`}
                                                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                    >
                                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                                    </Link>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions & Info */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                            <div className="space-y-2">
                                <Link
                                    href="/"
                                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors group"
                                >
                                    <Sparkles className="w-5 h-5 text-blue-500" />
                                    <span className="text-gray-900 dark:text-white font-medium">Create with AI</span>
                                </Link>
                                <Link
                                    href="/templates"
                                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors group"
                                >
                                    <Eye className="w-5 h-5 text-purple-500" />
                                    <span className="text-gray-900 dark:text-white font-medium">Browse Templates</span>
                                </Link>
                                <Link
                                    href="/subscription"
                                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors group"
                                >
                                    <Crown className="w-5 h-5 text-green-500" />
                                    <span className="text-gray-900 dark:text-white font-medium">Manage Subscription</span>
                                </Link>
                            </div>
                        </div>

                        {/* Account Info */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Account Info</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 dark:text-gray-400 text-sm">Plan</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isPro
                                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                        }`}>
                                        {isPro ? "Pro" : "Free"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 dark:text-gray-400 text-sm">Member since</span>
                                    <span className="text-gray-900 dark:text-white text-sm font-medium">
                                        {stats.joinedDays} days
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 dark:text-gray-400 text-sm">Reviews</span>
                                    <span className="text-gray-900 dark:text-white text-sm font-medium">
                                        {stats.totalReviews}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Upgrade CTA (if free) */}
                        {!isPro && (
                            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white">
                                <Crown className="w-8 h-8 mb-3" />
                                <h3 className="font-bold text-lg mb-2">Upgrade to Pro</h3>
                                <p className="text-white/90 text-sm mb-4">
                                    Get unlimited AI generations and access to all premium templates
                                </p>
                                <Link
                                    href="/#pricing"
                                    className="block text-center px-4 py-2 bg-white text-orange-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    Upgrade Now
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
