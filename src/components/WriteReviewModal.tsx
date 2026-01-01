"use client";

import { useState } from "react";
import { X, Send, AlertCircle } from "lucide-react";
import { StarRating } from "./StarRating";
import { useUser } from "@/lib/useUser";

interface WriteReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    templateId: string;
    templateName: string;
    existingReview?: {
        rating: number;
        review_text: string;
    };
    onSubmit: (rating: number, reviewText: string) => Promise<void>;
}

export function WriteReviewModal({
    isOpen,
    onClose,
    templateId,
    templateName,
    existingReview,
    onSubmit
}: WriteReviewModalProps) {
    const { user, isAuthenticated } = useUser();
    const [rating, setRating] = useState(existingReview?.rating || 0);
    const [reviewText, setReviewText] = useState(existingReview?.review_text || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!isAuthenticated) {
            setError("Please sign in to submit a review");
            return;
        }

        if (rating === 0) {
            setError("Please select a rating");
            return;
        }

        setIsSubmitting(true);

        try {
            await onSubmit(rating, reviewText);
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to submit review");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {existingReview ? "Edit Your Review" : "Write a Review"}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {templateName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Rating */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Your Rating *
                        </label>
                        <div className="flex items-center gap-4">
                            <StarRating
                                rating={rating}
                                size="lg"
                                interactive
                                onChange={setRating}
                            />
                            {rating > 0 && (
                                <span className="text-sm text-gray-500">
                                    {rating === 1 && "Poor"}
                                    {rating === 2 && "Fair"}
                                    {rating === 3 && "Good"}
                                    {rating === 4 && "Great"}
                                    {rating === 5 && "Excellent!"}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Review Text */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Your Review (Optional)
                        </label>
                        <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder="Share your experience with this template..."
                            rows={4}
                            maxLength={1000}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                        />
                        <p className="text-xs text-gray-400 text-right">
                            {reviewText.length}/1000
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || rating === 0}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    {existingReview ? "Update Review" : "Submit Review"}
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* User Info */}
                {user && (
                    <div className="px-6 pb-6 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-gray-400">
                            Posting as <span className="font-medium text-gray-600 dark:text-gray-300">{user.full_name || user.email}</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
