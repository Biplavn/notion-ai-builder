"use client";

import { useState, useEffect } from "react";
import { StarRating } from "./StarRating";
import { ThumbsUp, MessageSquare, MoreHorizontal, Flag, Pencil, Trash2 } from "lucide-react";
import { useUser } from "@/lib/useUser";

interface Review {
    id: string;
    user_id: string;
    user_name: string | null;
    user_avatar: string | null;
    template_id: string;
    rating: number;
    review_text: string | null;
    helpful_count: number;
    is_verified_purchase: boolean;
    created_at: string;
}

interface ReviewsListProps {
    templateId: string;
    onWriteReview: () => void;
}

export function ReviewsList({ templateId, onWriteReview }: ReviewsListProps) {
    const { user, supabase, isAuthenticated } = useUser();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [averageRating, setAverageRating] = useState(0);
    const [userReview, setUserReview] = useState<Review | null>(null);

    useEffect(() => {
        fetchReviews();
    }, [templateId]);

    const fetchReviews = async () => {
        try {
            const { data, error } = await supabase
                .from("reviews")
                .select("*")
                .eq("template_id", templateId)
                .order("created_at", { ascending: false });

            if (error) throw error;

            setReviews(data || []);

            // Calculate average
            if (data && data.length > 0) {
                const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
                setAverageRating(avg);
            }

            // Find user's review
            if (user) {
                const myReview = data?.find(r => r.user_id === user.id);
                setUserReview(myReview || null);
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleHelpful = async (reviewId: string) => {
        if (!isAuthenticated) {
            alert("Please sign in to mark reviews as helpful");
            return;
        }

        // Optimistic update
        setReviews(prev => prev.map(r =>
            r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r
        ));

        // Update in DB
        await supabase
            .from("reviews")
            .update({ helpful_count: reviews.find(r => r.id === reviewId)!.helpful_count + 1 })
            .eq("id", reviewId);
    };

    const handleDelete = async (reviewId: string) => {
        if (!confirm("Are you sure you want to delete your review?")) return;

        await supabase.from("reviews").delete().eq("id", reviewId);
        setReviews(prev => prev.filter(r => r.id !== reviewId));
        setUserReview(null);
    };

    // Distribution calculation
    const distribution = [5, 4, 3, 2, 1].map(stars => ({
        stars,
        count: reviews.filter(r => r.rating === stars).length,
        percentage: reviews.length > 0
            ? (reviews.filter(r => r.rating === stars).length / reviews.length) * 100
            : 0
    }));

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header with Summary */}
            <div className="flex flex-col md:flex-row gap-8">
                {/* Average Rating */}
                <div className="flex-shrink-0 text-center md:text-left">
                    <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                        {averageRating.toFixed(1)}
                    </div>
                    <StarRating rating={averageRating} size="lg" showValue={false} />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                    </p>
                </div>

                {/* Distribution */}
                <div className="flex-1 space-y-2">
                    {distribution.map(({ stars, count, percentage }) => (
                        <div key={stars} className="flex items-center gap-3">
                            <span className="text-sm text-gray-500 w-12">{stars} star</span>
                            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                            <span className="text-sm text-gray-400 w-8">{count}</span>
                        </div>
                    ))}
                </div>

                {/* Write Review Button */}
                <div className="flex-shrink-0">
                    <button
                        onClick={onWriteReview}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/25"
                    >
                        <MessageSquare className="w-4 h-4" />
                        {userReview ? "Edit Your Review" : "Write a Review"}
                    </button>
                </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-6">
                {reviews.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No Reviews Yet
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            Be the first to share your experience with this template!
                        </p>
                        <button
                            onClick={onWriteReview}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                            Write the First Review
                        </button>
                    </div>
                ) : (
                    reviews.map(review => (
                        <ReviewCard
                            key={review.id}
                            review={review}
                            isOwner={user?.id === review.user_id}
                            onHelpful={() => handleHelpful(review.id)}
                            onEdit={onWriteReview}
                            onDelete={() => handleDelete(review.id)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

// Individual Review Card
function ReviewCard({
    review,
    isOwner,
    onHelpful,
    onEdit,
    onDelete
}: {
    review: Review;
    isOwner: boolean;
    onHelpful: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="p-6 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                        {review.user_avatar ? (
                            <img
                                src={review.user_avatar}
                                alt={review.user_name || "User"}
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            (review.user_name || "U")[0].toUpperCase()
                        )}
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                                {review.user_name || "Anonymous"}
                            </span>
                            {review.is_verified_purchase && (
                                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                                    Verified
                                </span>
                            )}
                            {isOwner && (
                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                                    You
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <StarRating rating={review.rating} size="sm" />
                            <span className="text-sm text-gray-400">
                                {new Date(review.created_at).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric"
                                })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Menu */}
                {isOwner && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </button>

                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowMenu(false)}
                                />
                                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 overflow-hidden">
                                    <button
                                        onClick={() => { onEdit(); setShowMenu(false); }}
                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <Pencil className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => { onDelete(); setShowMenu(false); }}
                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Review Text */}
            {review.review_text && (
                <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    {review.review_text}
                </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 pt-2">
                <button
                    onClick={onHelpful}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                    <ThumbsUp className="w-4 h-4" />
                    Helpful ({review.helpful_count})
                </button>
                <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <Flag className="w-4 h-4" />
                    Report
                </button>
            </div>
        </div>
    );
}
