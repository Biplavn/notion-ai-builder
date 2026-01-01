"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Users, LayoutTemplate, MessageSquare, BarChart3, Settings,
    Search, ChevronDown, MoreHorizontal, Crown, Ban, Gift,
    Plus, Minus, Check, X, ChevronLeft, ChevronRight, RefreshCw,
    Sparkles, Download, Star, DollarSign, TrendingUp, Shield, Eye, EyeOff, Trash2
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/config/env";
import Link from "next/link";

const ADMIN_EMAIL = "biplavsoccer007@gmail.com";

// Types
interface UserRecord {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    subscription_plan: string;
    subscription_status: string;
    is_suspended: boolean;
    is_admin: boolean;
    ai_generations_lifetime: number;
    bonus_credits: number;
    created_at: string;
}

interface ReviewRecord {
    id: string;
    user_id: string;
    user_name: string;
    template_id: string;
    rating: number;
    review_text: string;
    created_at: string;
}

interface TemplateOverride {
    template_id: string;
    is_pro: boolean | null;
    price: number | null;
    is_featured: boolean;
    is_hidden: boolean;
}

type TabType = "users" | "templates" | "reviews" | "analytics";

export default function AdminPage() {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>("users");

    const supabase = createBrowserClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
            router.push("/");
            return;
        }

        setIsAuthorized(true);
        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthorized) return null;

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 bottom-0 w-64 bg-gray-900 border-r border-gray-800 p-4">
                <Link href="/" className="flex items-center gap-3 mb-8 px-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-white">Admin Panel</h1>
                        <p className="text-xs text-gray-500">NotionStruct</p>
                    </div>
                </Link>

                <nav className="space-y-1">
                    {[
                        { id: "users", label: "Users", icon: Users },
                        { id: "templates", label: "Templates", icon: LayoutTemplate },
                        { id: "reviews", label: "Reviews", icon: MessageSquare },
                        { id: "analytics", label: "Analytics", icon: BarChart3 },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as TabType)}
                            className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors
                ${activeTab === item.id
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                                }
              `}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="absolute bottom-4 left-4 right-4">
                    <div className="p-3 bg-gray-800 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Logged in as</p>
                        <p className="text-sm font-medium text-white truncate">{ADMIN_EMAIL}</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 p-8">
                {activeTab === "users" && <UsersTab supabase={supabase} />}
                {activeTab === "templates" && <TemplatesTab supabase={supabase} />}
                {activeTab === "reviews" && <ReviewsTab supabase={supabase} />}
                {activeTab === "analytics" && <AnalyticsTab supabase={supabase} />}
            </main>
        </div>
    );
}

// ============================================
// USERS TAB
// ============================================
function UsersTab({ supabase }: { supabase: any }) {
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error && data) {
            setUsers(data);
        }
        setLoading(false);
    };

    const updateUser = async (userId: string, updates: Partial<UserRecord>) => {
        setActionLoading(userId);

        const response = await fetch("/api/admin/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, updates })
        });

        if (response.ok) {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
        }

        setActionLoading(null);
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Users</h1>
                    <p className="text-gray-400">{users.length} total users</p>
                </div>
                <button
                    onClick={fetchUsers}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search users..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-800">
                            <th className="text-left p-4 text-sm font-medium text-gray-400">User</th>
                            <th className="text-left p-4 text-sm font-medium text-gray-400">Plan</th>
                            <th className="text-left p-4 text-sm font-medium text-gray-400">AI Credits</th>
                            <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
                            <th className="text-left p-4 text-sm font-medium text-gray-400">Joined</th>
                            <th className="text-right p-4 text-sm font-medium text-gray-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500">
                                    Loading users...
                                </td>
                            </tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500">
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr
                                    key={user.id}
                                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                                                {user.avatar_url ? (
                                                    <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    (user.full_name || user.email || "U")[0].toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-white">{user.full_name || "Anonymous"}</span>
                                                    {user.is_admin && (
                                                        <Shield className="w-4 h-4 text-blue-400" />
                                                    )}
                                                </div>
                                                <span className="text-sm text-gray-400">{user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${user.subscription_plan === "pro"
                                                ? "bg-yellow-500/20 text-yellow-400"
                                                : "bg-gray-700 text-gray-300"
                                            }`}>
                                            {user.subscription_plan === "pro" ? "Pro" : "Free"}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white">{user.ai_generations_lifetime}</span>
                                            {user.bonus_credits > 0 && (
                                                <span className="text-xs text-green-400">(+{user.bonus_credits} bonus)</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {user.is_suspended ? (
                                            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                                                Suspended
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                                                Active
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm text-gray-400">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Toggle Pro */}
                                            <button
                                                onClick={() => updateUser(user.id, {
                                                    subscription_plan: user.subscription_plan === "pro" ? "free" : "pro",
                                                    subscription_status: "active"
                                                })}
                                                disabled={actionLoading === user.id}
                                                className={`p-2 rounded-lg transition-colors ${user.subscription_plan === "pro"
                                                        ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                                                        : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                                                    }`}
                                                title={user.subscription_plan === "pro" ? "Remove Pro" : "Make Pro"}
                                            >
                                                <Crown className="w-4 h-4" />
                                            </button>

                                            {/* Add Credits */}
                                            <button
                                                onClick={() => updateUser(user.id, {
                                                    bonus_credits: (user.bonus_credits || 0) + 5
                                                })}
                                                disabled={actionLoading === user.id}
                                                className="p-2 bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-green-400 rounded-lg transition-colors"
                                                title="Add 5 Credits"
                                            >
                                                <Gift className="w-4 h-4" />
                                            </button>

                                            {/* Toggle Suspend */}
                                            <button
                                                onClick={() => updateUser(user.id, { is_suspended: !user.is_suspended })}
                                                disabled={actionLoading === user.id || user.email === ADMIN_EMAIL}
                                                className={`p-2 rounded-lg transition-colors ${user.is_suspended
                                                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                                        : "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-red-400"
                                                    } ${user.email === ADMIN_EMAIL ? "opacity-50 cursor-not-allowed" : ""}`}
                                                title={user.is_suspended ? "Unsuspend" : "Suspend"}
                                            >
                                                <Ban className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ============================================
// TEMPLATES TAB
// ============================================
function TemplatesTab({ supabase }: { supabase: any }) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [overrides, setOverrides] = useState<Record<string, TemplateOverride>>({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);

        // Fetch template metadata dynamically
        const response = await fetch("/api/admin/templates");
        if (response.ok) {
            const data = await response.json();
            setTemplates(data.templates || []);
            setOverrides(data.overrides || {});
        }

        setLoading(false);
    };

    const updateTemplate = async (templateId: string, updates: Partial<TemplateOverride>) => {
        const response = await fetch("/api/admin/templates", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ templateId, updates })
        });

        if (response.ok) {
            setOverrides(prev => ({
                ...prev,
                [templateId]: { ...prev[templateId], ...updates, template_id: templateId }
            }));
        }
    };

    const filteredTemplates = templates.filter(t =>
        t.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.category?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Templates</h1>
                    <p className="text-gray-400">{templates.length} total templates</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search templates..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-3 p-8 text-center text-gray-500">
                        Loading templates...
                    </div>
                ) : (
                    filteredTemplates.map(template => {
                        const override = overrides[template.id] || {};
                        const isPro = override.is_pro ?? template.isPro;
                        const isHidden = override.is_hidden ?? false;
                        const isFeatured = override.is_featured ?? false;

                        return (
                            <div
                                key={template.id}
                                className={`p-4 bg-gray-900 border border-gray-800 rounded-xl ${isHidden ? "opacity-50" : ""
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{template.icon}</span>
                                        <div>
                                            <h3 className="font-semibold text-white">{template.name}</h3>
                                            <p className="text-xs text-gray-400">{template.category}</p>
                                        </div>
                                    </div>
                                    {isFeatured && (
                                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                    )}
                                </div>

                                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                                    {template.description}
                                </p>

                                {/* Controls */}
                                <div className="flex items-center gap-2">
                                    {/* Toggle Pro/Free */}
                                    <button
                                        onClick={() => updateTemplate(template.id, { is_pro: !isPro })}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${isPro
                                                ? "bg-yellow-500/20 text-yellow-400"
                                                : "bg-gray-700 text-gray-400"
                                            }`}
                                    >
                                        {isPro ? "Pro" : "Free"}
                                    </button>

                                    {/* Toggle Featured */}
                                    <button
                                        onClick={() => updateTemplate(template.id, { is_featured: !isFeatured })}
                                        className={`p-2 rounded-lg transition-colors ${isFeatured
                                                ? "bg-yellow-500/20 text-yellow-400"
                                                : "bg-gray-700 text-gray-400"
                                            }`}
                                        title="Toggle Featured"
                                    >
                                        <Star className="w-4 h-4" />
                                    </button>

                                    {/* Toggle Hidden */}
                                    <button
                                        onClick={() => updateTemplate(template.id, { is_hidden: !isHidden })}
                                        className={`p-2 rounded-lg transition-colors ${isHidden
                                                ? "bg-red-500/20 text-red-400"
                                                : "bg-gray-700 text-gray-400"
                                            }`}
                                        title={isHidden ? "Show" : "Hide"}
                                    >
                                        {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// ============================================
// REVIEWS TAB
// ============================================
function ReviewsTab({ supabase }: { supabase: any }) {
    const [reviews, setReviews] = useState<ReviewRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setLoading(true);
        const { data } = await supabase
            .from("reviews")
            .select("*")
            .order("created_at", { ascending: false });

        setReviews(data || []);
        setLoading(false);
    };

    const deleteReview = async (reviewId: string) => {
        if (!confirm("Delete this review?")) return;

        await fetch("/api/admin/reviews", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reviewId })
        });

        setReviews(prev => prev.filter(r => r.id !== reviewId));
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Reviews</h1>
                    <p className="text-gray-400">{reviews.length} total reviews</p>
                </div>
                <button
                    onClick={fetchReviews}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No reviews yet</div>
                ) : (
                    reviews.map(review => (
                        <div
                            key={review.id}
                            className="p-4 bg-gray-900 border border-gray-800 rounded-xl"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-medium text-white">{review.user_name || "Anonymous"}</span>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-4 h-4 ${i < review.rating
                                                            ? "text-yellow-400 fill-yellow-400"
                                                            : "text-gray-600"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm text-gray-400">
                                            for {review.template_id}
                                        </span>
                                    </div>
                                    {review.review_text && (
                                        <p className="text-gray-300">{review.review_text}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-2">
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => deleteReview(review.id)}
                                    className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                                    title="Delete Review"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// ============================================
// ANALYTICS TAB
// ============================================
function AnalyticsTab({ supabase }: { supabase: any }) {
    const [stats, setStats] = useState({
        totalUsers: 0,
        proUsers: 0,
        totalDownloads: 0,
        totalGenerations: 0,
        totalReviews: 0,
        avgRating: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);

        const [users, downloads, generations, reviews] = await Promise.all([
            supabase.from("users").select("subscription_plan"),
            supabase.from("template_downloads").select("id", { count: "exact", head: true }),
            supabase.from("ai_generations").select("id", { count: "exact", head: true }),
            supabase.from("reviews").select("rating")
        ]);

        const userList = users.data || [];
        const reviewList = reviews.data || [];

        setStats({
            totalUsers: userList.length,
            proUsers: userList.filter((u: any) => u.subscription_plan === "pro").length,
            totalDownloads: downloads.count || 0,
            totalGenerations: generations.count || 0,
            totalReviews: reviewList.length,
            avgRating: reviewList.length > 0
                ? reviewList.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewList.length
                : 0
        });

        setLoading(false);
    };

    const statsCards = [
        { label: "Total Users", value: stats.totalUsers, icon: Users, color: "blue" },
        { label: "Pro Users", value: stats.proUsers, icon: Crown, color: "yellow" },
        { label: "Total Downloads", value: stats.totalDownloads, icon: Download, color: "green" },
        { label: "AI Generations", value: stats.totalGenerations, icon: Sparkles, color: "purple" },
        { label: "Total Reviews", value: stats.totalReviews, icon: MessageSquare, color: "pink" },
        { label: "Avg Rating", value: stats.avgRating.toFixed(1), icon: Star, color: "yellow" },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Analytics</h1>
                    <p className="text-gray-400">Overview of your platform</p>
                </div>
                <button
                    onClick={fetchStats}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="p-8 text-center text-gray-500">Loading analytics...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {statsCards.map((stat, i) => (
                        <div
                            key={i}
                            className="p-6 bg-gray-900 border border-gray-800 rounded-xl"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${stat.color}-500/20`}>
                                    <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">{stat.label}</p>
                                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Conversion Rate */}
            <div className="mt-8 p-6 bg-gray-900 border border-gray-800 rounded-xl">
                <h3 className="text-lg font-semibold mb-4">Conversion Metrics</h3>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <p className="text-sm text-gray-400 mb-1">Pro Conversion Rate</p>
                        <p className="text-2xl font-bold text-green-400">
                            {stats.totalUsers > 0
                                ? ((stats.proUsers / stats.totalUsers) * 100).toFixed(1)
                                : 0}%
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 mb-1">AI Usage Rate</p>
                        <p className="text-2xl font-bold text-purple-400">
                            {stats.totalUsers > 0
                                ? ((stats.totalGenerations / stats.totalUsers)).toFixed(1)
                                : 0} per user
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
