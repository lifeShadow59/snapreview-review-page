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
        Click on any feedback and paste it in google
      </h2>

      {/* Clipboard Success Message */}
      {showClipboardSuccess && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border border-green-200/50 rounded-xl shadow-sm">
          <p className="text-sm text-green-800 flex items-center font-medium">
            <div className="flex-shrink-0 w-5 h-5 mr-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span>Feedback copied to clipboard! Redirecting to Google Reviews...</span>
          </p>
        </div>
      )}

      {/* Feedback Options */}
      <div>
        {isLoadingFeedback ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="relative p-6 bg-gradient-to-br from-gray-50 via-purple-50/20 to-pink-50/10 border border-gray-100 rounded-xl">
                  <div className="space-y-3">
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-purple-100 to-gray-200 rounded-md w-3/4"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-pink-100 to-gray-200 rounded-md w-full"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-blue-100 to-gray-200 rounded-md w-2/3"></div>
                  </div>
                  <div className="absolute top-3 right-3 w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="absolute bottom-4 left-4 w-4 h-4 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : feedbackOptions.length > 0 ? (
          <>
            <div className="space-y-4 mb-6">
              {feedbackOptions.map((feedback, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleFeedbackSelect(feedback)}
                  className="relative w-full p-6 text-left bg-gradient-to-br from-white via-purple-50/30 to-pink-50/20 border border-purple-100/50 hover:border-purple-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 touch-manipulation group overflow-hidden"
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>

                  {/* Decorative bubble elements */}
                  <div className="absolute top-3 right-3 w-8 h-8 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-4 left-4 w-4 h-4 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full opacity-40 group-hover:opacity-80 transition-opacity duration-300"></div>
                  <div className="absolute top-1/2 right-8 w-2 h-2 bg-gradient-to-br from-pink-400/40 to-purple-400/40 rounded-full opacity-50 group-hover:opacity-90 transition-opacity duration-300"></div>

                  {/* Content */}
                  <div className="relative z-10">
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed group-hover:text-gray-900 font-medium mb-3">
                      {feedback}
                    </p>

                    {/* Action indicator */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-purple-600 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                        <div className="flex items-center bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm">
                          <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                          </svg>
                          Copy & Review
                        </div>
                      </div>

                      {/* Star rating visual */}
                      <div className="flex items-center space-x-0.5 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Subtle border gradient effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{
                    background: 'linear-gradient(45deg, transparent 48%, rgba(168, 85, 247, 0.1) 49%, rgba(168, 85, 247, 0.1) 51%, transparent 52%)',
                    backgroundSize: '20px 20px'
                  }}></div>
                </button>
              ))}
            </div>

          </>
        ) : (
          <div className="relative p-8 bg-gradient-to-br from-gray-50 via-purple-50/20 to-pink-50/10 border border-gray-200/50 rounded-xl text-center overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full"></div>
            <div className="absolute bottom-4 left-4 w-6 h-6 bg-gradient-to-br from-blue-400/15 to-purple-400/15 rounded-full"></div>

            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>

              <p className="text-sm text-gray-600 mb-2 font-medium">
                No feedback suggestions available at the moment.
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Please visit our Google Reviews page to leave your feedback directly.
              </p>

              {business.google_maps_url && (
                <button
                  type="button"
                  onClick={() => window.open(business.google_maps_url, '_blank')}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                  </svg>
                  Go to Google Reviews
                </button>
              )}
            </div>
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
