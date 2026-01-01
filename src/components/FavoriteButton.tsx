"use client";

import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { useUser } from "@/lib/useUser";

interface FavoriteButtonProps {
    templateId: string;
    initialFavorited?: boolean;
    showCount?: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
    onToggle?: (isFavorited: boolean) => void;
}

export function FavoriteButton({
    templateId,
    initialFavorited = false,
    showCount = false,
    size = "md",
    className = "",
    onToggle
}: FavoriteButtonProps) {
    const { user, isAuthenticated, supabase } = useUser();
    const [isFavorited, setIsFavorited] = useState(initialFavorited);
    const [isLoading, setIsLoading] = useState(false);
    const [favoriteCount, setFavoriteCount] = useState(0);

    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6"
    };

    // Check if already favorited on mount
    useEffect(() => {
        if (!user) return;

        const checkFavorite = async () => {
            const { data } = await supabase
                .from("favorites")
                .select("id")
                .eq("user_id", user.id)
                .eq("template_id", templateId)
                .single();

            if (data) {
                setIsFavorited(true);
            }
        };

        checkFavorite();
    }, [user, templateId, supabase]);

    // Get favorite count
    useEffect(() => {
        if (!showCount) return;

        const getCount = async () => {
            const { count } = await supabase
                .from("favorites")
                .select("*", { count: "exact", head: true })
                .eq("template_id", templateId);

            setFavoriteCount(count || 0);
        };

        getCount();
    }, [templateId, showCount, supabase]);

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            // TODO: Show login modal
            alert("Please sign in to save favorites");
            return;
        }

        if (isLoading || !user) return;
        setIsLoading(true);

        try {
            if (isFavorited) {
                // Remove favorite
                await supabase
                    .from("favorites")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("template_id", templateId);

                setIsFavorited(false);
                setFavoriteCount((c) => Math.max(0, c - 1));
            } else {
                // Add favorite
                await supabase.from("favorites").insert({
                    user_id: user.id,
                    template_id: templateId
                });

                setIsFavorited(true);
                setFavoriteCount((c) => c + 1);
            }

            onToggle?.(!isFavorited);
        } catch (error) {
            console.error("Error toggling favorite:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={toggleFavorite}
            disabled={isLoading}
            className={`
        group relative flex items-center gap-1.5 p-2 rounded-full
        transition-all duration-200 ease-out
        ${isFavorited
                    ? "text-red-500 bg-red-500/10 hover:bg-red-500/20"
                    : "text-gray-400 hover:text-red-400 bg-white/5 hover:bg-white/10"
                }
        ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
            <Heart
                className={`
          ${sizeClasses[size]}
          transition-transform duration-200
          ${isFavorited ? "fill-current scale-110" : "group-hover:scale-110"}
        `}
            />
            {showCount && favoriteCount > 0 && (
                <span className="text-xs font-medium">{favoriteCount}</span>
            )}

            {/* Pulse animation on favorite */}
            {isFavorited && (
                <span className="absolute inset-0 rounded-full animate-ping bg-red-500/20 opacity-0 group-hover:opacity-100" />
            )}
        </button>
    );
}
