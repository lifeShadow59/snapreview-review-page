"use client";

import { useState, useEffect } from "react";

interface Business {
  id: string;
  name: string;
  business_type_name?: string;
  google_maps_url?: string;
}

// Star Rating Component - Whole numbers only (1, 2, 3, 4, 5)
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

  const handleStarClick = (starIndex: number) => {
    if (readonly || !onRatingChange) return;
    onRatingChange(starIndex);
  };

  const handleStarHover = (starIndex: number) => {
    if (readonly) return;
    setHover(starIndex);
  };

  const renderStar = (starIndex: number) => {
    const currentRating = hover || rating;
    const isFilled = currentRating >= starIndex;

    if (readonly) {
      return (
        <span
          key={starIndex}
          className={`text-3xl sm:text-4xl lg:text-5xl transition-colors cursor-default ${
            isFilled ? "text-yellow-400" : "text-gray-300"
          }`}
        >
          ★
        </span>
      );
    }

    return (
      <button
        key={starIndex}
        type="button"
        className={`text-3xl sm:text-4xl lg:text-5xl transition-all duration-200 cursor-pointer hover:scale-125 focus:outline-none touch-manipulation ${
          isFilled ? "text-yellow-400" : "text-gray-300"
        }`}
        onClick={() => handleStarClick(starIndex)}
        onMouseEnter={() => handleStarHover(starIndex)}
        onMouseLeave={() => setHover(0)}
      >
        ★
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
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(true);
  const [showClipboardSuccess, setShowClipboardSuccess] = useState(false);

  // Fetch random feedback on component mount
  useEffect(() => {
    const fetchRandomFeedback = async () => {
      try {
        const response = await fetch(`/api/businesses/${business.id}/feedback`);
        const data = await response.json();
        
        if (response.ok && data.feedback) {
          setReviewText(data.feedback);
        }
      } catch (error) {
        console.error("Error fetching random feedback:", error);
      } finally {
        setIsLoadingFeedback(false);
      }
    };

    fetchRandomFeedback();
  }, [business.id]);

  // Handle rating change with clipboard copy and redirect for high ratings
  const handleRatingChange = async (newRating: number) => {
    setRating(newRating);
    
    // If rating is 4 or above and we have Google Maps URL, copy feedback and redirect
    if (newRating >= 4 && business.google_maps_url) {
      try {
        // Copy feedback to clipboard if there's content
        if (reviewText.trim()) {
          // For mobile devices, use the modern Clipboard API with fallback
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(reviewText.trim());
          } else {
            // Fallback for older browsers or non-secure contexts
            const textArea = document.createElement('textarea');
            textArea.value = reviewText.trim();
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            textArea.remove();
          }
          
          // Show success message
          setShowClipboardSuccess(true);
          setTimeout(() => setShowClipboardSuccess(false), 3000);
        }
        
        // Small delay to ensure clipboard operation completes
        setTimeout(() => {
          // Redirect to Google Maps URL
          window.open(business.google_maps_url, '_blank');
        }, 100);
        
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        // Still redirect even if clipboard fails
        window.open(business.google_maps_url, '_blank');
      }
    }
  };

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
          <StarRating rating={rating} onRatingChange={handleRatingChange} />
          {rating >= 4 && business.google_maps_url && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                🌟 Great rating! We've copied your feedback to help you leave a Google review. 
                You'll be redirected to Google Reviews where you can paste your feedback.
              </p>
            </div>
          )}
          {showClipboardSuccess && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Feedback copied to clipboard!
              </p>
            </div>
          )}
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
            placeholder={isLoadingFeedback ? "Loading suggestion..." : "Tell us about your experience... (optional)"}
            disabled={isLoadingFeedback}
            className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation resize-none disabled:bg-gray-50 disabled:text-gray-500"
          />
          {reviewText && !isLoadingFeedback && (
            <p className="text-xs text-gray-500 mt-1">
              Feel free to edit this suggestion or write your own feedback
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm sm:text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button - Only show for ratings below 4 */}
        {rating < 4 && (
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
        )}

        {/* Google Review Button - Show for ratings 4 and above */}
        {rating >= 4 && business.google_maps_url && (
          <button
            type="button"
            onClick={() => window.open(business.google_maps_url, '_blank')}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 sm:py-3 rounded-md font-medium flex items-center justify-center transition-colors text-base sm:text-sm touch-manipulation"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
            </svg>
            <span className="text-sm sm:text-base">Continue to Google Reviews</span>
          </button>
        )}

        {/* Fallback for high ratings without Google Maps URL */}
        {rating >= 4 && !business.google_maps_url && (
          <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-md text-center">
            <p className="text-sm text-yellow-800">
              🌟 Thank you for the great rating! Please consider leaving a review on Google to help other customers find us.
            </p>
          </div>
        )}
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
