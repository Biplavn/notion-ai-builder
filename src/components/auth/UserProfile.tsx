"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/useUser";
import { User, LogOut, CreditCard, LayoutDashboard, Crown, Shield, Sparkles } from "lucide-react";
import { LoginModal } from "./LoginModal";

export function UserProfile() {
    const router = useRouter();
    const { user, loading, isPro, remainingCredits, supabase } = useUser();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setIsDropdownOpen(false);
        router.push("/");
    };

    const handleNavigation = (path: string) => {
        setIsDropdownOpen(false);
        router.push(path);
    };

    if (loading) {
        return (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
        );
    }

    if (!user) {
        return (
            <>
                <button
                    onClick={() => setIsLoginOpen(true)}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                    Sign In
                </button>
                <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
            </>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
                {user.avatar_url ? (
                    <img
                        src={user.avatar_url}
                        alt={user.full_name || "User"}
                        className="w-8 h-8 rounded-full border border-border"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                        <span className="text-sm font-semibold">
                            {(user.full_name || user.email || "U").charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}
            </button>

            {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-background rounded-xl shadow-xl border border-border py-2 animate-in fade-in zoom-in-95 duration-100 z-50">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-border">
                        <div className="flex items-center gap-3">
                            {user.avatar_url ? (
                                <img
                                    src={user.avatar_url}
                                    alt={user.full_name || "User"}
                                    className="w-10 h-10 rounded-full border border-border"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                                    <span className="text-lg font-semibold">
                                        {(user.full_name || user.email || "U").charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-foreground">
                                    {user.full_name || "User"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {user.email}
                                </p>
                            </div>
                        </div>
                        {/* Plan Badge */}
                        <div className="mt-3 flex items-center justify-between">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                isPro
                                    ? "bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 dark:from-yellow-900/30 dark:to-orange-900/30 dark:text-orange-400"
                                    : "bg-muted text-muted-foreground"
                            }`}>
                                {isPro ? <Crown className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                                {isPro ? "Pro Plan" : "Free Plan"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {isPro ? "Unlimited" : `${remainingCredits} credits`}
                            </span>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="py-1">
                        <button
                            onClick={() => handleNavigation("/dashboard")}
                            className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-3 transition-colors"
                        >
                            <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                            <span>Dashboard</span>
                        </button>
                        <button
                            onClick={() => handleNavigation("/profile")}
                            className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-3 transition-colors"
                        >
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span>Profile</span>
                        </button>
                        <button
                            onClick={() => handleNavigation("/subscription")}
                            className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-3 transition-colors"
                        >
                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                            <span>Subscription</span>
                        </button>
                        {user.is_admin && (
                            <button
                                onClick={() => handleNavigation("/admin")}
                                className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-3 transition-colors"
                            >
                                <Shield className="w-4 h-4 text-muted-foreground" />
                                <span>Admin Panel</span>
                            </button>
                        )}
                    </div>

                    {/* Upgrade CTA for Free Users */}
                    {!isPro && (
                        <div className="px-3 py-2 border-t border-border">
                            <button
                                onClick={() => handleNavigation("/#pricing")}
                                className="w-full px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <Crown className="w-4 h-4" />
                                Upgrade to Pro
                            </button>
                        </div>
                    )}

                    {/* Sign Out */}
                    <div className="border-t border-border pt-1 mt-1">
                        <button
                            onClick={handleSignOut}
                            className="w-full px-4 py-2.5 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
