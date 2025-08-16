"use client";

import { useState, useEffect } from "react";

interface Business {
  id: string;
  name: string;
  business_type_name?: string;
  google_maps_url?: string;
}

// Main Review Form Component
export default function ReviewForm({ business }: { business: Business }) {
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(true);
  const [showClipboardSuccess, setShowClipboardSuccess] = useState(false);
  const [feedbackOptions, setFeedbackOptions] = useState<string[]>([]);

  // Fetch feedback options on component mount
  useEffect(() => {
    const fetchFeedbackOptions = async () => {
      try {
        const response = await fetch(`/api/businesses/${business.id}/feedback`);
        const data = await response.json();
        
        if (response.ok && data.feedbacks && data.feedbacks.length > 0) {
          setFeedbackOptions(data.feedbacks);
        }
      } catch (error) {
        console.error("Error fetching feedback options:", error);
      } finally {
        setIsLoadingFeedback(false);
      }
    };

    fetchFeedbackOptions();
  }, [business.id]);

  // Handle feedback selection with clipboard copy and redirect
  const handleFeedbackSelect = async (feedback: string) => {
    try {
      // Copy feedback to clipboard
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(feedback);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = feedback;
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
      setTimeout(() => setShowClipboardSuccess(false), 2000);
      
      // Small delay to ensure clipboard operation completes, then redirect
      setTimeout(() => {
        if (business.google_maps_url) {
          window.open(business.google_maps_url, '_blank');
        }
      }, 500);
      
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Still redirect even if clipboard fails
      if (business.google_maps_url) {
        window.open(business.google_maps_url, '_blank');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
        Leave a Review
      </h2>

      {/* Clipboard Success Message */}
      {showClipboardSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Feedback copied to clipboard! Redirecting to Google Reviews...
          </p>
        </div>
      )}

      {/* Feedback Options */}
      <div>
        {isLoadingFeedback ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-md"></div>
              </div>
            ))}
          </div>
        ) : feedbackOptions.length > 0 ? (
          <>
            <div className="space-y-3 mb-4">
              {feedbackOptions.map((feedback, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleFeedbackSelect(feedback)}
                  className="w-full p-4 text-left border-2 border-gray-200 bg-white hover:border-blue-300 hover:shadow-md rounded-md transition-all duration-200 touch-manipulation group"
                >
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed group-hover:text-gray-900">
                    {feedback}
                  </p>
                  <div className="mt-2 flex items-center text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-medium">Click to copy and review</span>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Multilingual Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-700 font-medium">
                  Please select one of the feedback options above
                </p>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  કૃપા કરીને ઉપરના પ્રતિસાદ વિકલ્પોમાંથી એક પસંદ કરો
                </p>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  कृपया ऊपर दिए गए फीडबैक विकल्पों में से एक का चयन करें
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-md text-center">
            <p className="text-sm text-gray-600 mb-2">
              No feedback suggestions available at the moment.
            </p>
            <p className="text-xs text-gray-500">
              Please visit our Google Reviews page to leave your feedback directly.
            </p>
            {business.google_maps_url && (
              <button
                type="button"
                onClick={() => window.open(business.google_maps_url, '_blank')}
                className="mt-3 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                Go to Google Reviews
              </button>
            )}
          </div>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 leading-relaxed text-center">
          Click on any feedback option above to copy it to your clipboard and be redirected to Google Reviews.
        </p>
      </div>
    </div>
  );
}
