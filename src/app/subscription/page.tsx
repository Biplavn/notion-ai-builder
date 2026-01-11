"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Crown, CreditCard, Calendar, Download, Sparkles, ArrowRight,
    Check, X, Shield, Zap, ChevronRight, AlertCircle, RefreshCw,
    ExternalLink, Clock, TrendingUp
} from "lucide-react";
import { useUser } from "@/lib/useUser";
import Link from "next/link";

interface SubscriptionHistory {
    id: string;
    action: string;
    from_plan: string | null;
    to_plan: string | null;
    amount: number | null;
    created_at: string;
    notes: string | null;
}

interface PaymentTransaction {
    id: string;
    amount: number;
    status: string;
    payment_method: string | null;
    created_at: string;
}

export default function SubscriptionPage() {
    const router = useRouter();
    const { user, loading, isAuthenticated, isPro, supabase } = useUser();

    const [subscriptionHistory, setSubscriptionHistory] = useState<SubscriptionHistory[]>([]);
    const [paymentHistory, setPaymentHistory] = useState<PaymentTransaction[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/");
        }
    }, [loading, isAuthenticated, router]);

    useEffect(() => {
        if (user) {
            fetchSubscriptionData();
        }
    }, [user]);

    const fetchSubscriptionData = async () => {
        if (!user) return;

        setLoadingData(true);

        const [historyRes, paymentsRes] = await Promise.all([
            supabase
                .from("subscription_history")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false }),
            supabase
                .from("payment_transactions")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
        ]);

        if (historyRes.data) setSubscriptionHistory(historyRes.data);
        if (paymentsRes.data) setPaymentHistory(paymentsRes.data);

        setLoadingData(false);
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case "upgraded": return "text-green-500 bg-green-100 dark:bg-green-900/30";
            case "downgraded": return "text-orange-500 bg-orange-100 dark:bg-orange-900/30";
            case "canceled": return "text-red-500 bg-red-100 dark:bg-red-900/30";
            case "renewed": return "text-blue-500 bg-blue-100 dark:bg-blue-900/30";
            case "payment_failed": return "text-red-500 bg-red-100 dark:bg-red-900/30";
            default: return "text-gray-500 bg-gray-100 dark:bg-gray-900/30";
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "captured": return "text-green-500 bg-green-100 dark:bg-green-900/30";
            case "pending": return "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30";
            case "failed": return "text-red-500 bg-red-100 dark:bg-red-900/30";
            case "refunded": return "text-orange-500 bg-orange-100 dark:bg-orange-900/30";
            default: return "text-gray-500 bg-gray-100 dark:bg-gray-900/30";
        }
    };

    if (loading || loadingData) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    const bonusCredits = user.bonus_credits || 0;
    const totalCredits = isPro ? "Unlimited" : (Math.max(0, 5 - (user.ai_generations_lifetime || 0)) + bonusCredits);

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

                    <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg transition-colors"
                    >
                        Back to Profile
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Current Plan Card */}
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 mb-8 text-white">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                {isPro ? (
                                    <Crown className="w-8 h-8 text-yellow-300" />
                                ) : (
                                    <Shield className="w-8 h-8" />
                                )}
                                <h1 className="text-3xl font-bold">
                                    {isPro ? "Pro Plan" : "Free Plan"}
                                </h1>
                            </div>
                            <p className="text-white/90 mb-4">
                                {isPro
                                    ? "You have full access to all NotionStruct features"
                                    : "Upgrade to Pro for unlimited AI generations and premium templates"
                                }
                            </p>

                            {/* Quick Stats */}
                            <div className="flex flex-wrap gap-4">
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                                    <p className="text-white/70 text-sm">AI Credits</p>
                                    <p className="text-xl font-bold">{isPro ? "Unlimited" : totalCredits}</p>
                                </div>
                                {bonusCredits > 0 && (
                                    <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-yellow-400/30">
                                        <p className="text-yellow-200 text-sm">Bonus Credits</p>
                                        <p className="text-xl font-bold text-yellow-100">+{bonusCredits}</p>
                                    </div>
                                )}
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                                    <p className="text-white/70 text-sm">Status</p>
                                    <p className="text-xl font-bold capitalize">{user.subscription_status || "Active"}</p>
                                </div>
                            </div>
                        </div>

                        {!isPro && (
                            <Link
                                href="/#pricing"
                                className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg"
                            >
                                <Zap className="w-5 h-5" />
                                Upgrade to Pro
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        )}
                    </div>
                </div>

                {/* Plan Comparison */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Free Plan */}
                    <div className={`bg-white dark:bg-gray-900 rounded-2xl border-2 p-6 ${!isPro ? "border-blue-500" : "border-gray-200 dark:border-gray-800"}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Free Plan</h3>
                            {!isPro && (
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full">
                                    Current
                                </span>
                            )}
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-6">₹0<span className="text-lg font-normal text-gray-500">/month</span></p>

                        <ul className="space-y-3 mb-6">
                            <li className="flex items-start gap-2">
                                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-600 dark:text-gray-400">Unlimited free templates</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-600 dark:text-gray-400">5 AI generations (lifetime)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-400">No premium templates</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-400">Community support only</span>
                            </li>
                        </ul>
                    </div>

                    {/* Pro Plan */}
                    <div className={`bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl border-2 p-6 relative overflow-hidden ${isPro ? "border-yellow-500" : "border-yellow-300 dark:border-yellow-700"}`}>
                        {isPro && (
                            <div className="absolute top-4 right-4">
                                <span className="px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full shadow-lg">
                                    ACTIVE
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-3 mb-4">
                            <Crown className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Pro Plan</h3>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                            ₹799<span className="text-lg font-normal text-gray-500">/month</span>
                        </p>

                        <ul className="space-y-3 mb-6">
                            <li className="flex items-start gap-2">
                                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 dark:text-gray-300 font-medium">Everything in Free</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 dark:text-gray-300 font-medium">Unlimited AI generations</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 dark:text-gray-300 font-medium">All premium templates</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 dark:text-gray-300 font-medium">Priority support</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 dark:text-gray-300 font-medium">Early access to features</span>
                            </li>
                        </ul>

                        {!isPro && (
                            <Link
                                href="/#pricing"
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all shadow-lg"
                            >
                                <Zap className="w-4 h-4" />
                                Upgrade Now
                            </Link>
                        )}
                    </div>
                </div>

                {/* Subscription History */}
                {subscriptionHistory.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Subscription History</h2>
                            <button
                                onClick={fetchSubscriptionData}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <RefreshCw className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {subscriptionHistory.map(event => (
                                <div
                                    key={event.id}
                                    className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getActionColor(event.action)}`}>
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white capitalize">
                                                {event.action.replace("_", " ")}
                                            </p>
                                            {event.from_plan && event.to_plan && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {event.from_plan} → {event.to_plan}
                                                </p>
                                            )}
                                            {event.notes && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{event.notes}</p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(event.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    {event.amount && (
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            ₹{event.amount.toFixed(2)}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Payment History */}
                {paymentHistory.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment History</h2>
                            <button
                                onClick={fetchSubscriptionData}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <RefreshCw className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-800">
                                        <th className="text-left p-3 text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                                        <th className="text-left p-3 text-sm font-medium text-gray-500 dark:text-gray-400">Amount</th>
                                        <th className="text-left p-3 text-sm font-medium text-gray-500 dark:text-gray-400">Method</th>
                                        <th className="text-left p-3 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paymentHistory.map(payment => (
                                        <tr key={payment.id} className="border-b border-gray-100 dark:border-gray-800/50">
                                            <td className="p-3 text-sm text-gray-900 dark:text-white">
                                                {new Date(payment.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-3 text-sm font-medium text-gray-900 dark:text-white">
                                                ₹{payment.amount.toFixed(2)}
                                            </td>
                                            <td className="p-3 text-sm text-gray-600 dark:text-gray-400 capitalize">
                                                {payment.payment_method || "N/A"}
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                                    {payment.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* No History Message */}
                {subscriptionHistory.length === 0 && paymentHistory.length === 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No subscription history</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Your subscription and payment history will appear here
                        </p>
                        {!isPro && (
                            <Link
                                href="/#pricing"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                            >
                                <Crown className="w-4 h-4" />
                                Upgrade to Pro
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
