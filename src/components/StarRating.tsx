"use client";

import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    size?: "sm" | "md" | "lg";
    interactive?: boolean;
    showValue?: boolean;
    onChange?: (rating: number) => void;
    className?: string;
}

export function StarRating({
    rating,
    maxRating = 5,
    size = "md",
    interactive = false,
    showValue = false,
    onChange,
    className = ""
}: StarRatingProps) {
    const [hoverRating, setHoverRating] = useState(0);

    const sizeClasses = {
        sm: "w-3.5 h-3.5",
        md: "w-5 h-5",
        lg: "w-6 h-6"
    };

    const gapClasses = {
        sm: "gap-0.5",
        md: "gap-1",
        lg: "gap-1.5"
    };

    const displayRating = hoverRating || rating;

    return (
        <div className={`flex items-center ${gapClasses[size]} ${className}`}>
            <div className="flex items-center">
                {Array.from({ length: maxRating }, (_, index) => {
                    const starValue = index + 1;
                    const isFilled = starValue <= displayRating;
                    const isHalfFilled = starValue - 0.5 <= displayRating && starValue > displayRating;

                    return (
                        <button
                            key={index}
                            type="button"
                            disabled={!interactive}
                            onClick={() => interactive && onChange?.(starValue)}
                            onMouseEnter={() => interactive && setHoverRating(starValue)}
                            onMouseLeave={() => interactive && setHoverRating(0)}
                            className={`
                relative transition-transform duration-150
                ${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"}
                ${interactive && hoverRating >= starValue ? "scale-110" : ""}
              `}
                        >
                            {/* Background star (gray) */}
                            <Star
                                className={`
                  ${sizeClasses[size]}
                  text-gray-300 dark:text-gray-600
                  ${!isFilled && !isHalfFilled ? "opacity-100" : "opacity-0"}
                  transition-opacity duration-150
                `}
                            />

                            {/* Filled star (gold) */}
                            <Star
                                className={`
                  ${sizeClasses[size]}
                  absolute inset-0
                  text-yellow-400 fill-yellow-400
                  ${isFilled ? "opacity-100" : "opacity-0"}
                  transition-all duration-150
                `}
                            />

                            {/* Half star effect */}
                            {isHalfFilled && (
                                <div
                                    className="absolute inset-0 overflow-hidden"
                                    style={{ width: "50%" }}
                                >
                                    <Star
                                        className={`
                      ${sizeClasses[size]}
                      text-yellow-400 fill-yellow-400
                    `}
                                    />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {showValue && (
                <span className={`
          font-medium text-gray-700 dark:text-gray-300
          ${size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"}
        `}>
                    {rating.toFixed(1)}
                </span>
            )}
        </div>
    );
}

// Compact version showing just average + count
interface RatingSummaryProps {
    rating: number;
    reviewCount: number;
    size?: "sm" | "md";
    className?: string;
}

export function RatingSummary({
    rating,
    reviewCount,
    size = "md",
    className = ""
}: RatingSummaryProps) {
    return (
        <div className={`flex items-center gap-1.5 ${className}`}>
            <Star
                className={`
          ${size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} 
          text-yellow-400 fill-yellow-400
        `}
            />
            <span className={`
        font-medium text-gray-900 dark:text-white
        ${size === "sm" ? "text-xs" : "text-sm"}
      `}>
                {rating.toFixed(1)}
            </span>
            <span className={`
        text-gray-500 dark:text-gray-400
        ${size === "sm" ? "text-xs" : "text-sm"}
      `}>
                ({reviewCount})
            </span>
        </div>
    );
}
