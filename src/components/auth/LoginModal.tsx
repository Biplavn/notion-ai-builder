"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Loader2 } from "lucide-react";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Singleton supabase client for auth
let supabaseAuthClient: ReturnType<typeof createClient> | null = null;

function getAuthClient() {
    if (!supabaseAuthClient) {
        supabaseAuthClient = createClient();
    }
    return supabaseAuthClient;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Use singleton client to prevent memory issues in Chrome
    const supabase = useMemo(() => getAuthClient(), []);

    // Reset form state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            // Delay reset to avoid flicker during close animation
            const timeout = setTimeout(() => {
                setError("");
                setLoading(false);
            }, 200);
            return () => clearTimeout(timeout);
        }
    }, [isOpen]);

    // Handle escape key to close modal
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !loading) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, loading, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Memoized close handler to prevent unnecessary rerenders
    const handleClose = useCallback(() => {
        if (!loading) {
            onClose();
        }
    }, [loading, onClose]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (isSignUp) {
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                        },
                    },
                });
                if (signUpError) throw signUpError;

                // Create user record in public.users table
                if (data?.user) {
                    await supabase.from("users").upsert({
                        id: data.user.id,
                        email: data.user.email,
                        full_name: name || null,
                        subscription_plan: "free",
                        subscription_status: "active",
                        ai_generations_lifetime: 0,
                        bonus_credits: 0,
                        is_suspended: false,
                        is_admin: data.user.email === "biplavsoccer007@gmail.com",
                        updated_at: new Date().toISOString()
                    }, { onConflict: "id" });
                }
            } else {
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;

                // Ensure user exists in public.users table (for users who signed up before this fix)
                if (data?.user) {
                    await supabase.from("users").upsert({
                        id: data.user.id,
                        email: data.user.email,
                        full_name: data.user.user_metadata?.full_name || null,
                        subscription_plan: "free",
                        subscription_status: "active",
                        ai_generations_lifetime: 0,
                        bonus_credits: 0,
                        is_suspended: false,
                        is_admin: data.user.email === "biplavsoccer007@gmail.com",
                        updated_at: new Date().toISOString()
                    }, { onConflict: "id", ignoreDuplicates: true });
                }
            }
            onClose();
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError("");
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) {
                // Check if it's a configuration error
                if (error.message.includes('not enabled') || error.message.includes('provider')) {
                    throw new Error('Google login is not configured yet. Please use email/password login or contact support.');
                }
                throw error;
            }

            // OAuth will redirect, so we don't close the modal here
        } catch (err: any) {
            console.error('Google OAuth error:', err);
            setError(err.message || "Google login is currently unavailable. Please use email/password login.");
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4"
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-modal-title"
        >
            <div
                className="bg-background w-full max-w-md rounded-xl shadow-xl border border-border p-6 relative animate-in zoom-in-95 duration-200 my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Close login modal"
                    disabled={loading}
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                    <h2 id="login-modal-title" className="text-2xl font-bold mb-2">
                        {isSignUp ? "Create an Account" : "Welcome Back"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {isSignUp
                            ? "Join thousands of Notion creators today."
                            : "Sign in to access your templates and dashboard."}
                    </p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2.5 rounded-lg transition-colors"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                        )}
                        Continue with Google
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with email
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignUp && (
                            <div>
                                <label className="text-sm font-medium mb-1 block">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="John Doe"
                                />
                            </div>
                        )}

                        <div>
                            <label className="text-sm font-medium mb-1 block">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-200">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isSignUp ? "Create Account" : "Sign In"}
                        </button>
                    </form>

                    <div className="text-center text-sm">
                        <span className="text-muted-foreground">
                            {isSignUp ? "Already have an account? " : "Don't have an account? "}
                        </span>
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-primary hover:underline font-medium"
                        >
                            {isSignUp ? "Sign in" : "Sign up"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
