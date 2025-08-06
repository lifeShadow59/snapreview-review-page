"use client";

import { useState } from "react";

interface Business {
  id: string;
  name: string;
  business_type_name?: string;
}

// Star Rating Component
function StarRating({
  rating,
  onRatingChange,
  readonly = false,
}: {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
}) {
  const [hover, setHover] = useState(0);

  const handleStarClick = (starIndex: number, isHalf: boolean) => {
    if (readonly || !onRatingChange) return;
    const newRating = isHalf ? starIndex - 0.5 : starIndex;
    onRatingChange(newRating);
  };

  const handleStarHover = (starIndex: number, isHalf: boolean) => {
    if (readonly) return;
    const hoverRating = isHalf ? starIndex - 0.5 : starIndex;
    setHover(hoverRating);
  };

  const renderStar = (starIndex: number) => {
    const currentRating = hover || rating;
    const isFull = currentRating >= starIndex;
    const isHalf =
      currentRating >= starIndex - 0.5 && currentRating < starIndex;

    if (readonly) {
      return (
        <span
          key={starIndex}
          className="relative text-3xl sm:text-4xl lg:text-5xl transition-colors cursor-default"
        >
          {/* Background star (gray) */}
          <span className="text-gray-300">★</span>
          {/* Filled portion */}
          {(isFull || isHalf) && (
            <span
              className="absolute top-0 left-0 text-yellow-400 overflow-hidden"
              style={{
                width: isFull ? "100%" : isHalf ? "50%" : "0%",
              }}
            >
              ★
            </span>
          )}
        </span>
      );
    }

    return (
      <button
        key={starIndex}
        type="button"
        className="relative text-3xl sm:text-4xl lg:text-5xl transition-all cursor-pointer hover:scale-110 focus:outline-none touch-manipulation"
        onMouseLeave={() => setHover(0)}
      >
        {/* Background star (gray) */}
        <span className="text-gray-300">★</span>

        {/* Left half overlay for half star */}
        <div
          className="absolute top-0 left-0 w-1/2 h-full"
          onClick={() => handleStarClick(starIndex, true)}
          onMouseEnter={() => handleStarHover(starIndex, true)}
        />

        {/* Right half overlay for full star */}
        <div
          className="absolute top-0 right-0 w-1/2 h-full"
          onClick={() => handleStarClick(starIndex, false)}
          onMouseEnter={() => handleStarHover(starIndex, false)}
        />

        {/* Filled portion */}
        {(isFull || isHalf) && (
          <span
            className="absolute top-0 left-0 text-yellow-400 overflow-hidden pointer-events-none"
            style={{
              width: isFull ? "100%" : isHalf ? "50%" : "0%",
            }}
          >
            ★
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
      <div className="flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2">
        {[1, 2, 3, 4, 5].map((star) => renderStar(star))}
      </div>
      <span className="text-center sm:text-left sm:ml-3 text-sm sm:text-base text-gray-600">
        {rating > 0 && (
          <>
            {rating} {rating === 1 ? "star" : "stars"}
          </>
        )}
      </span>
    </div>
  );
}

// Main Review Form Component
export default function ReviewForm({ business }: { business: Business }) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (!customerName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!customerPhone.trim()) {
      setError("Please enter your phone number");
      return;
    }

    if (
      customerPhone.trim() &&
      !/^[\+]?[1-9][\d]{0,15}$/.test(
        customerPhone.trim().replace(/[\s\-\(\)]/g, "")
      )
    ) {
      setError("Please enter a valid phone number");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: business.id,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          rating,
          reviewText: reviewText.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="text-center py-6 sm:py-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 px-2">
            Thank You!
          </h3>
          <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base px-2">
            Your review has been submitted successfully. We appreciate your
            feedback!
          </p>
          <p className="text-xs sm:text-sm text-gray-500 px-2">
            Your review will help other customers and improve our service.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
        Leave a Review
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Customer Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label
              htmlFor="customerName"
              className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2"
            >
              Your Name *
            </label>
            <input
              type="text"
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Your name"
              required
              className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
            />
          </div>
          <div>
            <label
              htmlFor="customerPhone"
              className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2"
            >
              Your Phone Number *
            </label>
            <input
              type="tel"
              id="customerPhone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              required
              className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
            />
          </div>
        </div>

        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
            Your Rating *
          </label>
          <StarRating rating={rating} onRatingChange={setRating} />
        </div>

        {/* Custom Review Text */}
        <div>
          <label
            htmlFor="reviewText"
            className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2"
          >
            Your Feedback
          </label>
          <textarea
            id="reviewText"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={3}
            placeholder="Tell us about your experience... (optional)"
            className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation resize-none"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm sm:text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={
            isSubmitting ||
            rating === 0 ||
            !customerName.trim() ||
            !customerPhone.trim()
          }
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-4 sm:py-3 rounded-md font-medium flex items-center justify-center transition-colors text-base sm:text-sm touch-manipulation"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              <span className="text-sm sm:text-base">Submitting Review...</span>
            </>
          ) : (
            <span className="text-sm sm:text-base">Submit Review</span>
          )}
        </button>
      </form>

      {/* Privacy Notice */}
      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 leading-relaxed">
          By submitting this review, you confirm that it is based on your
          genuine experience with this business. Your information will be kept
          private and used only for review verification purposes.
        </p>
      </div>
    </div>
  );
}
